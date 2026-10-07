"""Score + SFX for the SafariOS film. Writes score.wav and beats.json next to this file.

120 BPM, B minor resolving to D major on the end card. Marimba carries the melody and doubles as
the UI sound: every chip, row and status in the picture gets a tuned note on its cue.
Run: .venv/bin/python films/safarios/score.py
"""
import json, pathlib, sys
import numpy as np

HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE.parent.parent))
from lib.synth import (SR, Mixer, tt, env, noise, sweep_sine, glide, bp, hp, lp, mtof,  # noqa: E402
                       marimba, bell, whoosh, master)

T = json.loads((HERE / 'timeline.json').read_text())
DUR = T['duration']
B = 60 / T['bpm']
BAR = B * T['beatsPerBar']
S16 = B / 4
CUE = {c['name']: c['beat'] * B for c in T['cues']}
mx = Mixer(DUR)
log = {'kick': [], 'snare': []}

# ---------- harmony: Bm G D A | Bm G D A | D Dmaj9 ----------
CHORDS = [[59, 62, 66], [59, 62, 67], [57, 62, 66], [57, 61, 64]] * 2 + [[57, 62, 66, 69], [57, 61, 64, 66, 69]]
ROOTS = [35, 31, 38, 33] * 2 + [38, 38]
SCALE = [59, 61, 62, 64, 66, 67, 69, 71, 73, 74, 76, 78, 79, 81, 83]  # B minor / D major, B3 up


# ---------- drums ----------
def kick():
    d = 0.4
    x = sweep_sine(d, 150, 48, 0.03) * env(d, 0.001, 0.2)
    x[:300] += hp(noise(300 / SR), 2500) * 0.25
    return np.tanh(x * 1.5)


def clap():
    d = 0.3
    out = np.zeros(int(d * SR))
    for k, o in enumerate([0, 0.01, 0.021]):
        b = bp(noise(0.06), 900, 4000) * env(0.06, 0.0004, 0.01 if k < 2 else 0.06)
        i = int(o * SR)
        out[i:i + len(b)] += b
    return out + bp(noise(d), 4000, 10000) * env(d, 0.001, 0.05) * 0.3


def shaker(accent):
    d = 0.09
    # hard attack: a sin² swell peaked ~45 ms late and pulled every 16th off the grid
    x = bp(noise(d), 5000, 12000) * env(d, 0.0008, 0.022)
    return x * (1.0 if accent else 0.55)


KICK, CLAP = kick(), clap()
for bar in range(8):
    for beat in range(4):
        t = bar * BAR + beat * B
        mx.add(t, KICK, 0.6)
        log['kick'].append(t)
        if beat in (1, 3) and bar >= 1:
            mx.add(t, CLAP, 0.42, 0.05, send=0.2)
            log['snare'].append(t)
    for s in range(16):
        mx.add(bar * BAR + s * S16, shaker(s % 2 == 0), 0.07, 0.35)
for s in range(8):  # end card: shaker only, thinning out
    mx.add(16 + 0.25 + s * B / 2, shaker(True), 0.05 * (1 - s / 8), 0.35)


def duck_curve():
    t = np.arange(len(mx.dry)) / SR
    g = np.ones_like(t)
    for k in log['kick']:
        m = t >= k
        g[m] = np.minimum(g[m], 1 - 0.65 * np.exp(-(t[m] - k) / 0.1))
    return g


DUCK = duck_curve()

# ---------- bass + pad ----------
bass = np.zeros(len(mx.dry))
pad = np.zeros(len(mx.dry))
rng = np.random.default_rng(3)
for bar in range(10):
    i0, i1 = int(bar * BAR * SR), int(min(DUR + 1.5, (bar + 1) * BAR) * SR)
    t = np.arange(i1 - i0) / SR
    if bar < 8:  # offbeat 8th bass, house style
        for beat in range(4):
            x = np.sin(2 * np.pi * mtof(ROOTS[bar]) * tt(0.22)) + 0.3 * np.sin(4 * np.pi * mtof(ROOTS[bar]) * tt(0.22))
            x *= env(0.22, 0.004, 0.12)
            j = int((bar * BAR + beat * B + B / 2) * SR)
            bass[j:j + len(x)] += np.tanh(1.3 * x)
    else:  # end card: one long held root
        f = mtof(ROOTS[bar] - 12 if bar == 8 else ROOTS[bar])
        x = np.sin(2 * np.pi * f * t) * np.exp(-t / 1.6) * np.minimum(1, t / 0.01)
        bass[i0:i0 + len(x)] += x * 0.9
    p = np.zeros_like(t)
    for m in CHORDS[bar]:
        for det in (-0.08, 0.07):
            p += 2 * ((t * mtof(m) * 2 ** (det / 12) + rng.random()) % 1) - 1
    edge = np.minimum(1, np.minimum(t / 0.02, (t[-1] - t + 1e-3) / 0.02))
    pad[i0:i1] += lp(p, 1200 if bar < 8 else 2200) * edge
mx.add(0, bass * DUCK, 0.15)
mx.add(0, pad * (0.55 + 0.45 * DUCK), 0.034, send=0.3)

# marimba 8th arps through the product section (bars 2-8); bar 1 belongs to the chip notes
for bar in range(1, 8):
    notes = CHORDS[bar]
    for s in range(8):
        if s in (0, 3, 5, 6):
            m = notes[(s * 2) % len(notes)] + 12
            mx.add(bar * BAR + s * B / 2, marimba(m, 0.4, 0.6), 0.09, -0.25 + 0.5 * (s % 2), send=0.15)


# ---------- SFX, one per visual cue ----------
def hit(low=48, d=1.0):
    x = sweep_sine(d, 110, low, 0.06) * env(d, 0.001, 0.35)
    x += lp(noise(d), 3000) * env(d, 0.0005, 0.08) * 0.6
    return np.tanh(1.3 * x)


def pop_sfx(f=700):
    return glide(0.09, f, f * 2.2, 0.6) * env(0.09, 0.001, 0.035)


chip_i = 0
for c in T['cues']:
    t, kind, name = c['beat'] * B, c['sfx'], c['name']
    if kind == 'pop-big':
        mx.add(t, hit(52, 0.6), 0.35)
        for m in CHORDS[0]:
            mx.add(t, marimba(m + 12, 0.8), 0.08, send=0.3)
    elif kind == 'tick':  # tuned: chips climb the scale, rows too
        m = SCALE[min(len(SCALE) - 1, 3 + chip_i)]
        chip_i += 1
        mx.add(t, marimba(m, 0.5), 0.17, (chip_i % 3 - 1) * 0.4, send=0.2)
    elif kind == 'tick-soft':
        mx.add(t, marimba(SCALE[7 + (int(c['beat'] * 4) % 5)], 0.4, 0.5), 0.08, 0.4, send=0.25)
    elif kind == 'word':
        mx.add(t, bp(noise(0.03), 1500, 6000) * env(0.03, 0.0003, 0.008), 0.18)
        mx.add(t, marimba(SCALE[2], 0.3, 0.3), 0.05)
    elif kind == 'zoom-hit':
        mx.add(t - 0.25, whoosh(0.25, 300, 7000, up=True), 0.16, send=0.2)
        mx.add(t, hit(46, 1.0), 0.5, send=0.25)
    elif kind == 'swoosh':
        mx.add(t, whoosh(0.25, 800, 5000, up=True), 0.08)
    elif kind == 'pop':
        mx.add(t, pop_sfx(650), 0.18, 0.2, send=0.2)
    elif kind in ('pluck', 'pluck-land'):
        k = int(name[-1]) - 1 if name[-1].isdigit() else 0
        mx.add(t, marimba([71, 74, 78][k], 0.7), 0.17, send=0.25)
        if kind == 'pluck-land':
            mx.add(t + B / 2, hit(60, 0.4), 0.2)
    elif kind == 'push':
        mx.add(t, whoosh(0.25, 2500, 250, up=False), 0.18, send=0.15)
        mx.add(t, hit(55, 0.5), 0.18)
    elif kind == 'count':
        x = glide(0.45, 330, 990, 1.4) * np.minimum(1, tt(0.45) / 0.02) * (1 - tt(0.45) / 0.45 * 0.6)
        mx.add(t, x, 0.06, send=0.2)
    elif kind == 'chord':
        for m in [62, 66, 69]:
            mx.add(t, bell(m + 12, 1.4), 0.04, send=0.4)
    elif kind == 'swish':
        mx.add(t, hp(noise(0.12), 3000) * np.sin(np.pi * tt(0.12) / 0.12), 0.06, 0.3)
        mx.add(t, marimba(SCALE[5 + int(name[-1])], 0.4, 0.5), 0.07, send=0.2)
    elif kind == 'chime':
        mx.add(t, bell(78, 1.6), 0.07, send=0.4)
    elif kind == 'ping':
        mx.add(t, bell(81 + int(name[-1]) * 2, 0.8), 0.05, 0.3, send=0.3)
    elif kind == 'warn':
        for k, m in enumerate([64, 61]):
            mx.add(t + k * S16 / 2, np.sign(np.sin(2 * np.pi * mtof(m) * tt(0.08))) * env(0.08, 0.001, 0.04), 0.03)
    elif kind == 'pill':
        k = int(name[-1])
        mx.add(t, hit(58 + 8 * k, 0.5), 0.3)
        mx.add(t, marimba([66, 69, 74][k - 1], 0.6), 0.14, send=0.3)
    elif kind == 'field':
        mx.add(t, whoosh(0.25, 400, 6000), 0.14)
        mx.add(t, hit(50, 0.5), 0.32)
    elif kind == 'end':
        mx.add(t - 0.5, whoosh(0.5, 200, 8000, up=True), 0.14, send=0.3)
        mx.add(t, hit(40, 1.8), 0.6, send=0.4)
        for m in [50, 57, 62, 66, 69]:
            mx.add(t, bell(m + 12, 3.0), 0.035, send=0.5)
    elif kind == 'cta':
        mx.add(t, pop_sfx(520), 0.2, send=0.25)
        mx.add(t, bell(74, 2.0), 0.06, send=0.4)

# typing ticks under the ask bar and the advisor line, on the 32nd-note grid while text is appearing
for start, end in ((CUE['askbar'] + 0.05, CUE['send'] - 0.05), (CUE['advisor'], CUE['advisor'] + 0.25)):
    k0, k1 = int(np.ceil(start / (S16 / 2))), int(np.floor(end / (S16 / 2)))
    for k in range(k0, k1 + 1):
        mx.add(k * S16 / 2, bp(noise(0.008), 3000, 9000) * env(0.008, 0.0002, 0.002), 0.06, 0.4 * ((k % 3) - 1))

mix = mx.render()[:int(DUR * SR)]
I, tp = master(mix, HERE / 'score.wav', fade_out=0.35)
beats = {
    'bpm': T['bpm'], 'duration': DUR, 'sample_rate': SR,
    'beats': [round(i * B, 6) for i in range(int(DUR / B))],
    'downbeats': [round(i * BAR, 6) for i in range(int(DUR / BAR))],
    'kick': [round(x, 6) for x in log['kick']], 'snare': [round(x, 6) for x in log['snare']],
    'sfx': [{'t': round(c['beat'] * B, 6), 'name': c['name'], 'sfx': c['sfx']} for c in T['cues']],
    'loudness': {'integrated_lufs': I, 'true_peak_dbtp': tp},
}
(HERE / 'beats.json').write_text(json.dumps(beats, indent=1))
print('wrote score.wav and beats.json')
