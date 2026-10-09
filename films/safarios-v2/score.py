"""Score + SFX for safarios-v2. Writes score.wav and beats.json next to this file.

120 BPM, 4/4, 16 bars in A major. Marimba is the lead and the UI voice: every cue gets a tuned note.
Voiced for phone speakers: nothing lives only below 150 Hz. The bass carries partials 2–5, the kick ends its
sweep at 70 Hz with a second-harmonic body and a beater click, and the pad and marimba carry the mids.
Run: .venv/bin/python films/safarios-v2/score.py
"""
import json, pathlib, sys
import numpy as np

HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE.parent.parent))
from lib.synth import SR, Mixer, tt, env, noise, sweep_sine, bp, hp, lp, mtof, marimba, bell, whoosh, master, seed_for  # noqa: E402


def S(*parts):
    """Per-sound seed: every random draw is keyed by what the sound is, never by draw order."""
    return seed_for('safarios-v2', *parts)


T = json.loads((HERE / 'timeline.json').read_text())
DUR = T['duration']
B = 60 / T['bpm']
BAR = B * T['beatsPerBar']
NBAR = int(round(DUR / BAR))
mx = Mixer(DUR, tail=2.5)
log = {'kick': [], 'snare': []}

# A | F#m | D | E | A | F#m | D | E | Bm | D | E | Esus E | A | D | Aadd9 | Aadd9   (the list sits on IV; the logo lands on I)
CHORDS = [[57, 61, 64], [54, 57, 61], [50, 54, 57], [52, 56, 59], [57, 61, 64], [54, 57, 61], [50, 54, 57], [52, 56, 59],
          [47, 50, 54], [50, 54, 57], [52, 56, 59], [52, 57, 59], [57, 61, 64], [50, 54, 57], [57, 61, 64, 71], [57, 61, 64, 71]]
ROOTS = [45, 42, 38, 40, 45, 42, 38, 40, 47, 38, 40, 40, 45, 38, 45, 45]
SCALE = [57, 59, 61, 62, 64, 66, 68, 69, 71, 73, 74, 76, 78, 80, 81, 83, 85]   # A major from A3


def kick():
    d = 0.32
    x = sweep_sine(d, 150, 70, 0.028) * env(d, 0.001, 0.085)
    x += 0.55 * sweep_sine(d, 300, 140, 0.028) * env(d, 0.001, 0.06)          # 2nd harmonic: the body phones hear
    x[:480] += 0.7 * bp(noise(0.01, S('kick-click')), 1800, 7000) * env(0.01, 0.0003, 0.002)
    return hp(np.tanh(1.5 * x), 60, 4)   # nothing below 60 Hz: phones can't play it and headphones don't need it


def clap(seed):
    d = 0.18
    n = bp(noise(d, seed), 900, 6000)
    e = sum(env(d, 0.0005, 0.008) * (np.arange(len(n)) >= int(k * SR)) for k in (0, 0.011, 0.022)) + env(d, 0.0005, 0.06)
    tone = np.sin(2 * np.pi * 220 * tt(d)) * env(d, 0.001, 0.03)
    return n * e * 0.5 + 0.25 * tone


def shaker(seed, accent):
    d = 0.05
    return hp(noise(d, seed), 6000) * env(d, 0.004 if accent else 0.002, 0.012)


def keyclick(seed, f=2600):
    x = 0.4 * sweep_sine(0.06, 300, 170, 0.01) * env(0.06, 0.0005, 0.015)
    x[:int(0.02 * SR)] += bp(noise(0.02, seed), f, 7500) * env(0.02, 0.0003, 0.004)
    return x


def bass_note(m, d):
    f = mtof(m)
    x = sum(a * np.sin(2 * np.pi * (k + 1) * f * tt(d)) for k, a in enumerate((0.6, 0.75, 0.6, 0.4, 0.22)))
    return np.tanh(1.3 * x) * env(d, 0.004, d * 0.6)


# ---------- arrangement ----------
# bar 0 (0–2 s): typing over a pad, kick only on the downbeat. Groove from bar 1 (the pull-back).
# bars 14–15 (28–32 s): the end card; drums stop after beat 1 of bar 15 and the Aadd9 rings out.
KICK = kick()
pad = np.zeros(len(mx.dry))
for bar in range(NBAR):
    t0 = bar * BAR
    groove = 1 <= bar <= 14
    kicks = [0] if bar in (0, 15) else ([0, 2] if bar in (8, 9) else [0, 1.5, 2])   # half-time feel on trip day
    for k in kicks:
        mx.add(t0 + k * B, KICK, 0.36)
        log['kick'].append(round(t0 + k * B, 6))
    if groove:
        for k in (1, 3):
            if bar in (8, 9) and k == 1:
                continue
            mx.add(t0 + k * B, clap(S('clap', bar, k)), 0.30, 0.05, send=0.2)
            log['snare'].append(round(t0 + k * B, 6))
        for s in range(16):
            if bar >= 2:
                mx.add(t0 + s * B / 4, shaker(S('shaker', bar, s), s % 4 == 2), 0.07 if s % 2 else 0.035, 0.35)
    # bass: root on 1, octave on the "and" of 2, fifth on 4 (from bar 1)
    if bar >= 1:
        r = ROOTS[bar]
        for beat, m, d in ((0, r, 0.7), (1.5, r + 12, 0.35), (3, r + 7, 0.45)):
            mx.add(t0 + beat * B, bass_note(m, d), 0.14)
    # pad
    i0 = int(t0 * SR)
    t = tt(BAR)
    p = np.zeros_like(t)
    for m in CHORDS[bar]:
        for det in (-0.06, 0.07):
            phase = np.random.default_rng(S('pad', bar, m, det)).random()
            p += 2 * ((t * mtof(m) * 2 ** (det / 12) + phase) % 1) - 1
    edge = np.minimum(1, np.minimum(t / 0.03, (BAR - t) / 0.03)) if bar < NBAR - 1 else np.minimum(1, t / 0.03) * np.exp(-t / 1.4)
    pad[i0:i0 + len(t)] += lp(p, 1600 if bar >= 6 else 1100) * edge
    # marimba arpeggio on the 8ths from bar 4 (the itinerary on), sparser before
    if 2 <= bar <= 14:
        steps = range(8) if bar >= 4 else (0, 3, 6)
        for s in steps:
            ch = CHORDS[bar]
            m = ch[[0, 2, 1, 2, 0, 2, 1, 3][s] % len(ch)] + 12
            mx.add(t0 + s * B / 2, marimba(m, 0.45, 0.45, seed=S('arp', bar, s)), 0.045, -0.3 + 0.08 * s, send=0.25)
mx.add(0, pad, 0.034, send=0.35)   # the pad carries the mids on small speakers

# risers into the gold field (21.5 → 23.0) and into the logo (26.5 → 28.0)
mx.add(21.5, whoosh(1.5, 400, 7000, up=True, seed=S('riser')), 0.12, send=0.3)
mx.add(26.5, whoosh(1.5, 400, 7000, up=True, seed=S('riser2')), 0.09, send=0.3)


def note(i):
    return SCALE[min(len(SCALE) - 1, max(0, i))]


# ---------- SFX on the cues ----------
row_i = 0
world_i = 0
for c in T['cues']:
    t, kind, nm = c['beat'] * B, c['sfx'], c['name']
    if kind == 'kick-key':
        mx.add(t, keyclick(S('key', nm)), 0.4)
        mx.add(t, marimba(69, 0.5, 0.6, seed=S('mar', nm)), 0.10, send=0.2)
    elif kind == 'keys':          # a burst of 3 keys ending on the cue, plus a tuned tap
        for j, dt in enumerate((-0.09, -0.05, 0.0)):
            mx.add(t + dt, keyclick(S('keys', nm, j), 2200 + 300 * j), 0.30 if dt == 0 else 0.18, 0.15 * (j - 1))
        mx.add(t, marimba(note(4 + int(nm.split('-')[-1]) if nm.startswith('type-') else 7), 0.3, 0.5, seed=S('tap', nm)), 0.07, send=0.15)
    elif kind == 'whoosh-out':
        mx.add(t, whoosh(0.5, 5000, 400, up=False, seed=S('wo', nm)), 0.16, send=0.25)
    elif kind == 'whoosh-in':
        mx.add(t - 0.4, whoosh(0.45, 400, 6000, up=True, seed=S('wi', nm)), 0.16, send=0.2)
        mx.add(t, marimba(note(7), 0.5, 0.7, seed=S('land', nm)), 0.10, send=0.2)
    elif kind == 'thud':
        mx.add(t, sweep_sine(0.2, 260, 150, 0.03) * env(0.2, 0.001, 0.05), 0.25)
        mx.add(t, marimba(note(4), 0.4, 0.5, seed=S('thud', nm)), 0.09)
    elif kind == 'tick-run':      # the score counting 0 → 82 over half a beat
        for j in range(8):
            mx.add(t + j * B / 16, marimba(note(4 + j), 0.12, 0.8, seed=S('run', j)), 0.05, 0.2)
    elif kind == 'hit':
        mx.add(t, marimba(note(11), 0.6, 0.9, seed=S('hit', nm)), 0.12, send=0.25)
        mx.add(t, marimba(note(7), 0.6, 0.6, seed=S('hit2', nm)), 0.08, send=0.25)
    elif kind == 'pluck':
        mx.add(t, marimba(note(9), 0.4, 0.6, seed=S('pluck', nm)), 0.08, -0.2, send=0.2)
    elif kind == 'click':
        mx.add(t, bp(noise(0.012, S('click', nm)), 2500, 8000) * env(0.012, 0.0002, 0.002), 0.4)
        mx.add(t, marimba(note(14), 0.15, 0.4, seed=S('clickbar', nm)), 0.06)
    elif kind == 'tick':
        mx.add(t, marimba(note(7 + row_i), 0.3, 0.6, seed=S('row', nm)), 0.09, 0.25 - 0.15 * row_i, send=0.15)
        row_i += 1
    elif kind == 'rise':          # totals count 6.75 → 7.25
        mx.add(t, whoosh(0.5, 600, 4000, up=True, seed=S('rise', nm)), 0.06)
        for j in range(4):
            mx.add(t + j * B / 4, marimba(note(9 + j), 0.15, 0.5, seed=S('rise', j)), 0.05)
    elif kind == 'chime':
        mx.add(t, bell(note(14), 1.2), 0.07, send=0.3)
    elif kind == 'chord':
        for m in (69, 73, 76):
            mx.add(t, marimba(m + 12, 0.8, 0.4, seed=S('chord', m)), 0.05, send=0.35)
    elif kind == 'page':
        mx.add(t, bp(noise(0.15, S('page', nm)), 1500, 6000) * env(0.15, 0.01, 0.04), 0.10, 0.3)
        mx.add(t, marimba(note(9 + int(nm[-1])), 0.35, 0.5, seed=S('pagebar', nm)), 0.08, send=0.2)
    elif kind in ('morph-hit', 'world'):   # countdown: each world one scale step higher
        mx.add(t, marimba(note(7 + 2 * world_i), 0.6, 0.9, seed=S('world', nm)), 0.20, send=0.3)
        mx.add(t, marimba(note(14 + 2 * world_i), 0.5, 0.7, seed=S('world-hi', nm)), 0.10, send=0.3)
        mx.add(t, bell(note(14 + world_i) - 12, 0.9), 0.08, send=0.3)
        mx.add(t, sweep_sine(0.18, 300, 180, 0.02) * env(0.18, 0.001, 0.04), 0.26)
        mx.add(t, KICK, 0.30)
        world_i += 1
    elif kind == 'flip':
        mx.add(t, whoosh(0.4, 600, 5000, up=True, seed=S('flip', nm)), 0.15, send=0.2)
        mx.add(t, marimba(note(4), 0.5, 0.7, seed=S('flipbar', nm)), 0.09)
    elif kind == 'ping':
        mx.add(t, bell(note(9 + 2 * int(nm[-1])), 0.8), 0.06, 0.2, send=0.3)
        mx.add(t, marimba(note(9 + 2 * int(nm[-1])), 0.3, 0.6, seed=S('ping', nm)), 0.07)
    elif kind == 'pay-chime':     # a generic two-note chime, not any real service's sound
        mx.add(t, bell(note(11), 1.0), 0.14, -0.15, send=0.3)
        mx.add(t + B / 4, bell(note(14), 1.2), 0.14, 0.15, send=0.3)
        mx.add(t, marimba(note(11), 0.5, 0.8, seed=S('pay', nm)), 0.10)
    elif kind == 'drop':          # onto the gold field
        mx.add(t, KICK, 0.45)
        mx.add(t, marimba(note(7), 0.6, 0.8, seed=S('drop', nm)), 0.12, send=0.3)
        mx.add(t, marimba(note(11), 0.6, 0.6, seed=S('drop2', nm)), 0.08, send=0.3)
    elif kind == 'wipe':          # circle-wipe run: a short whoosh into each field and a tuned hit on it, climbing
        k = int(nm.split('-')[1])
        mx.add(t - 0.22, whoosh(0.22, 700, 6000, up=True, seed=S('wipe-in', nm)), 0.10, 0.25 * (k % 2 * 2 - 1), send=0.2)
        mx.add(t, marimba(note(5 + 2 * k), 0.5, 0.9, seed=S('wipe', nm)), 0.16, send=0.25)
        mx.add(t, marimba(note(12 + 2 * k), 0.4, 0.6, seed=S('wipe-hi', nm)), 0.07, send=0.25)
        mx.add(t, sweep_sine(0.16, 320, 190, 0.02) * env(0.16, 0.001, 0.04), 0.22)
    elif kind == 'big-hit':
        mx.add(t, KICK, 0.5)
        for m in (57, 64, 69, 73):
            mx.add(t, marimba(m + 12, 1.2, 0.8, seed=S('big', m)), 0.07, send=0.4)
        mx.add(t, bell(81, 2.5), 0.06, send=0.4)
    else:
        raise ValueError(f'no sound for sfx {kind!r} (cue {nm})')

mix = mx.render(seed=S('reverb'))
N = int(DUR * SR)
I, tp = master(mix[:N], HERE / 'score.wav', fade_out=0.6)
beats = {
    'bpm': T['bpm'], 'duration': DUR, 'sample_rate': SR, 'loop': False,
    'beats': [round(i * B, 6) for i in range(int(round(DUR / B)))],
    'downbeats': [round(i * BAR, 6) for i in range(NBAR)],
    'kick': log['kick'], 'snare': log['snare'],
    'sfx': [{'t': round(c['beat'] * B, 6), 'name': c['name'], 'sfx': c['sfx']} for c in T['cues']],
    'loudness': {'integrated_lufs': I, 'true_peak_dbtp': tp},
}
(HERE / 'beats.json').write_text(json.dumps(beats, indent=1))
print('wrote score.wav and beats.json')
