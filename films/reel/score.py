"""Synthesised score + SFX for the reel. Writes score.wav and beats.json next to this file.

Everything is placed on the musical grid from timeline.json, and every visual cue there gets its
SFX at exactly its cue time. Tails wrap around the end so the audio loops as seamlessly as the picture.
Run: .venv/bin/python films/reel/score.py
"""
import json, re, subprocess, pathlib
import numpy as np
import soundfile as sf
from scipy import signal
from numba import njit

HERE = pathlib.Path(__file__).parent
T = json.loads((HERE / 'timeline.json').read_text())
SR = 48000
DUR = T['duration']
N = int(DUR * SR)
B = 60 / T['bpm']
BAR = B * T['beatsPerBar']
S16 = B / 4
TAIL = 3 * SR
rng = np.random.default_rng(7)

dry = np.zeros((N + TAIL, 2))
wet = np.zeros((N + TAIL, 2))   # reverb send
log = {'kick': [], 'snare': [], 'hat': [], 'sfx': []}


def add(buf, t, x, gain=1.0, pan=0.0, send=0.0):
    """Mix mono x at time t (s). pan -1..1. send = amount also sent to reverb."""
    i = int(round(t * SR))
    x = np.asarray(x) * gain
    L, R = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    seg = slice(i, i + len(x))
    n = len(dry[seg])
    buf[seg, 0] += x[:n] * L * 1.414
    buf[seg, 1] += x[:n] * R * 1.414
    if send:
        wet[seg, 0] += x[:n] * L * send
        wet[seg, 1] += x[:n] * R * send


def tt(d):
    return np.arange(int(d * SR)) / SR


def env(d, a=0.002, decay=0.2):
    t = tt(d)
    return np.minimum(1, t / a) * np.exp(-t / decay)


def sweep_sine(d, f0, f1, curve=0.04):
    t = tt(d)
    f = f1 + (f0 - f1) * np.exp(-t / curve)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def noise(d):
    return rng.standard_normal(int(d * SR))


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], 'bandpass', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, 'highpass', fs=SR, output='sos'), x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, 'lowpass', fs=SR, output='sos'), x)


def mtof(m):
    return 440 * 2 ** ((m - 69) / 12)


# ---------- drums ----------
def kick():
    d = 0.45
    body = sweep_sine(d, 160, 46, 0.035) * env(d, 0.001, 0.22)
    click = hp(noise(0.006), 2000) * 0.3
    body[:len(click)] += click
    return np.tanh(body * 1.6)


def snare():
    d = 0.35
    tone = sweep_sine(d, 260, 185, 0.02) * env(d, 0.001, 0.06)
    nz = bp(noise(d), 1200, 9000) * env(d, 0.001, 0.11)
    clap = np.zeros(int(d * SR))
    for k, o in enumerate([0, 0.011, 0.022]):
        b = bp(noise(0.05), 900, 3000) * env(0.05, 0.0005, 0.012 if k < 2 else 0.05)
        i = int(o * SR)
        clap[i:i + len(b)] += b
    return tone * 0.6 + nz * 0.55 + clap * 0.6


def hat(open_=False):
    d = 0.3 if open_ else 0.06
    return hp(noise(d), 7500, 4) * env(d, 0.0005, 0.12 if open_ else 0.018)


KICK, SNARE, HAT, OHAT = kick(), snare(), hat(), hat(True)
kick_pat = {0, 6, 10}
for bar in range(6):
    t0 = bar * BAR
    for s in range(16):
        t = t0 + s * S16
        if s in kick_pat or (bar in (2, 5) and s == 14):
            add(dry, t, KICK, 0.72)
            log['kick'].append(t)
        if s in (4, 12):
            add(dry, t, SNARE, 0.55, 0.05, send=0.25)
            log['snare'].append(t)
        if s % 2 == 0 and s != 14:
            add(dry, t, HAT, 0.16 if s % 4 else 0.22, 0.3)
            log['hat'].append(t)
        elif s % 2 == 1 and bar % 2 == 1:
            add(dry, t, HAT, 0.07, 0.3)
        if s == 14:
            add(dry, t, OHAT, 0.12, 0.3, send=0.1)


def duck(t):
    """Sidechain gain from the kick pattern, for bass and pads."""
    g = np.ones_like(t)
    for k in log['kick']:
        for kk in (k - DUR, k, k + DUR):
            m = (t >= kk)
            g[m] = np.minimum(g[m], 1 - 0.75 * np.exp(-(t[m] - kk) / 0.11))
    return g


# ---------- harmony ----------
CHORDS = [[57, 60, 64], [53, 57, 60, 64], [55, 60, 64], [55, 59, 62], [53, 57, 62], [56, 59, 64]]
ROOTS = [33, 29, 36, 31, 38, 28]

tg = np.arange(N + TAIL) / SR
sc = duck(tg)

bass = np.zeros(N + TAIL)
pad = np.zeros(N + TAIL)
for bar in range(6):
    t0 = bar * BAR
    i0, i1 = int(t0 * SR), int((t0 + BAR) * SR)
    t = np.arange(i1 - i0) / SR
    f = mtof(ROOTS[bar])
    ph = 2 * np.pi * f * t
    b = np.sin(ph) + 0.45 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph) + 0.1 * np.sign(np.sin(ph))  # harmonics so phones hear it
    edge = np.minimum(1, np.minimum(t / 0.005, (BAR - t) / 0.01))
    bass[i0:i1] += np.tanh(1.4 * b) * edge
    # supersaw pad, filter opens across the bar
    p = np.zeros_like(t)
    for m in CHORDS[bar]:
        for det in (-0.12, -0.04, 0.05, 0.13):
            fm = mtof(m) * 2 ** (det / 12)
            p += 2 * ((t * fm + rng.random()) % 1) - 1
    p = lp(p, 900 + 1600 * (bar % 3) / 2) * edge
    pad[i0:i1] += p
bass *= sc
pad *= 0.5 + 0.5 * sc
add(dry, 0, bass, 0.17)
add(dry, 0, pad, 0.06, send=0.25)

# plucked 16th arps in the shape and curves bars
for bar in (1, 4):
    notes = CHORDS[bar]
    for s in range(16):
        m = notes[s % len(notes)] + 12 * (1 + (s // len(notes)) % 2)
        d = 0.18
        x = (2 * ((tt(d) * mtof(m)) % 1) - 1)
        x = lp(x, 2500) * env(d, 0.001, 0.05)
        add(dry, bar * BAR + s * S16, x, 0.09, -0.3 + 0.6 * (s % 2), send=0.3)


# ---------- SFX, one per visual cue ----------
def slam():
    d = 0.4
    x = sweep_sine(d, 140, 50, 0.04) * env(d, 0.001, 0.16)
    x += bp(noise(d), 500, 2500) * env(d, 0.0005, 0.025) * 0.8
    return np.tanh(1.5 * x)


def stretch():
    d = 0.32
    t = tt(d)
    f = 180 + 900 * (t / d) ** 2
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.01) * np.exp(-t / 0.18)
    return x + bp(noise(d), 2000, 6000) * env(d, 0.002, 0.05) * 0.3


def pop(f=1100):
    d = 0.14
    return sweep_sine(d, f * 1.8, f, 0.015) * env(d, 0.0008, 0.045)


def impact():
    d = 1.4
    x = sweep_sine(d, 90, 34, 0.08) * env(d, 0.001, 0.45)
    x += lp(noise(d), 3500) * env(d, 0.0005, 0.12) * 0.7
    return np.tanh(1.3 * x)


def morph(f):
    d = 0.3
    t = tt(d)
    mod = np.sin(2 * np.pi * f * 1.5 * t) * 3 * np.exp(-t / 0.06)
    x = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.5 * np.exp(-t / 0.05))) / SR + mod)
    return x * env(d, 0.002, 0.09)


def shimmer():
    out = np.zeros(int(0.8 * SR))
    for k in range(12):
        m = [69, 72, 76, 79, 81, 84][k % 6] + 12 * (k // 6)
        x = np.sin(2 * np.pi * mtof(m) * tt(0.2)) * env(0.2, 0.001, 0.05)
        i = int(k * 0.045 * SR)
        out[i:i + len(x)] += x * (0.6 + 0.4 * k / 12)
    return out


def bounce():
    d = 0.35
    x = sweep_sine(d, 320, 85, 0.05) * env(d, 0.001, 0.12)
    x += sweep_sine(d, 110, 45, 0.03) * env(d, 0.001, 0.15)
    x[:300] += hp(noise(300 / SR), 3000) * 0.5
    return np.tanh(1.4 * x)


def ratchet():
    out = np.zeros(int(0.2 * SR))
    for k in range(3):
        c = bp(noise(0.012), 2500, 7000) * env(0.012, 0.0003, 0.003)
        i = int(k * 0.028 * SR)
        out[i:i + len(c)] += c * (1 - 0.25 * k)
    out[:int(0.15 * SR)] += sweep_sine(0.15, 220, 140, 0.02) * env(0.15, 0.001, 0.04) * 0.6
    return out


def riser(d):
    t = tt(d)
    u = t / d
    x = noise(d)
    # band sweeps up; amplitude rises exponentially into the hit
    sos_parts = []
    out = np.zeros_like(x)
    seg = int(0.02 * SR)
    for i in range(0, len(x), seg):
        fc = 400 * 2 ** (4.5 * u[i])
        out[i:i + seg] = bp(x[max(0, i - 2000):i + seg], fc * 0.7, min(fc * 1.4, 20000))[-len(x[i:i + seg]):]
    return out * (2 ** (10 * u - 10)) * 1.5


def reverse_swell(d):
    t = tt(d)
    x = hp(noise(d), 4000) * (t / d) ** 3
    x += np.sin(2 * np.pi * mtof(64) * t) * (t / d) ** 4 * 0.3
    return x


CURVE_TONE = []
morph_f = {'squircle': 520, 'split-4': 660, 'split-16': 780}
RISERS = {'ring': 0.31, 'weight': 0.6, 'rings': 0.6, 'doors': 0.6, 'name': 0.31}
for c in T['cues']:
    t, kind, name = c['beat'] * B, c['sfx'], c['name']
    log['sfx'].append({'t': round(t, 6), 'name': name, 'sfx': kind})
    if kind == 'slam': add(dry, t, slam(), 0.55, send=0.1)
    elif kind == 'stretch': add(dry, t, stretch(), 0.22, send=0.2)
    elif kind == 'pop': add(dry, t, pop(1100 + 150 * len(log['sfx']) % 400), 0.18, 0.2, send=0.25)
    elif kind == 'impact': add(dry, t, impact(), 0.6, send=0.35)
    elif kind == 'morph': add(dry, t, morph(morph_f.get(name, 600)), 0.16, -0.2, send=0.3)
    elif kind == 'shimmer': add(dry, t, shimmer(), 0.08, 0.2, send=0.5)
    elif kind == 'bounce': add(dry, t, bounce(), 0.45, send=0.15)
    elif kind == 'ratchet': add(dry, t, ratchet(), 0.35, 0.15, send=0.1)
    elif kind == 'reverse': add(dry, t, reverse_swell(DUR - t), 0.08, send=0.2)
    if name in RISERS:
        d = RISERS[name]
        add(dry, t - d, riser(d), 0.05, send=0.3)

# scene 5 sonified: a tone whose pitch is the easing curve's value, swept on each beat
def outback(u, s=2.4): return 1 + (s + 1) * (u - 1) ** 3 + s * (u - 1) ** 2
def spring(u, f=3.2, z=0.22):
    w = 2 * np.pi * f; wd = w * np.sqrt(1 - z * z)
    return 1 - np.exp(-z * w * u) * (np.cos(wd * u) + (z * w / wd) * np.sin(wd * u))
curves = [lambda u: u, lambda u: np.where(u < .5, 4 * u ** 3, 1 - (-2 * u + 2) ** 3 / 2), outback, spring]
t5 = T['cues'][[c['name'] for c in T['cues']].index('doors')]['beat'] * B
for k, f in enumerate(curves):
    u = tt(B) / B
    freq = 330 * 2 ** (1.25 * f(u))
    ph = 2 * np.pi * np.cumsum(freq) / SR
    x = (2 / np.pi) * np.arcsin(np.sin(ph))  # triangle
    x *= np.minimum(1, np.minimum(u / 0.03, (1 - u) / 0.05))
    add(dry, t5 + k * B, x, 0.07, 0.25 * (k % 2 * 2 - 1), send=0.2)

# typing ticks under the name card
E8 = B / 2
name_t = T['cues'][[c['name'] for c in T['cues']].index('name')]['beat'] * B
per_t = T['cues'][[c['name'] for c in T['cues']].index('period')]['beat'] * B
for start, n in ((name_t + E8, 15), (per_t, 25), (per_t + E8, 22)):
    for i in range(n):
        c = bp(noise(0.008), 3000, 9000) * env(0.008, 0.0002, 0.002)
        add(dry, start + i * 0.018, c, 0.05, 0.4 * ((i % 3) - 1))

# ---------- reverb + master ----------
ir_t = tt(1.6)
ir = np.stack([lp(noise(1.6), 6000) * np.exp(-ir_t / 0.38) for _ in range(2)], 1)
ir[:int(0.012 * SR)] = 0  # predelay
rev = np.stack([signal.fftconvolve(wet[:, ch], ir[:, ch])[:N + TAIL] for ch in range(2)], 1) * 0.06
mix = dry + rev
mix = np.stack([hp(mix[:, ch], 25) for ch in range(2)], 1)
out = mix[:N].copy()
out[:TAIL] += mix[N:N + TAIL]  # wrap the tails: the loop point is seamless


@njit(cache=True)
def release(g, coef):
    y = np.empty_like(g)
    cur = 1.0
    for i in range(len(g)):
        cur = g[i] if g[i] < cur else cur + (g[i] - cur) * coef
        y[i] = cur
    return y


def limit(x, ceiling_db=-1.6):
    ceil = 10 ** (ceiling_db / 20)
    up = signal.resample_poly(x, 4, 1, axis=0)
    pk = np.abs(up).max(1).reshape(-1, 4).max(1)[:len(x)]
    g = np.minimum(1, ceil / np.maximum(pk, 1e-9))
    w = int(0.003 * SR)
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    g = minimum_filter1d(g, w, origin=-(w // 2))
    g = uniform_filter1d(g, w, origin=(w - 1) // 2)
    g = release(g, 1 - np.exp(-1 / (0.08 * SR)))
    return x * g[:, None]


def measure(path):
    r = subprocess.run(['ffmpeg', '-nostats', '-i', str(path), '-filter_complex', 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    summ = r[r.rfind('Summary:'):]
    I = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1))
    tp = float(re.search(r'Peak:\s+(-?[\d.inf]+) dBFS', summ).group(1))
    return I, tp


wav = HERE / 'score.wav'
target = -14.0
gain_db = 0.0
src = np.tanh(out * 1.2) / 1.2  # gentle glue
for it in range(6):
    y = limit(src * 10 ** (gain_db / 20))
    sf.write(wav, y.astype(np.float32), SR, subtype='FLOAT')
    I, tp = measure(wav)
    print(f'pass {it}: gain {gain_db:+.2f} dB → {I:.2f} LUFS, true peak {tp:.2f} dBTP')
    if abs(I - target) < 0.15 and tp <= -1.0:
        break
    gain_db += target - I
sf.write(wav, y, SR, subtype='PCM_24')

beats = {
    'bpm': T['bpm'], 'duration': DUR, 'sample_rate': SR,
    'beats': [round(i * B, 6) for i in range(int(DUR / B))],
    'downbeats': [round(i * BAR, 6) for i in range(int(DUR / BAR))],
    'kick': [round(x, 6) for x in log['kick']], 'snare': [round(x, 6) for x in log['snare']],
    'sfx': log['sfx'], 'loudness': {'integrated_lufs': I, 'true_peak_dbtp': tp},
}
(HERE / 'beats.json').write_text(json.dumps(beats, indent=1))
print('wrote', wav.relative_to(HERE.parent.parent), 'and beats.json')
