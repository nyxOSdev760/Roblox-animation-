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
  bloop_down.wav    shrinking "bloop"; bloop_up.wav the growing one
  squeak.wav        tiny squeaks (three chirps)
  pop.wav           a popcorn pop
  music_loop.wav    20.9 s mellow e-piano / bass / hats loop (92 bpm), loops seamlessly
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


def bloop(f0, f1, dur=0.2):
    t = t_axis(dur)
    f = f0 * (f1 / f0) ** (t / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR
    env = np.minimum(1, t / 0.008) * np.exp(-t * 9)
    wob = 1 + 0.3 * np.sin(2 * np.pi * 34 * t) * np.exp(-t * 20)
    return norm(np.sin(ph) * env * wob + 0.25 * np.sin(2 * ph) * env, 0.8)


def squeak():
    out = np.zeros(int(SR * 0.42))
    for k, (start, f0, f1) in enumerate([(0.0, 2200, 3200), (0.14, 2400, 3500), (0.27, 2100, 3300)]):
        t = t_axis(0.09)
        f = f0 + (f1 - f0) * np.sin(np.pi * t / 0.09)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.09) ** 2
        a = int(start * SR)
        out[a : a + len(s)] += s
    return norm(out, 0.6)


def pop():
    t = t_axis(0.12)
    click = rng.uniform(-1, 1, len(t)) * np.exp(-t * 300)
    tone = np.sin(2 * np.pi * np.cumsum(500 + 900 * np.exp(-t * 60)) / SR) * np.exp(-t * 40)
    return norm(click * 0.6 + tone, 0.7)


def epiano(freq, dur, vel=1.0):
    """FM electric piano note."""
    t = t_axis(dur)
    index = 1.6 * np.exp(-t * 3.5)
    mod = np.sin(2 * np.pi * freq * t) * index
    car = np.sin(2 * np.pi * freq * t + mod)
    env = np.minimum(1, t / 0.004) * np.exp(-t * 1.6)
    trem = 1 + 0.08 * np.sin(2 * np.pi * 5 * t)
    return car * env * trem * vel


def music_loop():
    bpm = 92
    beat = 60 / bpm
    bars = 8
    total = int(SR * beat * 4 * bars)
    out = np.zeros(total + SR * 3)
    hz = lambda n: 440 * 2 ** ((n - 69) / 12)
    # Cmaj7, Am7, Fmaj7, G6 (midi notes), twice.
    chords = [[48, 52, 55, 59, 64], [45, 52, 55, 60, 64], [41, 48, 52, 57, 60], [43, 50, 55, 59, 64]] * 2
    bass = [36, 33, 29, 31] * 2

    def add(sig, at, gain):
        a = int(at * SR)
        out[a : a + len(sig)] += sig * gain

    for b, (chord, root) in enumerate(zip(chords, bass)):
        t0 = b * 4 * beat
        for hit, length, vel in ((0, 2.4, 1.0), (1.5, 1.4, 0.65), (3.0, 1.2, 0.5)):
            for n in chord:
                add(epiano(hz(n), length * beat * 1.6, vel), t0 + hit * beat, 0.11)
        for hit in (0, 2, 2.5):
            t = t_axis(beat * 1.4)
            sig = np.sin(2 * np.pi * hz(root) * t) * np.exp(-t * 2.2) * np.minimum(1, t / 0.01)
            add(np.tanh(1.5 * sig), t0 + hit * beat, 0.32)
        for k in range(8):  # soft hats on 8ths, a gentle kick on 1 and 3
            t = t_axis(0.05)
            hat = lowpass(rng.uniform(-1, 1, len(t)), 9000) - lowpass(rng.uniform(-1, 1, len(t)), 5000)
            add(hat * np.exp(-t * 90), t0 + k * beat / 2, 0.05 if k % 2 else 0.08)
        for hit in (0, 2):
            t = t_axis(0.3)
            kick = np.sin(2 * np.pi * np.cumsum(45 + 90 * np.exp(-t * 30)) / SR) * np.exp(-t * 12)
            add(kick, t0 + hit * beat, 0.35)
    # Fold the tail of the last notes back onto the start so the loop is seamless.
    loop = out[:total].copy()
    loop[: len(out) - total] += out[total:]
    return norm(loop, 0.7)


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
    write(out / "bloop_down.wav", bloop(820, 260))
    write(out / "bloop_up.wav", bloop(260, 820))
    write(out / "squeak.wav", squeak())
    write(out / "pop.wav", pop())
    write(out / "music_loop.wav", music_loop())
    print("wrote", sorted(p.name for p in out.iterdir()))


if __name__ == "__main__":
    main()
