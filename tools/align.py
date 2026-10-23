"""Word timings for a narration track, matched to the script's own words.

Usage (needs faster-whisper):  python tools/align.py <voice dir>
Reads <voice dir>/narration.flac and lines.json (from tools/narrate.py) and writes
<voice dir>/words.json: [{"word": "Twinkletoes!", "start": 101.2, "end": 101.8, "line": 20}, ...]

Whisper transcribes each line's clip (lines/<file>) with word timestamps, offset by where
the line starts; those are matched to the script's words, so captions keep the script's
spelling and punctuation. It also reports words
Whisper heard differently, which is a quick way to catch a garbled TTS line.
"""
import difflib
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel


def norm(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())


def pcm16k(path):
    out = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(out, np.int16).astype(np.float32) / 32768


def align_line(model, line, clip):
    """Times for one line's words, from transcribing that line's own clip."""
    script = line["text"].split()
    a = [norm(w) for w in script]
    audio = pcm16k(clip)
    # A prompt with the line's text sometimes makes Whisper skip ahead, so try without it
    # first and keep whichever pass matches more of the script.
    best = None
    for prompt in (None, line["text"]):
        segs, _ = model.transcribe(audio, word_timestamps=True, initial_prompt=prompt, vad_filter=False)
        h = [(w.word.strip(), line["start"] + w.start, line["start"] + w.end) for s in segs for w in s.words]
        score = sum(blk.size for blk in difflib.SequenceMatcher(a=a, b=[norm(w) for w, _, _ in h], autojunk=False).get_matching_blocks())
        if best is None or score > best[0]:
            best = (score, h)
        if score == len(a):
            break
    heard = best[1]
    b = [norm(w) for w, _, _ in heard]
    times = [None] * len(script)
    mismatches = []
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(a=a, b=b, autojunk=False).get_opcodes():
        if tag == "equal" or (tag == "replace" and i2 - i1 == j2 - j1):
            for k in range(i2 - i1):
                times[i1 + k] = (heard[j1 + k][1], heard[j1 + k][2])
        if tag != "equal":
            mismatches.append((" ".join(script[i1:i2]), " ".join(w for w, _, _ in heard[j1:j2])))

    # Words Whisper didn't catch: spread them between their timed neighbours.
    n = len(script)
    i = 0
    while i < n:
        if times[i] is not None:
            i += 1
            continue
        j = i
        while j < n and times[j] is None:
            j += 1
        lo = times[i - 1][1] if i > 0 else line["start"]
        hi = times[j][0] if j < n else line["end"]
        step = max(hi - lo, 0.01) / (j - i)
        for k in range(i, j):
            times[k] = (lo + step * (k - i), lo + step * (k - i + 0.8))
        i = j
    return [{"word": w, "start": round(t[0], 3), "end": round(t[1], 3), "line": line["index"]} for w, t in zip(script, times)], mismatches


def main() -> None:
    d = Path(sys.argv[1])
    lines = json.loads((d / "lines.json").read_text())
    model = WhisperModel("small.en", device="cpu", compute_type="int8")
    words, mismatches = [], []
    for line in lines:
        w, m = align_line(model, line, d / "lines" / line["file"])
        words += w
        mismatches += [(line["index"], *x) for x in m]
    (d / "words.json").write_text(json.dumps(words, indent=0))
    print(f"{len(words)} words aligned")
    for li, want, got in mismatches:
        print(f"  line {li:2d}  script: {want!r:40}  heard: {got!r}")


if __name__ == "__main__":
    main()
