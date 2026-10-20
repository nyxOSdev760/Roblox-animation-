"""Generate the synthesized sound effects used by the animations.

Usage: python3 -I tools/sfx_synth.py <out dir>     (e.g. assets/sfx/synth)

Everything is deterministic (fixed random seed), mono 44.1 kHz WAV, peak-normalised.
  pluck_<note>.wav  pizzicato pluck (Karplus-Strong) for sneaking footsteps
  slide_up.wav      cartoon slide whistle going up (wind-up)
  whoosh.wav        short swing
  whoosh_long.wav   air rushing past while flying
  punch.wav         hard hit
  thud.wav          body hitting the ground
  ambience.wav      8 s outdoor bed: soft breeze and a few birds
"""
import sys
import wave
from pathlib import Path

import numpy as np

SR = 44100
rng = np.random.default_rng(7)

NOTES = {"A3": 220.0, "Bb3": 233.08, "B3": 246.94, "C4": 261.63, "Db4": 277.18, "D4": 293.66, "Eb4": 311.13, "E4": 329.63}


def t_axis(dur):
    return np.arange(int(SR * dur)) / SR


def norm(x, peak=0.89):
    return x / max(1e-9, np.abs(x).max()) * peak


def lowpass(x, cutoff):
    # One-pole low-pass, run forwards and backwards for a softer slope.
    a = np.exp(-2 * np.pi * cutoff / SR)
    for _ in range(2):
        y = np.empty_like(x)
        acc = 0.0
        for i, v in enumerate(x):
            acc = (1 - a) * v + a * acc
            y[i] = acc
        x = y[::-1]
    return x


def pluck(freq, dur=0.4):
    n = int(SR * dur)
    period = int(SR / freq)
    buf = rng.uniform(-1, 1, period)
    out = np.empty(n)
    for i in range(n):
        j = i % period
        out[i] = buf[j]
        buf[j] = 0.5 * (buf[j] + buf[(j + 1) % period]) * 0.996
    out *= np.exp(-t_axis(dur) * 7)
    return norm(out, 0.8)


def slide_up(dur=0.3):
    t = t_axis(dur)
    f = 450 + 1300 * (t / dur) ** 1.4
    f *= 1 + 0.025 * np.sin(2 * np.pi * 14 * t)
    phase = 2 * np.pi * np.cumsum(f) / SR
    env = np.minimum(1, t / 0.02) * np.minimum(1, (dur - t) / 0.04)
    return norm((np.sin(phase) + 0.15 * np.sin(2 * phase)) * env, 0.6)


def whoosh(dur, center, width):
    t = t_axis(dur)
    noise = rng.uniform(-1, 1, len(t))
    # Band-limited noise: difference of two low-passes, cutoff sweeping with the envelope.
    hi = lowpass(noise, center + width / 2)
    lo = lowpass(noise, max(80, center - width / 2))
    env = np.sin(np.pi * t / dur) ** 2
    return norm((hi - lo) * env, 0.7)


def punch():
    t = t_axis(0.45)
    f = 60 + 300 * np.exp(-t * 38)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 12)
    crack = lowpass(rng.uniform(-1, 1, len(t)), 3500) * np.exp(-t * 55) * 2.5
    return norm(np.tanh(1.8 * (body + crack)))


def thud():
    t = t_axis(0.5)
    f = 48 + 120 * np.exp(-t * 26)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    dirt = lowpass(rng.uniform(-1, 1, len(t)), 900) * np.exp(-t * 30) * 1.5
    return norm(np.tanh(1.5 * (body + dirt)))


def chirp(start, dur, f0, f1):
    t = t_axis(dur)
    f = f0 + (f1 - f0) * (t / dur)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / dur) ** 2
    return start, s


def ambience(dur=8.0):
    t = t_axis(dur)
    wind = lowpass(rng.uniform(-1, 1, len(t)), 350)
    wind = norm(wind, 1) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.17 * t + 1.0))
    out = wind * 0.35
    # A couple of birds: short rising/falling chirps in little phrases.
    for base, phrase_start in [(3600, 0.6), (4200, 3.1), (3300, 5.4)]:
        for i in range(4):
            start, s = chirp(phrase_start + i * 0.11, 0.07, base + 600 * (i % 2), base + 1400 - 300 * (i % 2))
            a = int(start * SR)
            out[a : a + len(s)] += 0.25 * s
    return norm(out, 0.5)


def write(path, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def main() -> None:
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    for name, f in NOTES.items():
        write(out / f"pluck_{name}.wav", pluck(f))
    write(out / "slide_up.wav", slide_up())
    write(out / "whoosh.wav", whoosh(0.22, 1600, 2400))
    write(out / "whoosh_long.wav", whoosh(0.7, 900, 1400))
    write(out / "punch.wav", punch())
    write(out / "thud.wav", thud())
    write(out / "ambience.wav", ambience())
    print("wrote", sorted(p.name for p in out.iterdir()))


if __name__ == "__main__":
    main()
