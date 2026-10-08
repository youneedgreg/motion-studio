"""Looping score + SFX for florios-morph. Writes score.wav and beats.json next to this file.

120 BPM in 3/4: one bar per UI state, eight bars, so the loop point is a bar line. Every cursor
click and keystroke in the timeline gets its sound on its cue; reverb tails wrap around the loop.
Run: .venv/bin/python films/florios-morph/score.py
"""
import json, pathlib, sys
import numpy as np

HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE.parent.parent))
from lib.synth import SR, Mixer, tt, env, noise, sweep_sine, bp, hp, lp, mtof, marimba, bell, whoosh, master, seed_for  # noqa: E402


def S(*parts):
    """Per-sound seed: every random draw is keyed by what the sound is, never by draw order."""
    return seed_for('florios-morph', *parts)

T = json.loads((HERE / 'timeline.json').read_text())
DUR = T['duration']
B = 60 / T['bpm']
BAR = B * T['beatsPerBar']
N = int(DUR * SR)
mx = Mixer(DUR, tail=3.0)
log = {'kick': [], 'snare': []}

# one chord per state: Cmaj9 Am9 Fmaj7 G6 Em7 Am9 Fmaj7 Gsus4 -> back to Cmaj9 at the loop
CHORDS = [[60, 64, 67, 71, 74], [57, 60, 64, 67, 71], [53, 57, 60, 64], [55, 59, 62, 64],
          [52, 55, 59, 62], [57, 60, 64, 67, 71], [53, 57, 60, 64], [55, 60, 62, 67]]
ROOTS = [36, 33, 29, 31, 28, 33, 29, 31]


def kick():
    # voiced for phone speakers: the pitch sweep stops at 66 Hz instead of 46, the sub tail is shorter,
    # and a 2nd-harmonic body plus a beater click carry the hit above 150 Hz where small speakers play
    d = 0.35
    x = sweep_sine(d, 130, 66, 0.03) * env(d, 0.001, 0.09)
    x += 0.5 * sweep_sine(d, 260, 132, 0.03) * env(d, 0.001, 0.063)
    x[:480] += 0.6 * bp(noise(0.01, S('kick-click')), 1500, 6000) * env(0.01, 0.0003, 0.002)
    return np.tanh(1.4 * x)


def tick(f, seed):
    return bp(noise(0.03, seed), f * 0.6, f * 1.6) * env(0.03, 0.0005, 0.006)


KICK = kick()
pad = np.zeros(len(mx.dry))
for bar in range(8):
    t0 = bar * BAR
    mx.add(t0, KICK, 0.42)
    log['kick'].append(t0)
    for s in range(6):  # 8th-note ticks, accent on beats
        mx.add(t0 + s * B / 2, tick(7000 if s % 2 else 4500, S('tick', bar, s)), 0.10 if s % 2 == 0 else 0.05, 0.3)
    # bass on the downbeat, held for the bar: the same roots, with 2nd-5th harmonic partials so phones
    # (which play nothing much below ~150 Hz) still hear the line; mild saturation as before
    f = mtof(ROOTS[bar])
    x = sum(a * np.sin(2 * np.pi * (k + 1) * f * tt(BAR)) for k, a in enumerate((1, 0.6, 0.55, 0.35, 0.15)))
    mx.add(t0, np.tanh(1.2 * x) * env(BAR, 0.004, 0.9), 0.16)
    # soft pad
    i0 = int(t0 * SR)
    t = tt(BAR)
    p = np.zeros_like(t)
    for m in CHORDS[bar]:
        for det in (-0.07, 0.06):
            phase = np.random.default_rng(S('pad', bar, m, det)).random()
            p += 2 * ((t * mtof(m) * 2 ** (det / 12) + phase) % 1) - 1
    edge = np.minimum(1, np.minimum(t / 0.03, (BAR - t) / 0.03))
    pad[i0:i0 + len(t)] += lp(p, 1400) * edge
    # marimba arpeggio on the 8ths
    for s in range(6):
        m = CHORDS[bar][[0, 2, 1, 3, 2, 4][s] % len(CHORDS[bar])] + 12
        mx.add(t0 + s * B / 2, marimba(m, 0.5, 0.5, seed=S('arp', bar, s)), 0.05, -0.3 + 0.12 * s, send=0.25)
mx.add(0, pad, 0.026, send=0.35)   # +2.3 dB: the pad carries the mid range on small speakers

# SFX on the cues: a click (or a key) plus a soft swoop while the container morphs
for c in T['cues']:
    t, kind = c['beat'] * B, c['sfx']
    if kind == 'click':
        mx.add(t, tick(3500, S('click', c['name'])), 0.45, 0.15, send=0.1)
        mx.add(t, marimba(84, 0.2, 0.3, seed=S('click-bar', c['name'])), 0.09, 0.15, send=0.1)
        mx.add(t, whoosh(0.375, 1800, 300, up=False, seed=S('swoop', c['name'])), 0.07, send=0.2)
    elif kind == 'key':
        thock = sweep_sine(0.08, 260, 140, 0.01) * env(0.08, 0.0005, 0.02)
        mx.add(t, bp(noise(0.02, S('key', c['name'])), 2000, 6500) * env(0.02, 0.0003, 0.004), 0.34)
        mx.add(t, thock, 0.2)
        mx.add(t, whoosh(0.375, 1800, 300, up=False, seed=S('swoop', c['name'])), 0.07, send=0.2)
    elif kind == 'type':
        k = int(c['name'].split('-')[1])
        mx.add(t, bp(noise(0.015, S('type', c['name'])), 2500 + 150 * k, 7000) * env(0.015, 0.0003, 0.003), 0.22, 0.2 * (k % 3 - 1))

mix = mx.render(seed=S('reverb'))
out = mix[:N].copy()
out[:len(mix) - N] += mix[N:]  # wrap the tails: the loop point is seamless
I, tp = master(out, HERE / 'score.wav')
beats = {
    'bpm': T['bpm'], 'duration': DUR, 'sample_rate': SR, 'loop': True,
    'beats': [round(i * B, 6) for i in range(int(round(DUR / B)))],
    'downbeats': [round(i * BAR, 6) for i in range(int(round(DUR / BAR)))],
    'kick': log['kick'], 'snare': log['snare'],
    'sfx': [{'t': round(c['beat'] * B, 6), 'name': c['name'], 'sfx': c['sfx']} for c in T['cues']],
    'loudness': {'integrated_lufs': I, 'true_peak_dbtp': tp},
}
(HERE / 'beats.json').write_text(json.dumps(beats, indent=1))
print('wrote score.wav and beats.json')
