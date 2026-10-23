"""Word timings for a narration track, matched to the script's own words.

Usage (needs faster-whisper):  python tools/align.py <voice dir>
Reads <voice dir>/narration.flac and lines.json (from tools/narrate.py) and writes
<voice dir>/words.json: [{"word": "Twinkletoes!", "start": 101.2, "end": 101.8, "line": 20}, ...]

Whisper transcribes the audio with word timestamps; those are aligned to the script's
words, so captions keep the script's spelling and punctuation. It also reports words
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


def main() -> None:
    d = Path(sys.argv[1])
    lines = json.loads((d / "lines.json").read_text())
    pcm = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(d / "narration.flac"), "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
        capture_output=True, check=True,
    ).stdout
    audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
    model = WhisperModel("small.en", device="cpu", compute_type="int8")
    script_text = " ".join(l["text"] for l in lines)
    segs, _ = model.transcribe(audio, word_timestamps=True, initial_prompt=script_text[:800], vad_filter=False)
    heard = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]

    script = [(w, l["index"]) for l in lines for w in l["text"].split()]
    a = [norm(w) for w, _ in script]
    b = [norm(w) for w, _, _ in heard]
    times = [None] * len(script)
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    mismatches = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                times[i1 + k] = (heard[j1 + k][1], heard[j1 + k][2])
        else:
            if tag in ("replace", "delete", "insert"):
                mismatches.append((" ".join(w for w, _ in script[i1:i2]), " ".join(w for w, _, _ in heard[j1:j2])))
            if tag == "replace" and i2 - i1 == j2 - j1:
                for k in range(i2 - i1):
                    times[i1 + k] = (heard[j1 + k][1], heard[j1 + k][2])

    # Fill gaps by spreading unmatched words evenly between their matched neighbours,
    # clamped to their own line's time range.
    n = len(script)
    for i in range(n):
        if times[i] is None:
            j = i
            while j < n and times[j] is None:
                j += 1
            line = lines[script[i][1]]
            lo = times[i - 1][1] if i > 0 and times[i - 1] else line["start"]
            hi = times[j][0] if j < n and times[j] else line["end"]
            lo = max(lo, line["start"]) if script[i - 1][1] != script[i][1] else lo
            step = max(hi - lo, 0.01) / (j - i + 1)
            for k in range(i, j):
                s = lo + step * (k - i + 0.5)
                times[k] = (s, s + step * 0.8)

    words = [{"word": w, "start": round(t[0], 3), "end": round(t[1], 3), "line": li} for (w, li), t in zip(script, times)]
    (d / "words.json").write_text(json.dumps(words, indent=0))
    print(f"{len(words)} words aligned, {sum(1 for t in times if t)} timed")
    for want, got in mismatches:
        print(f"  script: {want!r:45}  heard: {got!r}")


if __name__ == "__main__":
    main()
