"""Objective checks for a film. Usage: .venv/bin/python tools/check.py films/reel [--skip-render]

1. determinism: render 0-2 s twice, compare ffmpeg framemd5
2. loop seam:   last frame vs first frame, against the film's typical frame-to-frame change
3. full render with score → out/<name>.mp4, contact sheet with one frame per beat
4. loudness:    ebur128 integrated + true peak on the final file
5. sync:        visual onsets (measured from rendered pixels) and audio onsets (librosa) vs beats.json
"""
import json, re, subprocess, sys, pathlib
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
film = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'films/reel')
skip_render = '--skip-render' in sys.argv
name = film.name
T = json.loads((ROOT / film / 'timeline.json').read_text())
BEATS = json.loads((ROOT / film / 'beats.json').read_text())
FPS, W, H, DUR = T['fps'], T['width'], T['height'], T['duration']
B = 60 / T['bpm']
OUT = ROOT / 'out'
CHK = OUT / 'check' / name  # per film, so two checks never share scratch files
CHK.mkdir(parents=True, exist_ok=True)
final = OUT / f'{name}.mp4'
report = []


def say(s=''):
    print(s)
    report.append(s)


def run(cmd, **kw):
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, **kw)
    if r.returncode:
        print(r.stdout, r.stderr)
        raise SystemExit(f'failed: {" ".join(map(str, cmd))}')
    return r


def framemd5(path):
    out = run(['ffmpeg', '-v', 'error', '-i', str(path), '-map', '0:v', '-f', 'framemd5', '-']).stdout
    return [l.split(',')[-1].strip() for l in out.splitlines() if l and not l.startswith('#')]


def gray_frames(path, w=108, h=192):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-vf', f'scale={w}:{h}:flags=area,format=gray',
                          '-f', 'rawvideo', '-'], capture_output=True, cwd=ROOT).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)


# 1 · determinism
if not skip_render:
    for tag in 'ab':
        run(['node', 'render.mjs', str(film), '--from', '0', '--to', '2', '--no-audio', '--out', str(CHK / f'det_{tag}.mp4')])
a, b = framemd5(CHK / 'det_a.mp4'), framemd5(CHK / 'det_b.mp4')
same = sum(x == y for x, y in zip(a, b))
say(f'determinism   {same}/{len(a)} frame hashes identical across two renders of 0-2 s' + ('  OK' if same == len(a) == len(b) else '  FAIL'))

# 3 · full render
if not skip_render:
    run(['node', 'render.mjs', str(film), '--out', str(final)], timeout=1800)
probe = run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_name,width,height,pix_fmt,r_frame_rate,nb_frames',
             '-of', 'compact', str(final)]).stdout.strip()
say(f'file          {final.relative_to(ROOT)}  {probe.replace(chr(10), " | ")}')

G = gray_frames(final)
d = np.abs(np.diff(G, axis=0)).mean(axis=(1, 2))  # d[i] = change from frame i to i+1

# 2 · loop seam
if T.get('loop'):
    seam = np.abs(G[-1] - G[0]).mean()
    say(f'loop seam     last→first change {seam:.2f} vs median per-frame change {np.median(d):.2f}, '
        f'95th pct {np.percentile(d, 95):.2f}' + ('  OK' if seam <= np.percentile(d, 95) else '  JUMP'))

# contact sheet: one frame per beat, taken mid-beat; one row per bar
sheet_dir = CHK / 'beats'
sheet_dir.mkdir(exist_ok=True)
for f in sheet_dir.glob('*.png'):
    f.unlink()
times = [(i + 0.5) * B for i in range(int(DUR / B))]
for t in times:
    run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.4f}', '-i', str(final), '-frames:v', '1', str(sheet_dir / f'b_{t:07.3f}.png')])
run([str(ROOT / '.venv/bin/python'), 'tools/sheet.py', str(OUT / f'{name}-contact.png'), str(T['beatsPerBar']), '250',
     *sorted(map(str, sheet_dir.glob('*.png')))])
say(f'contact sheet out/{name}-contact.png ({len(times)} frames, one per beat)')

# 4 · loudness
r = subprocess.run(['ffmpeg', '-nostats', '-i', str(final), '-vn', '-af', 'ebur128=peak=true',
                    '-f', 'null', '-'], capture_output=True, text=True, cwd=ROOT).stderr
summ = r[r.rfind('Summary:'):]
I = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1))
tp = float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', summ).group(1))
say(f'loudness      {I:.1f} LUFS integrated, true peak {tp:.1f} dBTP' +
    ('  OK' if abs(I + 14) <= 1 and tp <= -1 else '  OFF TARGET'))

# 5 · sync
grid16 = np.arange(0, DUR + 1e-9, B / 4)
def off_grid(ts):
    return np.array([t - grid16[np.argmin(np.abs(grid16 - t))] for t in ts])

# visual: for every cue, the first frame where the element that cue moves visibly changes.
# The film reports each cue's element box (render.mjs --cue-boxes); cues without one (camera moves,
# wipes, cuts) are measured over the whole frame. A cue passes when its first visible change lands
# within one frame of its sound (every SFX sits exactly on its cue, checked below).
boxes_path = CHK / 'cue-boxes.json'
run(['node', 'render.mjs', str(film), '--cue-boxes', str(boxes_path)])
boxes = json.loads(boxes_path.read_text())
cues = [(c['name'], c['beat'] * B) for c in T['cues']]
rows, lat, fails = [], [], []
for nm, t in cues:
    bx = boxes.get(nm)
    x, y, w, h = (0, 0, W, H) if not bx else bx
    x0, y0 = max(0, int(x) - 16), max(0, int(y) - 16)
    x1, y1 = min(W, int(x + w) + 16), min(H, int(y + h) + 16)
    cw, ch = (x1 - x0) // 2 * 2, (y1 - y0) // 2 * 2
    first = int(np.ceil(t * FPS - 1e-6))          # first frame whose time is at or after the cue
    start = max(0, first - 4)
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{start / FPS:.6f}', '-i', str(final), '-frames:v', '10',
                          '-vf', f'crop={cw}:{ch}:{x0}:{y0},format=gray', '-f', 'rawvideo', '-'], capture_output=True, cwd=ROOT).stdout
    F = np.frombuffer(raw, np.uint8).reshape(-1, ch, cw).astype(np.float32)
    dd = np.abs(np.diff(F, axis=0)).mean(axis=(1, 2))   # dd[k]: change into frame start + k + 1
    frames = np.arange(start + 1, start + 1 + len(dd))
    # onset = the change jumps relative to the frame before it (steady motion already under way doesn't count)
    prev = np.concatenate([[dd[0]], dd[:-1]])
    hit = np.where((frames >= first - 2) & (dd > np.maximum(1.0, 1.5 * prev + 0.5)))[0]
    if first == 0:  # a cue on the film's first frame is on time by definition
        hit = np.array([-1]); frames = np.concatenate([[0], frames])
    if not len(hit):
        rows.append(f'{nm}:none'); fails.append(nm); continue
    ms = (frames[max(0, hit[0])] / FPS - t) * 1000 if first else 0.0
    lat.append(ms)
    rows.append(f'{nm}:{ms:+.0f}')
    if abs(ms) > 1000 / FPS + 0.5:
        fails.append(nm)
lat = np.array(lat)
say(f'cue sync      {len(cues) - len(fails)}/{len(cues)} cues: first visible change of the cued element within 1 frame of its sound '
    f'(median {np.median(lat):+.1f} ms, range {lat.min():+.0f}..{lat.max():+.0f} ms)' + ('  OK' if not fails else f'  FAIL: {", ".join(fails)}'))
say('              ' + '  '.join(rows))

# morph films: each state's container, measured on its settled frame (2 frames before the next
# action), against the table in timeline.json. Lossless PNG stills, sub-pixel edges from anti-aliasing,
# radius from the uncovered area of each corner square, r² (1 − π/4).
if 'states' in T:
    from PIL import Image
    S = T['states']
    hexrgb = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float)
    g = hexrgb(T['ground'])
    cx0, cy0 = T['container']['cx'], T['container']['cy']
    settle = [(S[j + 1]['t'] if j + 1 < len(S) else DUR) - 2 / FPS for j in range(len(S))]
    sdir = CHK / 'states'
    run(['node', 'render.mjs', str(film), '--frames', str(sdir), '--stills', ','.join(f'{x:.4f}' for x in settle)])

    def runext(prof, c):
        if prof[c] < 0.5:
            return None
        a = c
        while a > 0 and prof[a - 1] >= 0.5: a -= 1
        b = c
        while b < len(prof) - 1 and prof[b + 1] >= 0.5: b += 1
        return a - (prof[a - 1] if a > 0 else 0), b + 1 + (prof[b + 1] if b < len(prof) - 1 else 0)

    bad = []
    for s, ts in zip(S, settle):
        f = hexrgb(s['fill']); d = f - g
        img = np.asarray(Image.open(sdir / f't_{round(ts * FPS) / FPS:.3f}.png').convert('RGB')).astype(float)
        rel = img - g
        k = (rel @ d) / (d @ d)
        off = np.linalg.norm(rel - k[..., None] * d, axis=2)
        cov = np.where(off < 6, np.clip(k, 0, 1), 1.0)   # colours off the ground→fill line are content: inside
        # widest row / tallest column through the centre (on a pill every other row is shorter);
        # the cursor can only shorten a run, so the max is the clean one
        xs = [e for e in (runext(cov[y], cx0) for y in range(cy0 - 3, cy0 + 4)) if e]
        ys = [e for e in (runext(cov[:, x], cy0) for x in range(cx0 - 3, cx0 + 4)) if e]
        left, right = min(e[0] for e in xs), max(e[1] for e in xs)
        top, bottom = min(e[0] for e in ys), max(e[1] for e in ys)
        w, h = right - left, bottom - top
        R0 = int(min(w, h) // 2)
        L, Tp, R, Bm = (int(round(v)) for v in (left, top, right, bottom))
        quads = [cov[Tp:Tp + R0, L:L + R0], cov[Tp:Tp + R0, R - R0:R], cov[Bm - R0:Bm, L:L + R0], cov[Bm - R0:Bm, R - R0:R]]
        # the cursor's outline can only add uncovered pixels, so trust the two cleanest corners
        rs = sorted(float(np.sqrt((1 - q).sum() / (1 - np.pi / 4))) for q in quads)
        r = (rs[0] + rs[1]) / 2
        ok = abs(w - s['w']) <= 2 and abs(h - s['h']) <= 2 and abs(r - s['r']) <= 2
        if not ok: bad.append(s['name'])
        say(f"state {s['name']:<10s} t={s['t']:>4.1f}  table {s['w']}×{s['h']} r{s['r']:<4}  measured {w:.1f}×{h:.1f} r{r:.1f}" + ('  OK' if ok else '  OFF'))
    if T.get('loop'):
        say(f"state {'(loop)':<10s} t={DUR:>4.1f}  row repeats t=0; container at t={DUR} is frame 0 of the next pass")
    say(f'states        {len(S) - len(bad)}/{len(S)} within ±2 px of the table' + ('  OK' if not bad else f'  OFF: {", ".join(bad)}'))
    # settled text is fully visible: each state 1.0 s after its action, rendered with and without the
    # text masks (window.filmDebug.noMasks) — the frames must be pixel-identical. A second render also
    # lifts the container clip (noClip): anti-aliasing under a clip shifts edges by a few levels, so only
    # differences > 8 levels count there — a clipped glyph differs by far more than that.
    tt = [s['t'] + 1.0 for s in S]
    stl = ','.join(f'{x:.4f}' for x in tt)
    variants = {'masks_on': None, 'masks_off': '{"noMasks":true}', 'clip_off': '{"noMasks":true,"noClip":true}'}
    for d, dbg in variants.items():
        run(['node', 'render.mjs', str(film), '--frames', str(CHK / d), '--stills', stl] + (['--debug', dbg] if dbg else []))
    load = lambda d, fn: np.asarray(Image.open(CHK / d / fn).convert('RGB')).astype(int)
    for other, tol, label in (('masks_off', 0, 'text masks off'), ('clip_off', 8, 'container clip off too')):
        clipped = []
        for s, x in zip(S, tt):
            fn = f't_{round(x * FPS) / FPS:.3f}.png'
            diff = np.abs(load('masks_on', fn) - load(other, fn)).max(axis=2)
            n = int((diff > tol).sum())
            if n:
                ys, xs = np.nonzero(diff > tol)
                clipped.append(f"{s['name']} ({n} px, x {xs.min()}–{xs.max()}, y {ys.min()}–{ys.max()}, max {diff.max()} levels)")
        say(f'text visible  {len(S) - len(clipped)}/{len(S)} states identical at state + 1.0 s with {label}'
            + (f' (tolerance {tol} levels)' if tol else ' (exact)') + ('  OK' if not clipped else f'  FAIL: {"; ".join(clipped)}'))
    probe = boxes.get('_probe')
    if probe:
        say(f"loop state    max |value(t={DUR}) − value(0)| {probe['loopValue']:.2e}, max |velocity(t={DUR}) − velocity(0)| {probe['loopVelocity']:.2e} (all tracks)"
            + ('  OK' if probe['loopValue'] < 1e-3 and probe['loopVelocity'] < 1e-2 else '  OFF'))

# audio: onsets in the final mix vs the 16th grid, and every SFX cue against the visual cue it belongs to
import librosa
run(['ffmpeg', '-v', 'error', '-y', '-i', str(final), '-vn', '-ac', '1', '-ar', '48000', str(CHK / 'audio.wav')])
y, sr = librosa.load(str(CHK / 'audio.wav'), sr=48000, mono=True)
on = librosa.onset.onset_detect(y=y, sr=sr, units='time', hop_length=128, backtrack=False)
aoff = off_grid(on) * 1000
say(f'audio onsets  {len(on)} detected: median |offset| from 16th grid {np.median(np.abs(aoff)):.1f} ms, '
    f'{(np.abs(aoff) <= 20).mean() * 100:.0f}% within 20 ms')
sfx = {s['name']: s['t'] for s in BEATS['sfx']}
dv = [abs(sfx[nm] - t) * 1000 for nm, t in cues]
say(f'sfx ↔ cues    {len(dv)} cues, max |sfx − visual cue| {max(dv):.2f} ms')
(OUT / f'{name}-check.txt').write_text('\n'.join(report) + '\n')
