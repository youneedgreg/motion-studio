"""Objective checks for a film. Usage: .venv/bin/python tools/check.py films/reel [--skip-render] [--format 9x16]

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
T = json.loads((ROOT / film / 'timeline.json').read_text())
BEATS = json.loads((ROOT / film / 'beats.json').read_text())
FPS, W, H, DUR = T['fps'], T['width'], T['height'], T['duration']
# --format 9x16: check one of timeline.json's formats. Outputs get a -9x16 suffix (the first format is the master).
FMTS = T.get('formats', [])
FMT_NAME = sys.argv[sys.argv.index('--format') + 1] if '--format' in sys.argv else None
FMT = next((f for f in FMTS if f['name'] == FMT_NAME), None) if FMT_NAME else (FMTS[0] if FMTS else None)
if FMT_NAME and not FMT:
    raise SystemExit(f'no format {FMT_NAME!r} in timeline.json')
if FMT:
    W, H = FMT['width'], FMT['height']
RF = ['--format', FMT['name']] if FMT else []   # passed to every render.mjs call
name = film.name + (f"-{FMT['name']}" if FMT and FMT['name'] != FMTS[0]['name'] else '')
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
        run(['node', 'render.mjs', str(film), *RF, '--from', '0', '--to', '2', '--no-audio', '--out', str(CHK / f'det_{tag}.mp4')])
a, b = framemd5(CHK / 'det_a.mp4'), framemd5(CHK / 'det_b.mp4')
same = sum(x == y for x, y in zip(a, b))
say(f'determinism   {same}/{len(a)} frame hashes identical across two renders of 0-2 s' + ('  OK' if same == len(a) == len(b) else '  FAIL'))

# 3 · full render
if not skip_render:
    run(['node', 'render.mjs', str(film), *RF, '--out', str(final)], timeout=1800)
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
run(['node', 'render.mjs', str(film), *RF, '--cue-boxes', str(boxes_path)])
boxes = json.loads(boxes_path.read_text())
cues = [(c['name'], c['beat'] * B) for c in T['cues']]
rows, lat, fails = [], [], []
for nm, t in cues:
    bx = boxes.get(nm)
    x, y, w, h = (0, 0, W, H) if not bx else bx
    x0, y0 = max(0, int(x) - 16), max(0, int(y) - 16)
    x1, y1 = min(W, int(x + w) + 16), min(H, int(y + h) + 16)
    if x1 - x0 < 4 or y1 - y0 < 4:   # the box lies off frame: measure the whole frame, as for cues without a box
        x0, y0, x1, y1 = 0, 0, W, H
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
    run(['node', 'render.mjs', str(film), *RF, '--frames', str(sdir), '--stills', ','.join(f'{x:.4f}' for x in settle)])

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
    probe = boxes.get('_probe')
    if probe:
        say(f"loop state    max |value(t={DUR}) − value(0)| {probe['loopValue']:.2e}, max |velocity(t={DUR}) − velocity(0)| {probe['loopVelocity']:.2e} (all tracks)"
            + ('  OK' if probe['loopValue'] < 1e-3 and probe['loopVelocity'] < 1e-2 else '  OFF'))

# settled text is fully visible. Morph films: each state 1.0 s after its action. Scene films (scenes with
# start/end): each scene 0.3 s before it ends. Each time is rendered with and without the text masks
# (window.filmDebug.noMasks) — the frames must be pixel-identical. A second render also lifts the container
# clip (noClip): anti-aliasing under a clip shifts edges by a few levels, so only differences > 8 levels
# count there — a clipped glyph differs by far more than that.
if 'states' in T:
    text_at = [(s['name'], s['t'] + 1.0) for s in T['states']]
    unit = 'states identical at state + 1.0 s'
else:
    # each scene's `settle` time (all its text at rest); 0.3 s before the scene ends when it has none
    text_at = [(sc['name'], sc.get('settle', sc['end'] - 0.3)) for sc in T.get('scenes', []) if isinstance(sc, dict)]
    unit = 'scenes identical at their settle time'
if text_at:
    from PIL import Image
    stl = ','.join(f'{x:.4f}' for _, x in text_at)
    variants = {'masks_on': None, 'masks_off': '{"noMasks":true}', 'clip_off': '{"noMasks":true,"noClip":true}'}
    for d, dbg in variants.items():
        run(['node', 'render.mjs', str(film), *RF, '--frames', str(CHK / d), '--stills', stl] + (['--debug', dbg] if dbg else []))
    load = lambda d, fn: np.asarray(Image.open(CHK / d / fn).convert('RGB')).astype(int)
    for other, tol, label in (('masks_off', 0, 'text masks off'), ('clip_off', 8, 'container clip off too')):
        clipped = []
        for nm, x in text_at:
            fn = f't_{round(x * FPS) / FPS:.3f}.png'
            diff = np.abs(load('masks_on', fn) - load(other, fn)).max(axis=2)
            n = int((diff > tol).sum())
            if n:
                ys, xs = np.nonzero(diff > tol)
                clipped.append(f"{nm} ({n} px, x {xs.min()}–{xs.max()}, y {ys.min()}–{ys.max()}, max {diff.max()} levels)")
        say(f'text visible  {len(text_at) - len(clipped)}/{len(text_at)} {unit} with {label}'
            + (f' (tolerance {tol} levels)' if tol else ' (exact)') + ('  OK' if not clipped else f'  FAIL: {"; ".join(clipped)}'))

# minimum text size: films that define window.filmTextAudit() list the readable text on screen with its rendered
# size; at each settled time (as above) the smallest must reach the format's minTextPx.
min_px = (FMT or {}).get('minTextPx')
if min_px and text_at:
    audit_path = CHK / 'text-audit.json'
    run(['node', 'render.mjs', str(film), *RF, '--text-audit', str(audit_path), '--at', ','.join(f'{x:.4f}' for _, x in text_at)])
    audit = json.loads(audit_path.read_text())
    if all(a['items'] is None for a in audit):
        say('text size     film has no window.filmTextAudit(); not measured')
    else:
        small, rows = [], []
        for (nm, _), a in zip(text_at, audit):
            items = a['items'] or []
            if not items:
                rows.append(f'{nm}:—'); continue
            lo = min(items, key=lambda i: i['px'])
            rows.append(f"{nm}:{lo['px']:.0f}")
            small += [f"{nm} {i['px']:.0f}px {i['text'][:24]!r}" for i in items if i['px'] < min_px]
        say(f'text size     smallest readable text per scene ≥ {min_px} px' + ('  OK' if not small else f'  FAIL: {"; ".join(small[:8])}'))
        say('              ' + '  '.join(rows))

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
# This only confirms score.py placed each SFX at its cue's timeline time; the measured audio/visual sync is "cue sync".
say(f'sfx placement (internal consistency)  {len(dv)} cues, max |sfx time − cue time| {max(dv):.2f} ms')

# audio health, measured on the delivered file (the mp4's AAC track, decoded)
def ff_stderr(af):
    return subprocess.run(['ffmpeg', '-nostats', '-i', str(final), '-map', '0:a', '-af', af, '-f', 'null', '-'],
                          capture_output=True, text=True, cwd=ROOT).stderr
run(['ffmpeg', '-v', 'error', '-y', '-i', str(final), '-lavfi', 'showspectrumpic=s=1600x600:fscale=log:legend=1',
     '-frames:v', '1', str(OUT / f'{name}-spectrum.png')])
run(['ffmpeg', '-v', 'error', '-y', '-i', str(final), '-lavfi', 'showwavespic=s=1600x400:split_channels=1:colors=0x10b981|0x10b981',
     '-frames:v', '1', str(OUT / f'{name}-wave.png')])
say(f'audio images  out/{name}-spectrum.png (log frequency), out/{name}-wave.png')
pcm = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', str(final), '-map', '0:a', '-f', 'f32le', '-acodec', 'pcm_f32le', '-'],
                                   capture_output=True, cwd=ROOT).stdout, np.float32)
clipped = int((np.abs(pcm) >= 1.0).sum())   # astats has no clip counter; this is what clips on any fixed-point delivery
st = ff_stderr('astats=measure_overall=none')
dc = [float(v) for v in re.findall(r'DC offset: (-?[\d.]+)', st)]
crest = [float(v) for v in re.findall(r'Crest factor: ([\d.]+)', st)]
flat = [float(v) for v in re.findall(r'Flat factor: ([\d.]+)', st)]
say(f'clipping      {clipped} samples at or beyond full scale (|x| >= 1.0); astats flat factor {max(flat):.2f}'
    + ('  OK' if clipped == 0 else '  FAIL'))
say(f'astats        DC offset {" / ".join(f"{v:+.6f}" for v in dc)} (L / R), crest factor '
    + ' / '.join(f'{v:.2f} ({20 * np.log10(v):.1f} dB)' for v in crest))
small = ff_stderr('highpass=f=150,highpass=f=150,ebur128')
I_small = float(re.search(r'I:\s+(-?[\d.]+) LUFS', small[small.rfind('Summary:'):]).group(1))
say(f'small speaker {I_small:.1f} LUFS after two 150 Hz high-pass stages vs {I:.1f} LUFS full range: {I - I_small:.1f} LU drop')
(OUT / f'{name}-check.txt').write_text('\n'.join(report) + '\n')

# exit non-zero when any check failed, so CI can gate on it
failed = [l for l in report if re.search(r'\s(FAIL|OFF|JUMP)\b', l)]
if failed:
    print(f'\n{len(failed)} check(s) failed', file=sys.stderr)
    sys.exit(1)
