"""Turn a story script into a narration track with Fish Audio text-to-speech.

Usage: python3 -I tools/narrate.py scripts/<story>.md <out dir> [--voice ID] [--gap 0.3]

Each paragraph of the script (after the # title) is one TTS request, cached by its text
in <out dir>/lines/, so editing one paragraph only regenerates that paragraph. The lines
are joined with short pauses into <out dir>/narration.flac, and <out dir>/lines.json
records where each paragraph starts and ends. Word timings come from tools/align.py.

Pronunciation: write {shown|spoken} in the script, e.g. {Theo|Thee-oh}. Captions (and
lines.json) show the first part; the voice is sent the second.

The API key is injected by the environment's proxy for api.fish.audio.
"""
import argparse
import hashlib
import re
import json
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ADAM = "9259a7392c454a1eb6436141abb5a558"  # "adam adam" by John Wehib
MODEL = "s2.1-pro-free"
SR = 44100


def paragraphs(md: str):
    out = []
    for block in md.split("\n\n"):
        text = " ".join(block.split())
        if text and not text.startswith("#"):
            out.append(text)
    return out


SAY = re.compile(r"\{([^|{}]+)\|([^{}]+)\}")


def shown(text):
    return SAY.sub(lambda m: m.group(1), text)


def spoken(text):
    return SAY.sub(lambda m: m.group(2), text)


def tts(text, voice, dest: Path, retries=5):
    body = json.dumps({"text": text, "reference_id": voice, "format": "wav", "normalize": True, "latency": "normal"}).encode()
    for attempt in range(retries):
        req = urllib.request.Request(
            "https://api.fish.audio/v1/tts",
            data=body,
            headers={"Content-Type": "application/json", "model": MODEL},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                dest.write_bytes(r.read())
                return
        except urllib.error.HTTPError as e:
            msg = e.read()[:300]
            if e.code in (429, 500, 502, 503) and attempt < retries - 1:
                time.sleep(10 * (attempt + 1))
                continue
            raise RuntimeError(f"TTS failed ({e.code}): {msg!r}")


def duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


def trim(src: Path, dest: Path):
    """Cut leading/trailing silence so the pauses between lines are ours to control."""
    f = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse," \
        "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af", f, "-ar", str(SR), "-ac", "1", str(dest)], check=True)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("script")
    ap.add_argument("out")
    ap.add_argument("--voice", default=ADAM)
    ap.add_argument("--gap", type=float, default=0.3)
    a = ap.parse_args()

    out = Path(a.out)
    (out / "lines").mkdir(parents=True, exist_ok=True)
    texts = paragraphs(Path(a.script).read_text())
    files, lines, t = [], [], 0.0
    for i, text in enumerate(texts):
        key = hashlib.sha1(f"{a.voice}|{MODEL}|{text}".encode()).hexdigest()[:12]
        raw = out / "lines" / f"{key}.raw.wav"
        clean = out / "lines" / f"{key}.wav"
        if not clean.exists():
            print(f"[{i + 1}/{len(texts)}] {text[:60]}...", flush=True)
            tts(spoken(text), a.voice, raw)
            trim(raw, clean)
            raw.unlink()
        d = duration(clean)
        lines.append({"index": i, "text": shown(text), "start": round(t, 3), "end": round(t + d, 3), "file": clean.name})
        files.append(clean)
        t += d + a.gap

    # Join: each line followed by a pause.
    concat = out / "concat.txt"
    silence = out / "lines" / f"gap{a.gap}.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=mono", "-t", str(a.gap), str(silence)], check=True)
    concat.write_text("".join(f"file '{p.resolve()}'\nfile '{silence.resolve()}'\n" for p in files))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(concat), "-ar", str(SR), "-ac", "1", str(out / "narration.flac")], check=True)
    concat.unlink()
    (out / "lines.json").write_text(json.dumps(lines, indent=1))
    print(f"narration: {t:.1f}s, {len(lines)} lines -> {out / "narration.flac"}")


if __name__ == "__main__":
    sys.exit(main())
