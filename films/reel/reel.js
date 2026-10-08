// REEL — a 15 s showreel in six bars at 96 BPM. One scene per bar, every cut is a match cut.
//   1 type    I MAKE THINGS MOVE, variable-font axes as animation, zoom through the counter of the O
//   2 shape   the O's ring collapses to a disc → superellipse → 2×2 → 4×4 → mosaic wipe to paper
//   3 weight  a ball bounces on the beat across WEIGHT, onion skins behind, motion path ahead
//   4 depth   CSS 3D type cylinders snapping on the beat, collapsing into a single line
//   5 curves  that line becomes the time axis of a graph editor; four easing curves, swept on the beat
//   6 name    the curve's stroke floods the frame; name card, then everything thins out into frame 0
import T from './timeline.json' with { type: 'json' };
import { rng } from '../../lib/rng.js';
import { clamp, lerp, prog, ease, spring, kick } from '../../lib/motion.js';

const W = T.width, H = T.height;
const B = 60 / T.bpm;               // one beat, seconds
const BAR = B * T.beatsPerBar;
const E8 = B / 2, E16 = B / 4;
const CUE = Object.fromEntries(T.cues.map((c) => [c.name, c.beat * B]));
const INK = '#111111', PAPER = '#EEEAE2', ACCENT = '#FF5A1F';
const M = 72, CW = W - 2 * M;       // margin, content width
const BASE = 0.8638, CAP = 0.7275;  // Inter: baseline below the top of a line-height:1 box; cap height (em)
const AXIS_Y = 1350;                // where scene 4 collapses and scene 5's time axis lives

const under = document.getElementById('under').getContext('2d');
const over = document.getElementById('over').getContext('2d');
const dom = document.getElementById('dom');

// ---------- helpers ----------
function node(tag, parent, cls, style) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (style) Object.assign(e.style, style);
  parent.appendChild(e);
  return e;
}
function wordLine(parent, text, color) {
  const line = node('div', parent, 'line', { color });
  // outer span takes motion transforms; inner span carries the emulated width (see setAxes)
  const glyphs = [...text].map((ch) => { const s = node('span', line, 'g'); node('span', s, 'gi').textContent = ch; return s; });
  return { line, glyphs, fs: 100, baseline: 0 };
}
// Axis values are kept on the old 1-1000 weight / 30-150 width scales the choreography was written in.
// Weight maps onto Inter's 100-900. Inter has no width axis, so width is a horizontal scale of the
// glyph with its advance corrected, so neighbours re-space as they would with a real width axis.
const interW = (w) => 100 + ((clamp(w, 1, 1000) - 1) * 800) / 999;
const widthScale = (d) => { d = clamp(d, 30, 150); return d <= 100 ? lerp(0.6, 1, (d - 30) / 70) : lerp(1, 1.3, (d - 100) / 50); };
const setAxes = (g, w, d) => {
  g.style.fontVariationSettings = `"wght" ${interW(w).toFixed(1)}`;
  const inner = g.firstChild, k = widthScale(d);
  inner.style.transform = `scaleX(${k.toFixed(4)})`;
  // in em, so the correction survives a later font-size change (fit() measures at 100px, then resizes)
  inner.style.marginRight = `${((k - 1) * inner.offsetWidth / parseFloat(getComputedStyle(g).fontSize)).toFixed(4)}em`;
};
function place(L, fs, baseline, x = M) {
  L.fs = fs; L.baseline = baseline;
  Object.assign(L.line.style, { fontSize: `${fs}px`, left: `${x}px`, top: `${baseline - BASE * fs}px` });
}
function fit(L, w, d, width) {
  place(L, 100, 0);
  L.glyphs.forEach((g) => setAxes(g, w, d));
  return (100 * width) / L.line.getBoundingClientRect().width;
}
// Glyphs below the baseline are clipped, so type can rise out of (and sink into) the line it sits on.
function maskAtBaseline(L) {
  const b = BASE * L.fs;
  L.line.style.clipPath = `polygon(-50% -300%, 150% -300%, 150% ${b}px, -50% ${b}px)`;
}
function mono(ctx, text, x, y, color, size = 44, weight = 500) {
  ctx.font = `${weight} ${size}px UI`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function mix(a, b, u) {
  const A = hex(a), Bc = hex(b);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, Bc[i], u))).join(',')})`;
}
function squircle(ctx, cx, cy, a, n, rot) {
  const N = 180, e = 2 / n, c0 = Math.cos(rot), s0 = Math.sin(rot);
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * Math.PI * 2;
    const c = Math.cos(th), s = Math.sin(th);
    const x = a * Math.sign(c) * Math.pow(Math.abs(c), e);
    const y = a * Math.sign(s) * Math.pow(Math.abs(s), e);
    const px = cx + x * c0 - y * s0, py = cy + x * s0 + y * c0;
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
  }
  ctx.closePath();
}
const fill = (ctx, c) => { ctx.fillStyle = c; ctx.fillRect(0, 0, W, H); };
// A cued hit: fully deflected on the cue frame itself (so it lands with its sound), then springs back to 0.
const hit = (dt, freq = 4, damp = 0.5) => (dt < 0 ? 0 : 1 - spring(dt, freq, damp));
// Words rising from their baseline mask: hidden before the cue, already 40 % up on the cue frame.
const riseFrom = (p) => (1 - p) * 60;
const PAPER_DIM = 'rgba(238,234,226,0.72)', INK_DIM = 'rgba(17,17,17,0.72)';

await document.fonts.load('900 100px Disp');
await document.fonts.load('500 40px UI');
await document.fonts.ready;

// ---------- 1 · type ----------
const s1 = (() => {
  const el = node('div', dom, 'scene');
  const wrap = node('div', el, null, { position: 'absolute', inset: '0' });
  const L1 = wordLine(wrap, 'I MAKE', PAPER);
  const L2 = wordLine(wrap, 'THINGS', PAPER);
  const L3 = wordLine(wrap, 'MOVE', ACCENT);
  const readout = node('div', wrap, null, { position: 'absolute', left: `${M}px`, font: '500 44px UI', fontVariantNumeric: 'tabular-nums', color: PAPER_DIM, whiteSpace: 'pre' });
  return { el, wrap, L1, L2, L3, readout, origin: { x: 540, y: 960 } };
})();
const S1_AXES = { L1: [800, 112], L2: [800, 76], L3: [1000, 64] };
{
  s1.el.style.display = 'block';
  const { L1, L2, L3 } = s1;
  const f1 = fit(L1, ...S1_AXES.L1, CW), f2 = fit(L2, ...S1_AXES.L2, CW), f3 = fit(L3, ...S1_AXES.L3, CW);
  const gap = 44;
  const total = CAP * (f1 + f2 + f3) + 2 * gap;
  const top = 930 - total / 2;
  const b1 = top + CAP * f1, b2 = b1 + gap + CAP * f2, b3 = b2 + gap + CAP * f3;
  place(L1, f1, b1); place(L2, f2, b2); place(L3, f3, b3);
  [L1, L2].forEach(maskAtBaseline);
  L3.glyphs.forEach((g) => { g.style.transformOrigin = `50% ${BASE * 100}%`; });
  s1.readout.style.top = `${b3 + 64}px`;
  s1.el.style.display = 'none';
}
const POPS = { 0: CUE['pop-m'], 2: CUE['pop-v'], 3: CUE['pop-e'] };

function drawS1(t) {
  fill(under, INK);
  const { L1, L2, L3, wrap } = s1;
  const recoil = -38 * kick(t - CUE['word-move'], 2.4, 0.32); // the stack flinches when MOVE lands
  const shown = []; // [label, wght, wdth, since]

  // "I" inflates from a hairline
  {
    const dt = t - CUE['word-i'];
    const w = lerp(300, 800, ease.outExpo(prog(dt, 0, 0.3))), d = lerp(50, 112, spring(dt, 2.6, 0.42));
    setAxes(L1.glyphs[0], w, d);
    // lands with a squash on the downbeat
    const punch = kick(dt, 3.5, 0.35);
    L1.glyphs[0].style.transformOrigin = `50% ${BASE * 100}%`;
    L1.glyphs[0].style.transform = `translateY(${recoil}px) scale(${1 + 0.18 * punch}, ${1 - 0.22 * punch})`;
    shown.push(['I', w, d, CUE['word-i']]);
  }
  // "MAKE" rises out of the baseline letter by letter, unclenching from fully expanded
  for (let i = 2; i < 6; i++) {
    const dt = t - CUE['word-make'] - (i - 2) * 0.03;
    const d = lerp(150, 112, ease.outCubic(prog(dt, 0, 0.5)));
    setAxes(L1.glyphs[i], 800, d);
    L1.glyphs[i].style.visibility = dt < 0 ? 'hidden' : 'visible';
    L1.glyphs[i].style.transform = `translateY(calc(${riseFrom(ease.outExpo(prog(dt, 0, 0.36)))}% + ${recoil}px))`;
    if (i === 2 && dt >= 0) shown.push(['MAKE', 800, d, CUE['word-make']]);
  }
  // "THINGS" unfolds from the left margin: width and weight together
  L2.glyphs.forEach((g, i) => {
    const dt = t - CUE['word-things'] - i * 0.014;
    g.style.visibility = dt < 0 ? 'hidden' : 'visible';
    const w = lerp(150, 800, ease.outExpo(prog(dt, 0, 0.3))), d = lerp(30, 76, spring(dt, 2.4, 0.5));
    setAxes(g, w, d);
    g.style.transform = `translateY(${recoil * 0.6}px)`;
    if (i === 0 && dt >= 0) shown.push(['THINGS', w, d, CUE['word-things']]);
  });
  // "MOVE" shoots up from the baseline; letters then pop on the 8ths
  L3.glyphs.forEach((g, i) => {
    const dt = t - CUE['word-move'] - i * 0.035;
    const sy = spring(dt, 3.2, 0.32);
    let w = 1000, d = 64, lift = 0;
    if (POPS[i] !== undefined) {
      const k = hit(t - POPS[i], 3.4, 0.55);
      w -= 700 * Math.max(0, k);
      d += 46 * Math.max(0, k);
      lift = -80 * k;
      if (t >= POPS[i]) shown.push([`MOVE[${i}]`, w, d, POPS[i]]);
    }
    if (i === 0 && t >= CUE['word-move']) shown.push(['MOVE', w, d, CUE['word-move']]);
    setAxes(g, w, d);
    g.style.transform = `translateY(${lift}px) scaleY(${Math.max(0, sy)})`;
  });
  const [label, w, d] = shown.sort((a, b) => b[3] - a[3])[0];
  s1.readout.textContent = `${label.padEnd(8)} wght ${String(Math.round(w)).padStart(4)}  wdth ${String(Math.round(d)).padStart(3)}`;

  // Zoom into the counter of the O. Its centre stays fixed on screen and becomes scene 2's origin.
  wrap.style.transform = 'none';
  const o = L3.glyphs[1].getBoundingClientRect();
  const ox = o.left + o.width / 2, oy = L3.baseline - (CAP * L3.fs) / 2;
  s1.origin = { x: ox, y: oy };
  const z = ease.inCubic(prog(t, CUE['pop-e'], CUE.ring));
  wrap.style.transformOrigin = `${ox}px ${oy}px`;
  wrap.style.transform = z > 0 ? `scale(${Math.exp(Math.log(120) * z)})` : 'none';
}

// Scene 2 starts exactly where scene 1's zoom was centred.
const O_CENTER = (() => {
  s1.el.style.display = 'block';
  drawS1(CUE['pop-e']);
  s1.el.style.display = 'none';
  return { ...s1.origin };
})();

// ---------- 2 · shape ----------
const S2_C = { x: 540, y: 860 };
function drawS2(t) {
  const ctx = under;
  fill(ctx, INK);
  const u = t - CUE.ring;
  const tSq = CUE.squircle - CUE.ring, t4 = CUE['split-4'] - CUE.ring, t16 = CUE['split-16'] - CUE.ring, tMos = CUE.mosaic - CUE.ring;
  const mv = ease.inOutCubic(prog(u, 0.05, 0.75));
  const cx = lerp(O_CENTER.x, S2_C.x, mv), cy = lerp(O_CENTER.y, S2_C.y, mv);
  const A = 210;
  let readout = '';
  ctx.fillStyle = ACCENT;

  if (u < tSq) {
    // the O's edge, collapsing from beyond the frame into a solid disc
    const ro = lerp(1250, A, ease.outExpo(prog(u, 0, 0.45)));
    const ri = Math.max(0, ro - lerp(120, ro, ease.inOutCubic(prog(u, 0.12, 0.6))));
    ctx.beginPath();
    ctx.arc(cx, cy, ro, 0, Math.PI * 2);
    if (ri > 0.5) ctx.arc(cx, cy, ri, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    readout = `circle  r ${Math.round(ro)}`;
  } else if (u < t4) {
    const dt = u - tSq;
    const n = 2 + 8 * spring(dt, 2.6, 0.38);
    squircle(ctx, cx, cy, A * (1 + 0.14 * hit(dt, 4, 0.5)), Math.max(1.3, n), (Math.PI / 2) * spring(dt, 2.0, 0.5));
    ctx.fill();
    readout = `superellipse  n ${n.toFixed(2)}`;
  } else {
    const n0 = 2 + 8 * spring(u - tSq, 2.6, 0.38);
    const d4 = A / 2 + (u >= t4 ? 12 + 22 * spring(u - t4, 3, 0.4) : 0);   // the gap opens on the beat
    for (let q = 0; q < 4; q++) {
      const qx = q & 1 ? 1 : -1, qy = q & 2 ? 1 : -1;
      const qcx = cx + qx * d4, qcy = cy + qy * d4;
      const qrot = (Math.PI / 2) * spring(u - t4 - q * 0.04, 2.6, 0.45) * qx * qy;
      if (u < t16) { squircle(ctx, qcx, qcy, A / 2, n0, qrot); ctx.fill(); continue; }
      for (let sub = 0; sub < 4; sub++) {
        const sx = sub & 1 ? 1 : -1, sy = sub & 2 ? 1 : -1;
        const i = (qx > 0 ? 2 : 0) + (sx > 0 ? 1 : 0), j = (qy > 0 ? 2 : 0) + (sy > 0 ? 1 : 0);
        const p = spring(u - t16 - (i + j) * 0.025, 2.8, 0.42);
        const odd = (i + j) % 2 === 1;
        const tx = cx + (i - 1.5) * 200, ty = cy + (j - 1.5) * 200;
        const px = lerp(qcx + sx * (A / 4), tx, p), py = lerp(qcy + sy * (A / 4), ty, p);
        squircle(ctx, px, py, lerp(A / 4, 74, p), Math.max(1.3, lerp(n0, odd ? 2 : 10, clamp(p, 0, 1.2))), (Math.PI / 2) * p * (odd ? 1 : -1));
        ctx.fill();
      }
    }
    readout = u < t16 ? 'split  2 × 2' : 'grid  4 × 4   n 2 | 10';
  }
  if (u > 0.35) mono(ctx, readout, M, S2_C.y + 500, PAPER_DIM);

  // mosaic wipe to paper: dots grow into squares, rippling out from the shape
  if (u >= tMos) {
    const cols = 6, rows = 10, cw = W / cols, ch = H / rows;
    const maxD = Math.hypot(W, H) * 0.62;
    let dMin = Infinity;   // the nearest cell starts exactly on the cue
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) dMin = Math.min(dMin, Math.hypot((c + 0.5) * cw - cx, (r + 0.5) * ch - cy));
    ctx.fillStyle = PAPER;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = (c + 0.5) * cw, y = (r + 0.5) * ch;
      const delay = 0.3 * clamp((Math.hypot(x - cx, y - cy) - dMin) / maxD);
      const p = prog(u - tMos - delay, 0, 0.26);
      if (p <= 0) continue;
      const s = lerp(0.3, 1, ease.outExpo(p)), w = (cw + 2) * s, h = (ch + 2) * s;
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - h / 2, w, h, (1 - p) * Math.min(w, h) / 2);
      ctx.fill();
    }
  }
}

// ---------- 3 · weight ----------
const s3 = (() => {
  const el = node('div', dom, 'scene');
  const L = wordLine(el, 'WEIGHT', INK);
  return { el, L };
})();
const S3 = (() => {
  s3.el.style.display = 'block';
  const L = s3.L;
  const fs = fit(L, 900, 100, CW);
  const baseline = 1440;
  place(L, fs, baseline);
  maskAtBaseline(L);
  L.glyphs.forEach((g) => { g.style.transformOrigin = `50% ${BASE * 100}%`; });
  const boxes = L.glyphs.map((g) => { const r = g.getBoundingClientRect(); return { x: r.left + r.width / 2, top: baseline - CAP * fs }; });
  s3.el.style.display = 'none';
  const R = 62;
  const hits = [0, 2, 4].map((gi, k) => ({ gi, t: CUE[`bounce-${k + 1}`], x: boxes[gi].x, y: boxes[gi].top - R }));
  const start = { t: CUE.weight, x: hits[0].x - 90, y: -2 * R };
  const G = (2 * (hits[0].y - start.y)) / Math.pow(hits[0].t - start.t, 2); // apex at the downbeat
  return { fs, baseline, floor: baseline + 22, R, hits, start, G };
})();

// Ballistic flight under one gravity through every contact point: impacts land exactly on the beats.
function ballAt(t) {
  const { hits, start, G } = S3;
  const pts = [start, ...hits];
  if (t < start.t) return null;
  for (let k = 0; k < pts.length - 1; k++) {
    const a = pts[k], b = pts[k + 1];
    if (t < b.t) {
      const D = b.t - a.t, tau = t - a.t;
      const vx = (b.x - a.x) / D;
      const vy = k === 0 ? 0 : (b.y - a.y - 0.5 * G * D * D) / D;
      return { x: a.x + vx * tau, y: a.y + vy * tau + 0.5 * G * tau * tau, vx, vy: vy + G * tau, r: S3.R };
    }
  }
  // last contact launches it up and at the camera; it fills the frame orange by the next downbeat
  const a = hits[hits.length - 1], tau = t - a.t;
  const vy0 = -G * 0.4, vx = -520;
  const px = a.x + vx * tau, py = a.y + vy0 * tau + 0.5 * G * tau * tau;
  const z = ease.inCubic(prog(t, a.t + 0.08, CUE.rings));
  return { x: lerp(px, 540, z), y: lerp(py, 960, z), vx, vy: vy0 + G * tau, r: S3.R * Math.exp(Math.log(24) * z), zoom: z };
}

function drawBall(ctx, b, t, contactTimes, color = ACCENT) {
  let sq = 0;
  for (const c of contactTimes) sq = Math.max(sq, hit(t - c, 6, 0.55));   // full squash on the contact frame
  ctx.fillStyle = color;
  ctx.beginPath();
  if (sq > 0.02) {
    ctx.ellipse(b.x, b.y + b.r * 0.38 * sq, b.r * (1 + 0.38 * sq), b.r * (1 - 0.38 * sq), 0, 0, Math.PI * 2);
  } else {
    const v = Math.hypot(b.vx, b.vy), st = b.zoom ? 1 : 1 + Math.min(0.26, v / 9000);
    ctx.ellipse(b.x, b.y, b.r * st, b.r / st, Math.atan2(b.vy, b.vx), 0, Math.PI * 2);
  }
  ctx.fill();
}

function drawS3(t) {
  fill(under, PAPER);
  const { L } = s3;
  const { hits, floor, R } = S3;
  // floor rule
  under.fillStyle = INK;
  under.fillRect(M, floor, CW * ease.outExpo(prog(t, CUE.weight, CUE.weight + 0.45)), 6);
  // letters rise out of the floor, then take the hits
  L.glyphs.forEach((g, i) => {
    const dr = t - CUE.weight - i * 0.035;
    const rise = ease.outExpo(prog(dr, 0, 0.42));
    let q = 0;
    for (const h of hits) q += hit(t - h.t, 4.5, 0.45) * (h.gi === i ? 1 : Math.abs(h.gi - i) === 1 ? 0.3 : 0);
    setAxes(g, 900 - 260 * Math.max(0, q), 100 + 34 * Math.max(0, q));
    g.style.visibility = dr < 0 ? 'hidden' : 'visible';
    g.style.transform = `translateY(${riseFrom(rise)}%) scale(${1 + 0.1 * q}, ${1 - 0.24 * q})`;
  });
  const b = ballAt(t);
  const nHit = hits.filter((h) => t >= h.t).length;
  mono(under, `g ${Math.round(S3.G)} px/s²  ·  bounce ${nHit}/3`, M, floor + 96, INK_DIM);
  if (!b) return;
  const ctx = over;
  const lastHit = hits[hits.length - 1].t;
  if (t < lastHit + 0.1) {
    // motion path ahead: dotted
    const next = hits.find((h) => h.t > t);
    if (next) {
      ctx.save();
      ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.setLineDash([0.1, 18]);
      ctx.beginPath();
      for (let s = 0; s <= 40; s++) { const p = ballAt(lerp(t, next.t, s / 40)); s ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }
      ctx.stroke();
      ctx.restore();
    }
    // onion skins behind: the spacing shows the timing
    ctx.lineWidth = 3;
    for (let k = 7; k >= 1; k--) {
      const tk = t - k / 24;
      const p = tk >= S3.start.t ? ballAt(tk) : null;
      if (!p) continue;
      ctx.strokeStyle = `rgba(17,17,17,${(0.5 - k * 0.055).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, Math.PI * 2); ctx.stroke();
    }
  }
  drawBall(ctx, b, t, hits.map((h) => h.t));
}

// ---------- 4 · depth ----------
const RING_WORDS = ['DEPTH', 'SPACE', 'ORBIT'];
const s4 = (() => {
  const el = node('div', dom, 'scene', { perspective: '1400px', perspectiveOrigin: '540px 960px' });
  const rings = RING_WORDS.map((word) => {
    const ring = node('div', el, null, { position: 'absolute', left: '540px', top: '0px', transformStyle: 'preserve-3d' });
    const glyphs = [...`${word}•`.repeat(3)].map((ch) => {
      const s = node('span', ring, null, { position: 'absolute', left: '0', top: '0', font: '150px Disp', lineHeight: '1', whiteSpace: 'pre', transformOrigin: '0 0' });
      s.textContent = ch;
      return s;
    });
    return { ring, glyphs };
  });
  return { el, rings };
})();

function drawS4(t) {
  fill(under, ACCENT);
  const u = t - CUE.rings;
  const col = ease.inOutCubic(prog(t, CUE.collapse, CUE.doors - 0.03));
  const dolly = ease.outExpo(prog(t, CUE['snap-2'], CUE['snap-2'] + 0.5));
  const P = lerp(lerp(1400, 780, dolly), 3200, col);
  s4.el.style.perspective = `${P}px`;
  const tiltBase = lerp(-26, 14, ease.inOutCubic(prog(t, CUE.rings, CUE.collapse)));
  const snaps = [CUE['snap-1'], CUE['snap-2'], CUE.collapse];
  let a0 = 0;
  s4.rings.forEach(({ ring, glyphs }, k) => {
    const dir = k % 2 ? -1 : 1;
    let a = 30 * u + k * 40 + 150 * (1 - ease.outExpo(prog(u - k * 0.06, 0, 0.6)));
    for (const s of snaps) a += 90 * ease.outExpo(prog(t - s - k * 0.06, 0, 0.42));
    a *= dir;
    if (k === 0) a0 = a;
    const gu = u - k * 0.06;
    const grow = gu < 0 ? 0 : 0.35 + 0.65 * spring(gu, 2.4, 0.5);   // visible on the downbeat
    const R = lerp(400, 468, col);
    const y = lerp(960 + (k - 1) * 330, AXIS_Y, col);
    const tilt = lerp(tiltBase + (k - 1) * 6, 0, col);
    const sy = lerp(1, 0.035, col);
    ring.style.transform = `translateY(${y}px) rotateX(${tilt}deg) scale3d(${grow}, ${grow * sy}, ${grow}) rotateY(${a}deg)`;
    const n = glyphs.length;
    glyphs.forEach((g, i) => {
      const th = (360 / n) * i;
      const f = (Math.cos(((a + th) * Math.PI) / 180) + 1) / 2; // 1 = facing camera
      g.style.color = mix(ACCENT, INK, 0.3 + 0.7 * Math.pow(f, 1.2));
      g.style.fontVariationSettings = `"wght" ${interW(200 + 800 * Math.pow(f, 1.5)).toFixed(1)}`;
      g.style.transform = `rotateY(${th}deg) translateZ(${R}px) translate(-50%, ${-(BASE - CAP / 2) * 100}%)`;
    });
  });
  const deg = ((a0 % 360) + 360) % 360;
  mono(over, `rotateY ${deg.toFixed(1).padStart(5)}°   perspective ${Math.round(P)}px`, M, 1800, INK_DIM);
}

// ---------- 5 · curves ----------
const CURVES = [
  { name: 'linear', f: ease.linear },
  { name: 'ease-in-out  cubic', f: ease.inOutCubic },
  { name: 'ease-out  back 2.4', f: (x) => ease.outBack(x, 2.4) },
  { name: 'spring  3.2 Hz  ζ 0.22', f: (x) => spring(x, 3.2, 0.22) },
];
const GX0 = M, GX1 = W - M, GV = 620; // graph: x span, pixels per unit value
const gy = (v) => AXIS_Y - v * GV;
const TRACK_Y = 250;
const GLITCH = '/\\|_-+=*#<>';

function curvePath(ctx, f, upto = 1) {
  ctx.beginPath();
  const N = 160;
  for (let s = 0; s <= N; s++) {
    const x = (s / N) * upto;
    const px = lerp(GX0, GX1, x), py = gy(f(x));
    s ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
}

function drawS5(t) {
  const ctx = under;
  fill(ctx, PAPER);
  const u = t - CUE.doors;
  const k = clamp(Math.floor(u / B + 1e-9), 0, 3);
  const p = clamp((u - k * B) / B);
  const cur = CURVES[k], prev = CURVES[Math.max(0, k - 1)];
  const m = k ? ease.outExpo(prog(u - k * B, 0, 0.22)) : 1;
  const f = (x) => lerp(prev.f(x), cur.f(x), m);
  const v = f(p);

  // y axis grows up from the time axis; value-1 guide; quarter ticks
  ctx.fillStyle = INK;
  const yTop = lerp(AXIS_Y, 420, ease.outExpo(prog(u, 0.08, 0.5)));
  ctx.fillRect(GX0 - 2, yTop, 4, AXIS_Y - yTop);
  for (let q = 1; q <= 4; q++) ctx.fillRect(lerp(GX0, GX1, q / 4) - 2, AXIS_Y, 4, 18);
  ctx.save();
  ctx.strokeStyle = 'rgba(17,17,17,0.25)'; ctx.lineWidth = 2; ctx.setLineDash([10, 12]);
  ctx.beginPath(); ctx.moveTo(GX0, gy(1)); ctx.lineTo(GX0 + (GX1 - GX0) * ease.outExpo(prog(u, 0.15, 0.6)), gy(1)); ctx.stroke();
  // playhead guides
  const px = lerp(GX0, GX1, p), py = gy(v);
  ctx.beginPath(); ctx.moveTo(GX0, py); ctx.lineTo(px, py); ctx.moveTo(px, py); ctx.lineTo(px, AXIS_Y); ctx.stroke();
  ctx.restore();
  mono(ctx, '1.0', GX0 + 14, gy(1) - 16, INK_DIM, 36);
  mono(ctx, 'time →', GX1 - 150, AXIS_Y + 64, INK_DIM, 36);

  // earlier curves stay as ghosts
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let j = 0; j < k; j++) { curvePath(ctx, CURVES[j].f); ctx.strokeStyle = 'rgba(17,17,17,0.16)'; ctx.lineWidth = 4; ctx.stroke(); }

  // result track: the same value driving position
  ctx.fillStyle = INK;
  ctx.fillRect(GX0, TRACK_Y - 2, (GX1 - GX0) * ease.outExpo(prog(u, 0.1, 0.5)), 4);
  const S = 96;
  ctx.fillStyle = ACCENT;
  ctx.fillRect(GX0 + v * (GX1 - GX0 - S), TRACK_Y - S / 2, S, S);

  // label: scrambles into the new name on each beat
  const lt = u - k * B;
  const label = [...cur.name].map((ch, i) => {
    if (ch === ' ' || lt > 0.02 + i * 0.012) return ch;
    const r = rng(k * 1000 + i * 31 + Math.floor(t * 30));
    return GLITCH[Math.floor(r() * GLITCH.length)];
  }).join('');
  mono(ctx, label, GX0, TRACK_Y - 90, INK, 44);
  mono(ctx, `t ${p.toFixed(2)}   value ${v.toFixed(2)}`, GX0, AXIS_Y + 120, INK_DIM);

  // the current curve and its playhead
  const flood = ease.inExpo(prog(t, CUE.name - E8, CUE.name));
  curvePath(ctx, f, k === 0 ? Math.max(p, 0.001) : 1);
  ctx.strokeStyle = INK; ctx.lineWidth = 8;
  ctx.stroke();
  ctx.fillStyle = ACCENT;
  ctx.beginPath(); ctx.arc(px, py, 20, 0, Math.PI * 2); ctx.fill();

  // doors: scene 4's orange splits open along the axis
  const d = Math.min(1, ease.outExpo(prog(u, 0, 0.36)) / 0.97); // fully clear, no slivers left at the edges
  if (d < 1) {
    ctx.fillStyle = ACCENT;
    ctx.fillRect(0, -AXIS_Y * d, W, AXIS_Y);
    ctx.fillRect(0, AXIS_Y + (H - AXIS_Y) * d, W, H - AXIS_Y);
  }
  ctx.fillStyle = INK;
  ctx.fillRect(GX0, AXIS_Y - 2, GX1 - GX0, 4);

  // exit: the stroke thickens until it is the whole frame
  if (flood > 0) {
    curvePath(ctx, f);
    ctx.strokeStyle = INK; ctx.lineWidth = 8 + 4400 * flood;
    ctx.stroke();
  }
}

// ---------- 6 · name ----------
const s6 = (() => {
  const el = node('div', dom, 'scene');
  const L = wordLine(el, 'CLAUDE', PAPER);
  return { el, L };
})();
const S6 = (() => {
  s6.el.style.display = 'block';
  const L = s6.L;
  const fs = fit(L, 900, 46, CW - 100);
  const baseline = 960;
  place(L, fs, baseline);
  maskAtBaseline(L);
  L.glyphs.forEach((g) => { g.style.transformOrigin = `50% ${BASE * 100}%`; });
  const right = L.line.getBoundingClientRect().right;
  s6.el.style.display = 'none';
  const r = 0.085 * fs;
  return { fs, baseline, r, dotX: right + 0.05 * fs + r, dotY: baseline - r };
})();
const TYPE_RATE = 0.018; // seconds per typed character (score.py types its ticks at the same rate)
const LINES = [
  { text: 'MOTION DESIGNER', at: CUE.name + E8, size: 60, color: PAPER, dy: 180 },
  { text: 'REEL 2026 · 15 S · 96 BPM', at: CUE.period, size: 46, color: PAPER_DIM, dy: 260 },
  { text: 'OPEN TO NEW PROJECTS →', at: CUE.period + E8, size: 46, color: ACCENT, dy: 330 },
];

function drawS6(t) {
  fill(under, INK);
  const { L } = s6;
  const { baseline, r, dotX, dotY } = S6;
  const out = t - CUE.outro;

  L.glyphs.forEach((g, i) => {
    const dt = t - CUE.name - i * 0.04;
    const rise = ease.outExpo(prog(dt, 0, 0.45));
    g.style.visibility = dt < 0 ? 'hidden' : 'visible';
    let w = lerp(300, 900, ease.outExpo(prog(dt, 0, 0.5)));
    let d = lerp(30, 46, spring(dt, 2.8, 0.45));
    w -= 520 * Math.max(0, hit(t - CUE.tagline - i * 0.05, 3, 0.6));
    const o = out - i * 0.02;
    w = lerp(w, 1, ease.inExpo(prog(o, 0, 0.4)));
    d = lerp(d, 30, ease.inCubic(prog(o, 0, 0.4)));
    const sink = ease.inExpo(prog(o, 0.22, 0.5));
    const jolt = -40 * hit(o, 4, 0.6); // flinch on the outro downbeat before thinning out
    setAxes(g, w, d);
    g.style.transform = `translateY(calc(${riseFrom(rise) + sink * 100}% + ${jolt}px))`;
  });

  const ctx = over;
  // accent rule draws in, then retracts to the right
  const ry = baseline + 70;
  const x0 = M + CW * ease.inExpo(prog(out, 0.05, 0.4));
  const x1 = M + CW * ease.outExpo(prog(t, CUE.name + E8, CUE.name + E8 + 0.45));
  if (x1 > x0) { ctx.fillStyle = ACCENT; ctx.fillRect(x0, ry, x1 - x0, 10); }

  // typed lines, deleted again on the way out
  const del = 1 - prog(out, 0.12, 0.34);
  let cursor = null;
  for (const ln of LINES) {
    const n = t < ln.at ? 0 : Math.floor(Math.min(ln.text.length, Math.floor((t - ln.at) / TYPE_RATE) + 1) * del);
    if (n <= 0) continue;
    const s = ln.text.slice(0, n);
    mono(ctx, s, M, baseline + ln.dy, ln.color, ln.size);
    ctx.font = `500 ${ln.size}px UI`;
    cursor = { x: M + ctx.measureText(s).width + 6, y: baseline + ln.dy, size: ln.size };
  }
  if (cursor && Math.floor(t / E8) % 2 === 0 && out < 0.34) {
    ctx.fillStyle = PAPER;
    ctx.fillRect(cursor.x, cursor.y - cursor.size * 0.75, cursor.size * 0.55, cursor.size * 0.85);
  }

  // the ball from scene 3 comes back as the full stop
  const land = CUE.period, drop = land - E8;
  if (t >= drop) {
    const g = (2 * (dotY + 2 * r)) / (E8 * E8);
    let y, contacts = [land];
    if (t < land) y = -2 * r + 0.5 * g * (t - drop) * (t - drop);
    else {
      // two small rebounds, then rest
      const hts = [0.4 * 110, 0.12 * 110];
      let tt = t - land; y = dotY;
      for (const h of hts) {
        const D = 2 * Math.sqrt((2 * h) / g);
        if (tt < D) { y = dotY - (h - 0.5 * g * Math.pow(tt - D / 2, 2)); break; }
        tt -= D; contacts.push(t - tt);
      }
    }
    if (out > 0) {
      // anticipation hop, then it drops through the floor
      y = dotY - 600 * out + 0.5 * 9000 * out * out;
      contacts = [];
    }
    drawBall(ctx, { x: dotX, y, vx: 0, vy: 0, r }, t, contacts);
  }
}

// ---------- cue boxes: the element each cue moves, for tools/check.py (null = the whole frame) ----------
function rectOf(els) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const e of els) {
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
  }
  return x0 < x1 ? [x0, y0, x1 - x0, y1 - y0] : null;
}
window.cueBox = (name) => {
  const pops = { 'pop-m': 0, 'pop-v': 2, 'pop-e': 3 };
  if (name === 'word-i') return rectOf([s1.L1.glyphs[0]]);
  if (name === 'word-make') return rectOf(s1.L1.glyphs.slice(2));
  if (name === 'word-things') return rectOf(s1.L2.glyphs);
  if (name === 'word-move') return rectOf(s1.L3.glyphs);
  if (name in pops) return rectOf([s1.L3.glyphs[pops[name]]]);
  if (name === 'squircle' || name === 'split-4') return [S2_C.x - 280, S2_C.y - 280, 560, 560];
  if (name === 'split-16') return [S2_C.x - 420, S2_C.y - 420, 840, 840];
  if (name === 'mosaic') return [S2_C.x - 180, S2_C.y - 96, 360, 192];          // the two nearest cells
  if (name === 'weight') return rectOf(s3.L.glyphs);
  if (name.startsWith('bounce-')) {
    // the hit letter's cap height: the ball's underside meets its top edge exactly at contact
    const g = rectOf([s3.L.glyphs[S3.hits[Number(name.slice(-1)) - 1].gi]]);
    const capTop = S3.baseline - CAP * S3.fs;
    return g && [g[0], capTop, g[2], S3.baseline - capTop];
  }
  if (name === 'rings') return rectOf(s4.rings[0].glyphs);                     // the first ring, as it appears
  if (name === 'name' || name === 'tagline' || name === 'outro') return rectOf(s6.L.glyphs);
  if (name === 'period') return [M, S6.baseline + 200, 760, 80];                // the line typed on the landing
  return null;
};

// ---------- seek ----------
const SCENES = [[s1.el, drawS1], [null, drawS2], [s3.el, drawS3], [s4.el, drawS4], [null, drawS5], [s6.el, drawS6]];
window.seek = function seek(time) {
  const t = ((time % T.duration) + T.duration) % T.duration;
  const idx = Math.min(SCENES.length - 1, Math.floor(t / BAR + 1e-9));
  SCENES.forEach(([el], i) => { if (el) el.style.display = i === idx ? 'block' : 'none'; });
  under.clearRect(0, 0, W, H);
  over.clearRect(0, 0, W, H);
  SCENES[idx][1](t);
};
window.seek(0);
window.filmReady = true;

if (!navigator.webdriver) { // preview-only
  const start = performance.now(); // preview-only
  const tick = (now) => { window.seek(((now - start) / 1000) % T.duration); requestAnimationFrame(tick); }; // preview-only
  requestAnimationFrame(tick); // preview-only
} // preview-only
