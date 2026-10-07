// SAFARIOS — 20 s product film, 1920×1080 @ 60 fps, 120 BPM (1 bar = 2 s).
// Grammar from refs/launch.mp4 (docs/style_guide.md), content from SafariOS (docs/shotlist.md).
//   1 hook       one enquiry card, buried by chips on the 8ths
//   2 promise    blur-zoom in; "Every booking. One system." + ask bar
//   3 pipeline   fly-through zoom into a card; a booking hops the board on the beats
//   4 costing    the product canvas pushes up; cost sheet, totals, AI advisor
//   5 itinerary  camera push-in; itinerary → client portal phone
//   6 dispatch   camera pan; driver portal timeline + compliance alert
//   7 pills      pull-back over the whole canvas; three pills
//   8 list       four circle-wiped words
//   9 end        the one hard cut; SafariOS end card
import T from './timeline.json' with { type: 'json' };
import { clamp, lerp, prog, ease, spring, kick } from '../../lib/motion.js';

const W = T.width, H = T.height;
const B = 60 / T.bpm, E8 = B / 2, E16 = B / 4;
const CUE = Object.fromEntries(T.cues.map((c) => [c.name, c.beat * B]));
const C = {
  forest: '#0e2a1f', forest3: '#1b4332', gold: '#e2a93f', goldDeep: '#b9811c', cream: '#f6f1e7',
  sand: '#ecdcbc', sage: '#dde7d8', clay: '#ecd6c4', ink: '#14211a', white: '#ffffff',
  sky: '#0ea5e9', violet: '#8b5cf6', emerald: '#10b981', red: '#dc2626',
};
const TINT = { sky: '#e0f2fe', amber: '#fef3c7', violet: '#ede9fe', emerald: '#d1fae5', gold: '#fbf1d9', sand: '#f8f3e8' };
const MUTED = 'rgba(20,33,26,0.62)';
const M = 120; // title margin

// ---------- helpers ----------
const stage = document.getElementById('stage');
const FULL = { position: 'absolute', left: '0px', top: '0px', width: `${W}px`, height: `${H}px` };
function el(parent, style = {}, text, cls) {
  const e = document.createElement('div');
  if (cls) e.className = cls;
  Object.assign(e.style, style);
  if (text != null) e.textContent = text;
  parent.appendChild(e);
  return e;
}
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
function shade(hex, amt) {
  return `rgb(${rgb(hex).map((v) => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)).join(',')})`;
}
const extrude = (color, d = 7, a = 0.2) =>
  `0 ${d}px 0 ${shade(color, color === C.white ? -0.16 : -0.24)}, 0 ${d + 16}px 34px rgba(14,42,31,${a}), inset 0 2px 0 rgba(255,255,255,0.35)`;
const dots = (color, step = 30) => `radial-gradient(${color} 1.3px, transparent 1.8px) 0 0 / ${step}px ${step}px`;

// Pill centred on (x, y) with a resting tilt.
function pill(parent, text, { x, y, rot = 0, bg = C.white, fg = C.ink, size = 34, weight = 650, pad = [18, 30], depth = 7 }) {
  const p = el(parent, {
    left: `${x}px`, top: `${y}px`, background: bg, color: fg, fontSize: `${size}px`, fontWeight: weight,
    padding: `${pad[0]}px ${pad[1]}px`, boxShadow: extrude(bg, depth),
  }, text, 'pill');
  return { el: p, rot };
}
// Pop: springs in from nothing with a twist and a short drop. Hidden before its cue.
function pop(p, dt, extra = '') {
  if (dt < 0) { p.el.style.visibility = 'hidden'; return; }
  p.el.style.visibility = 'visible';
  const s = 0.5 + 0.5 * spring(dt, 3.4, 0.42); // snaps to half size on the cue frame, then springs
  const twist = p.rot + 14 * (1 - spring(dt, 2.6, 0.5));
  const drop = -36 * (1 - ease.outCubic(prog(dt, 0, 0.3)));
  p.el.style.transform = `translate(-50%, -50%) translateY(${drop}px) rotate(${twist}deg) scale(${Math.max(0, s)}) ${extra}`;
}
// A line of words, each inside its own mask so it can rise from the baseline.
function words(parent, parts, { x, y, size }) {
  const line = el(parent, { position: 'absolute', left: `${x}px`, top: `${y}px`, fontSize: `${size}px`, whiteSpace: 'pre', lineHeight: '1.08' });
  const out = [];
  parts.forEach(({ text, cls, color }, pi) => {
    text.split(' ').forEach((w, wi) => {
      if (pi + wi > 0) line.appendChild(document.createTextNode(' '));
      const m = document.createElement('span');
      m.className = `mask ${cls || ''}`;
      if (color) m.style.color = color;
      const inner = document.createElement('span');
      inner.textContent = w;
      m.appendChild(inner);
      line.appendChild(m);
      out.push(inner);
    });
  });
  return { line, words: out };
}
// Hidden before its cue (so nothing peeks over the mask); on the cue frame it is already 30 % up, so it reads on the beat.
const rise = (inner, dt, dur = 0.3) => {
  inner.style.visibility = dt < 0 ? 'hidden' : 'visible';
  inner.style.transform = `translateY(${(1 - ease.outExpo(prog(dt, 0, dur))) * 70}%)`;
};
// Left-to-right wipe reveal for a block (clip, never opacity).
const wipe = (e, dt, dur = 0.3, r = 16) => {
  const p = ease.outExpo(prog(dt, 0, dur));
  e.style.visibility = dt < 0 ? 'hidden' : 'visible';
  e.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0 round ${r}px)`;
};
function compass(parent, size, stroke, width = 2.4) {
  const d = el(parent, { position: 'absolute', width: `${size}px`, height: `${size}px` });
  d.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/></svg>`;
  return d;
}
function tag(parent, text, bg, fg, size = 22) {
  return el(parent, { display: 'inline-block', background: bg, color: fg, fontSize: `${size}px`, fontWeight: 700, padding: '7px 14px', borderRadius: '999px', lineHeight: '1', whiteSpace: 'pre' }, text);
}
// Thin leader line from (x1,y1) to (x2,y2) that draws itself in.
function leader(parent, x1, y1, x2, y2, color = C.forest) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const l = el(parent, { position: 'absolute', left: `${x1}px`, top: `${y1}px`, width: `${len}px`, height: '3px', background: color, transformOrigin: '0 50%', borderRadius: '2px' });
  const ang = Math.atan2(y2 - y1, x2 - x1);
  return (dt) => { l.style.transform = `rotate(${ang}rad) scaleX(${ease.outExpo(prog(dt, 0, 0.3))})`; };
}
const money = (v) => `$${Math.round(v).toLocaleString('en-US')}`;

await document.fonts.load('800 100px Inter');
await document.fonts.load('italic 400 100px Fraunces');
await document.fonts.ready;

// ---------- ground (shots 1-3) ----------
const ground = el(stage, {
  ...FULL,
  background: `${dots('rgba(20,33,26,0.09)')}, radial-gradient(ellipse 70% 85% at 10% 6%, ${C.sand} 0%, rgba(236,220,188,0) 62%), radial-gradient(ellipse 70% 85% at 88% 96%, ${C.sage} 0%, rgba(221,231,216,0) 64%), ${C.cream}`,
});

// ---------- 1 · hook ----------
const s1 = el(stage, { ...FULL });
const s1cam = el(s1, { ...FULL });
const hookCard = el(s1cam, { left: '960px', top: '540px', width: '640px', height: '300px', boxShadow: extrude(C.white, 9, 0.22), padding: '0', boxSizing: 'border-box' }, null, 'card');
{
  const row = el(hookCard, { position: 'absolute', left: '44px', top: '42px', display: 'flex', gap: '12px' });
  tag(row, 'Enquiry', TINT.sky, '#0369a1');
  tag(row, 'HOT', C.clay, C.red);
  el(hookCard, { position: 'absolute', left: '44px', top: '104px', fontSize: '60px', fontWeight: 750, letterSpacing: '-0.03em' }, 'New enquiry');
  el(hookCard, { position: 'absolute', left: '44px', top: '182px', fontSize: '40px', fontWeight: 550, color: MUTED }, 'Honeymoon · 2 guests · March');
}
const CHIPS = [
  ['Costing_v7_FINAL.xlsx', 520, 300, -6, C.white, C.ink],
  ['USD or KES?', 1420, 330, 5, C.gold, C.forest],
  ['WhatsApp · 42 unread', 1390, 770, -4, C.emerald, C.white],
  ['Same Land Cruiser, twice', 560, 790, 4, C.violet, C.white],
  ['PSV licence · expired?', 860, 380, 7, C.clay, C.red],
  ['Invoice nobody chased', 1130, 700, -7, C.sky, C.white],
  ['3 days unanswered', 990, 548, 3, C.forest, C.cream],
].map(([text, x, y, rot, bg, fg]) => pill(s1cam, text, { x: 960 + (x - 960) * 0.92, y: 540 + (y - 540) * 0.9, rot, bg, fg, size: 40 }));

function drawS1(t) {
  // finishes 3 frames early and holds, so the new title lands as a clean jump on the beat
  const out = ease.inExpo(prog(t, CUE.promise - 0.25, CUE.promise - 0.05));
  const sc = 1.45 * (1 + 0.06 * (t / 2)) * (1 + 3.2 * out);
  s1cam.style.transformOrigin = '960px 540px';
  s1cam.style.transform = `scale(${sc})`;
  s1cam.style.filter = out > 0.001 ? `blur(${(20 * out).toFixed(2)}px)` : 'none';
  const cs = 0.55 + 0.45 * spring(t + 0.02, 2.6, 0.45);
  hookCard.style.transform = `translate(-50%, -50%) rotate(-4deg) scale(${cs})`;
  CHIPS.forEach((p, i) => pop(p, t - CUE[`chip-${i + 1}`]));
}

// ---------- 2 · promise ----------
const s2 = el(stage, { ...FULL });
const s2cam = el(s2, { ...FULL });
const L1 = words(s2cam, [{ text: 'Every booking.', cls: 'disp' }], { x: M, y: 210, size: 160 });
const L2 = words(s2cam, [{ text: 'One system.', cls: 'serif', color: C.goldDeep }], { x: M, y: 385, size: 172 });
const MODS = [
  ['Quotes', 1400, 300, -5, C.gold, C.forest],
  ['Costing', 1650, 400, 4, C.sky, C.white],
  ['Itineraries', 1420, 505, -3, C.violet, C.white],
  ['Invoices', 1700, 610, 6, C.emerald, C.white],
  ['Dispatch', 1470, 705, -6, C.forest, C.cream],
].map(([text, x, y, rot, bg, fg]) => pill(s2cam, text, { x, y, rot, bg, fg, size: 52 }));
const ASK = { x: M, y: 760, w: 1040, h: 124 };
const ask = el(s2cam, { position: 'absolute', left: `${ASK.x}px`, top: `${ASK.y}px`, width: `${ASK.w}px`, height: `${ASK.h}px`, background: C.white, borderRadius: '54px', boxShadow: extrude(C.white, 7, 0.18) });
const askTile = el(ask, { position: 'absolute', left: '24px', top: '30px', width: '64px', height: '64px', borderRadius: '18px', background: C.gold });
compass(askTile, 36, C.forest).style.cssText += 'left:14px;top:14px;';
const askText = el(ask, { position: 'absolute', left: '112px', top: '33px', fontSize: '50px', fontWeight: 500, whiteSpace: 'pre', lineHeight: '1.1' });
const askCaret = el(ask, { position: 'absolute', top: '34px', width: '4px', height: '58px', background: C.ink });
const askSend = el(ask, { position: 'absolute', right: '22px', top: '22px', width: '80px', height: '80px', borderRadius: '50%', color: C.cream, fontSize: '40px', fontWeight: 700, display: 'grid', placeItems: 'center' }, '→');
const ASK_Q = 'How many arrivals this week?';

function drawS2(t) {
  // arrives scaling down out of blur (blur-zoom), leaves by flying through the ask bar
  const inZ = ease.outExpo(prog(t, CUE.promise, CUE.promise + 0.35));
  const fly = ease.inExpo(prog(t, CUE.pipeline - 0.22, CUE.pipeline));
  const ax = ASK.x + 520, ay = ASK.y + ASK.h / 2;
  const s = lerp(1.5, 1, inZ) * Math.exp(Math.log(10) * fly);
  s2cam.style.transformOrigin = fly > 0 ? `${ax}px ${ay}px` : '560px 420px';
  s2cam.style.transform = `scale(${s})`;
  const blur = 16 * (1 - inZ) + 22 * fly;
  s2cam.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
  const wt = [CUE.promise, CUE['word-2'], CUE['word-3'], CUE['word-4']];
  [...L1.words, ...L2.words].forEach((w, i) => rise(w, t - wt[i]));
  MODS.forEach((p, i) => pop(p, t - CUE[`mod-${i + 1}`]));
  const da = t - CUE.askbar;
  ask.style.visibility = da < 0 ? 'hidden' : 'visible';
  ask.style.transform = `translateY(${60 * (1 - ease.outExpo(prog(da, 0, 0.35)))}px) scale(${lerp(0.94, 1, spring(da, 3, 0.5))})`;
  const n = Math.floor(ASK_Q.length * prog(t, CUE.askbar + 0.05, CUE.send - 0.05));
  askText.textContent = ASK_Q.slice(0, n);
  askCaret.style.left = `${112 + askText.getBoundingClientRect().width / (s || 1) + 4}px`;
  askCaret.style.visibility = da >= 0 && t < CUE.send && Math.floor(t / E16) % 2 === 0 ? 'visible' : 'hidden';
  const ds = t - CUE.send;
  askSend.style.background = ds >= 0 ? C.forest : '#d9d4c8';
  askSend.style.transform = `scale(${1 + 0.25 * kick(ds, 4, 0.35)})`;
}

// ---------- 3 · pipeline ----------
const s3 = el(stage, { ...FULL });
const s3cam = el(s3, { ...FULL });
const card3 = el(s3cam, { left: '100px', top: '70px', width: '1720px', height: '940px', boxShadow: `0 30px 70px rgba(14,42,31,0.16)`, borderRadius: '36px', perspective: '2000px' }, null, 'card');
const T3 = words(card3, [{ text: 'A pipeline,', cls: 'disp' }, { text: 'not an inbox.', cls: 'serif', color: C.goldDeep }], { x: 80, y: 70, size: 104 });
const sub3 = words(card3, [{ text: 'Every enquiry on one board, scored hot, warm or cold.' }], { x: 84, y: 204, size: 44 });
sub3.line.style.color = MUTED;
sub3.line.style.fontWeight = 500;
// treat the subtitle as a single rising unit
const sub3Inner = (() => { const m = document.createElement('span'); m.className = 'mask'; const i = document.createElement('span'); i.textContent = 'Every enquiry on one board, scored hot, warm or cold.'; m.appendChild(i); sub3.line.replaceChildren(m); return i; })();
const board = el(card3, { position: 'absolute', left: '80px', top: '330px', width: '1560px', height: '540px', transformOrigin: '50% 0%', transformStyle: 'preserve-3d' });
const COLS = [
  ['Enquiry', TINT.sky, '#0369a1', ['Luxury Kenya Highlights', 'Li W. · 2 guests', '$15,600']],
  ['Quoted', TINT.amber, '#a16207', ['Honeymoon Under the Stars', 'Sofia R. · 2 guests', '$7,400']],
  ['Provisional', TINT.violet, '#6d28d9', ['Photographic Safari', 'Yuki T. · 2 guests', '$9,100']],
  ['Confirmed', TINT.emerald, '#047857', ['Amboseli & Kilimanjaro', "James O'C. · 4 guests", '$6,200']],
];
const colX = (i) => i * 400;
const colEls = COLS.map(([name, tint, deep, [title, who, val]], i) => {
  const col = el(board, { position: 'absolute', left: `${colX(i)}px`, top: '0px', width: '360px', height: '520px', background: tint, borderRadius: '24px' });
  el(col, { position: 'absolute', left: '24px', top: '20px', fontSize: '34px', fontWeight: 750, color: deep }, name);
  const c = el(col, { position: 'absolute', left: '15px', top: '74px', width: '330px', height: '168px', background: C.white, borderRadius: '18px', boxShadow: '0 3px 0 rgba(14,42,31,0.08)' });
  el(c, { position: 'absolute', left: '22px', top: '20px', fontSize: '25px', fontWeight: 650, color: MUTED, whiteSpace: 'pre' }, who);
  el(c, { position: 'absolute', left: '20px', top: '60px', fontSize: '64px', fontWeight: 800, letterSpacing: '-0.03em', color: deep }, val, 'num');
  return col;
});
const hero = el(board, { position: 'absolute', left: '15px', top: '262px', width: '330px', height: '226px', background: C.white, borderRadius: '18px', boxShadow: `inset 6px 0 0 ${C.forest}, ${extrude(C.white, 6, 0.22)}` });
el(hero, { position: 'absolute', left: '28px', top: '20px', fontSize: '34px', fontWeight: 750, lineHeight: '1.04', whiteSpace: 'pre' }, 'Classic\nMaasai Mara');
el(hero, { position: 'absolute', left: '28px', top: '98px', fontSize: '23px', fontWeight: 550, color: MUTED }, '2 guests · 4 nights');
const heroTag = tag(hero, 'HOT', C.clay, C.red, 42);
Object.assign(heroTag.style, { position: 'absolute', left: '22px', top: '142px' });
const HOP_TAGS = [['HOT', C.clay, C.red], ['$6,945', TINT.amber, '#a16207'], ['Provisional', TINT.violet, '#6d28d9'], ['✓ Confirmed', TINT.emerald, '#047857']];

function drawS3(t) {
  const inZ = ease.outExpo(prog(t, CUE.pipeline, CUE.pipeline + 0.32));
  const push = ease.inOutCubic(prog(t, CUE.canvas, CUE.canvas + 0.2));
  s3cam.style.transformOrigin = '960px 540px';
  s3cam.style.transform = `translateY(${-260 * push}px) scale(${lerp(1.7, 1, inZ) * lerp(1, 0.94, push)})`;
  const blur = 14 * (1 - inZ);
  s3cam.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
  T3.words.forEach((w, i) => rise(w, t - CUE.pipeline - i * E16));
  rise(sub3Inner, t - CUE.pipeline - 5 * E16);
  const bIn = ease.outExpo(prog(t, CUE.pipeline + 0.15, CUE.pipeline + 0.6));
  board.style.transform = `rotateX(${lerp(34, 20, bIn)}deg) rotateZ(-2deg) translateY(${(1 - bIn) * 120}px)`;
  const colIn = (i) => (1 - ease.outExpo(prog(t, CUE.pipeline + 0.15 + i * 0.05, CUE.pipeline + 0.6 + i * 0.05))) * 80;
  colEls.forEach((c, i) => { c.style.transform = `translateY(${colIn(i)}px)`; });
  // the hero booking hops one column per beat
  const hops = [CUE['hop-1'], CUE['hop-2'], CUE['hop-3']];
  let col = 0, lift = 0, landed = -1;
  hops.forEach((h, i) => {
    const p = prog(t, h, h + E8);
    if (t >= h) { col = i + p * 1; lift = -80 * Math.sin(Math.PI * p); }
    if (t >= h + E8) { col = i + 1; lift = 0; landed = i; }
  });
  const ti = hops.filter((h) => t >= h + E16).length;
  heroTag.textContent = HOP_TAGS[ti][0];
  heroTag.style.background = HOP_TAGS[ti][1];
  heroTag.style.color = HOP_TAGS[ti][2];
  const sq = landed >= 0 ? kick(t - hops[landed] - E8, 5, 0.35) : 0;
  hero.style.transformOrigin = '50% 100%';
  hero.style.transform = `translate(${lerp(0, 400, ease.inOutCubic(col % 1)) + 400 * Math.floor(col)}px, ${lift + colIn(0)}px) scale(${1 + 0.07 * sq}, ${1 - 0.12 * sq}) rotate(${-3 * Math.sin(Math.PI * (col % 1))}deg)`;
}

// ---------- 4-7 · the product canvas, one continuous camera ----------
const s4 = el(stage, { ...FULL });
const canvasBg = el(s4, { ...FULL, background: '#eef1ea' });
const rig = el(s4, { ...FULL, transformOrigin: '960px 540px' }); // tilt lives here, about screen centre
const world = el(rig, { position: 'absolute', left: '0px', top: '0px', width: '5200px', height: '900px', transformOrigin: '0 0' });
const dim = el(s4, { ...FULL, background: 'rgba(246,241,231,0.5)' });

// cost sheet
const cost = el(world, { left: '0px', top: '0px', width: '1500px', height: '920px', boxShadow: '0 26px 60px rgba(14,42,31,0.14)' }, null, 'card');
el(cost, { position: 'absolute', left: '60px', top: '42px', fontSize: '30px', fontWeight: 650, letterSpacing: '0.12em', color: MUTED }, 'COST SHEET · CLASSIC MAASAI MARA');
const costTagRow = el(cost, { position: 'absolute', right: '60px', top: '36px', display: 'flex', gap: '10px' });
tag(costTagRow, 'USD', TINT.sand, C.ink, 26);
tag(costTagRow, 'KES', TINT.sand, C.ink, 26);
const ROWS = [
  ['Mara Serena Safari Lodge', '3 nights FB · 2 pax', 2520],
  ['Maasai Mara park fees', 'non-resident · 2 pax × 3 days', 1200],
  ['Land Cruiser 4×4 + driver-guide', '4 days', 720],
  ['Hot-air balloon safari', '2 pax', 900],
];
const rowEls = ROWS.map(([d, x, v], i) => {
  const r = el(cost, { position: 'absolute', left: '60px', top: `${104 + i * 114}px`, width: '1380px', height: '100px', background: TINT.sand, borderRadius: '16px' });
  el(r, { position: 'absolute', left: '30px', top: '24px', fontSize: '46px', fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'pre' }, d);
  el(r, { position: 'absolute', right: '250px', top: '36px', fontSize: '27px', fontWeight: 500, color: MUTED, whiteSpace: 'pre' }, x);
  el(r, { position: 'absolute', right: '30px', top: '18px', fontSize: '58px', fontWeight: 800, letterSpacing: '-0.02em' }, money(v), 'num');
  return r;
});
const TOTALS = [['Cost', 5340, C.ink], ['Sell', 6945, C.ink], ['Margin', 23.1, C.emerald]];
const totEls = TOTALS.map(([label, , color], i) => {
  const b = el(cost, { position: 'absolute', left: `${60 + i * 470}px`, top: '584px', width: '440px', height: '190px', background: '#eef3ea', borderRadius: '20px' });
  el(b, { position: 'absolute', left: '30px', top: '22px', fontSize: '30px', fontWeight: 650, color: MUTED }, label);
  const v = el(b, { position: 'absolute', left: '28px', top: '66px', fontSize: '92px', fontWeight: 800, letterSpacing: '-0.035em', lineHeight: '1', color }, '', 'num');
  return { b, v };
});
const healthyPill = pill(world, 'Healthy', { x: 1360, y: 590, rot: -5, bg: C.emerald, fg: C.white, size: 56, weight: 800 });
const advisor = el(cost, { position: 'absolute', left: '60px', top: '800px', width: '1380px', height: '86px', background: TINT.gold, borderRadius: '16px' });
el(advisor, { position: 'absolute', left: '30px', top: '33px', width: '20px', height: '20px', background: C.goldDeep, transform: 'rotate(45deg)', borderRadius: '3px' });
const advisorText = el(advisor, { position: 'absolute', left: '72px', top: '22px', fontSize: '38px', fontWeight: 650, whiteSpace: 'pre' });
const ADVISOR = 'AI advisor: margin is healthy for October.';

// itinerary card + portal phone
const itin = el(world, { left: '1850px', top: '30px', width: '1150px', height: '800px', overflow: 'hidden', boxShadow: '0 26px 60px rgba(14,42,31,0.14)' }, null, 'card');
const itinHead = el(itin, { position: 'absolute', left: '0', top: '0', width: '1150px', height: '232px', background: `linear-gradient(120deg, ${C.forest} 0%, ${C.forest3} 100%)` });
el(itinHead, { position: 'absolute', left: '56px', top: '40px', fontSize: '26px', fontWeight: 650, letterSpacing: '0.16em', color: C.gold }, 'AI ITINERARY → CLIENT PORTAL');
el(itinHead, { position: 'absolute', left: '54px', top: '76px', fontSize: '80px', color: C.cream, whiteSpace: 'pre' }, 'Classic Maasai Mara', 'serif');
el(itinHead, { position: 'absolute', left: '56px', top: '178px', fontSize: '32px', fontWeight: 500, color: 'rgba(246,241,231,0.72)' }, '4 nights · 2 guests · Full board');
const DAYS = [
  ['Day 1', 'Nairobi → Maasai Mara', 'Fly Wilson → Ol Kiombo · afternoon game drive'],
  ['Day 2', 'Maasai Mara', 'Dawn drive · river crossing watch at Mara River'],
  ['Day 3', 'Maasai Mara', 'Hot-air balloon · bush breakfast'],
];
const dayEls = DAYS.map(([d, title, det], i) => {
  const r = el(itin, { position: 'absolute', left: '56px', top: `${262 + i * 172}px`, width: '1038px', height: '156px', background: C.white, border: '2px solid #ece6da', borderRadius: '20px', boxSizing: 'border-box' });
  const tg = tag(r, d, TINT.gold, C.goldDeep, 30);
  Object.assign(tg.style, { position: 'absolute', left: '24px', top: '28px' });
  el(r, { position: 'absolute', left: '170px', top: '18px', fontSize: '52px', fontWeight: 750, letterSpacing: '-0.015em', whiteSpace: 'pre' }, title);
  el(r, { position: 'absolute', left: '172px', top: '88px', fontSize: '31px', fontWeight: 550, color: MUTED, whiteSpace: 'pre' }, det);
  return r;
});
const phone = el(world, { position: 'absolute', left: '3070px', top: '20px', width: '390px', height: '800px', background: C.forest, borderRadius: '58px', boxShadow: '0 30px 60px rgba(14,42,31,0.25)' });
const screen = el(phone, { position: 'absolute', left: '14px', top: '14px', width: '362px', height: '772px', background: C.cream, borderRadius: '46px', overflow: 'hidden' });
{
  const top = el(screen, { position: 'absolute', left: '0', top: '0', width: '362px', height: '250px', background: `linear-gradient(160deg, ${C.forest3}, ${C.forest})` });
  el(top, { position: 'absolute', left: '28px', top: '62px', fontSize: '15px', fontWeight: 650, letterSpacing: '0.18em', color: C.gold }, 'YOUR SAFARI PORTAL');
  el(top, { position: 'absolute', left: '26px', top: '92px', fontSize: '40px', color: C.cream, lineHeight: '1.05' }, 'Classic\nMaasai Mara', 'serif').style.whiteSpace = 'pre';
  el(top, { position: 'absolute', left: '28px', top: '196px', fontSize: '18px', fontWeight: 500, color: 'rgba(246,241,231,0.72)' }, '14 – 18 Nov · 2 guests');
  el(screen, { position: 'absolute', left: '28px', top: '270px', fontSize: '120px', fontWeight: 800, letterSpacing: '-0.04em', color: C.forest, lineHeight: '1' }, '31', 'num');
  el(screen, { position: 'absolute', left: '32px', top: '398px', fontSize: '17px', fontWeight: 650, letterSpacing: '0.18em', color: MUTED }, 'DAYS TO GO');
  ['Day 1 · Nairobi → Mara', 'Day 2 · Morning game drive', 'Day 3 · Balloon safari', 'Packing list · 18 of 24'].forEach((s, i) => {
    const r = el(screen, { position: 'absolute', left: '22px', top: `${450 + i * 72}px`, width: '318px', height: '58px', background: C.white, borderRadius: '14px' });
    el(r, { position: 'absolute', left: '18px', top: '19px', fontSize: '19px', fontWeight: 600, whiteSpace: 'pre' }, s);
  });
}
const call1 = pill(world, 'Drafted by AI. Sent as a portal.', { x: 2520, y: 48, rot: -3, bg: C.forest, fg: C.cream, size: 54, weight: 750 });
const lead1 = leader(world, 2990, 70, 3120, 150, C.forest);

// driver portal
const drv = el(world, { left: '3700px', top: '30px', width: '1360px', height: '860px', boxShadow: '0 26px 60px rgba(14,42,31,0.14)' }, null, 'card');
el(drv, { position: 'absolute', left: '60px', top: '44px', fontSize: '30px', fontWeight: 650, letterSpacing: '0.12em', color: MUTED }, 'DRIVER PORTAL · LIVE');
{
  const tg = tag(drv, 'In progress', TINT.emerald, '#047857', 28);
  Object.assign(tg.style, { position: 'absolute', right: '60px', top: '36px' });
  const r = el(drv, { position: 'absolute', left: '60px', top: '100px', width: '1240px', height: '150px', background: TINT.sand, borderRadius: '20px' });
  el(r, { position: 'absolute', left: '28px', top: '29px', width: '92px', height: '92px', borderRadius: '50%', background: C.forest, color: C.gold, fontSize: '34px', fontWeight: 750, display: 'grid', placeItems: 'center' }, 'JK');
  el(r, { position: 'absolute', left: '146px', top: '24px', fontSize: '46px', fontWeight: 750, letterSpacing: '-0.015em', whiteSpace: 'pre' }, 'Joseph K. · Land Cruiser KDA 123A');
  el(r, { position: 'absolute', left: '148px', top: '88px', fontSize: '31px', fontWeight: 550, color: MUTED, whiteSpace: 'pre' }, 'Briefed on WhatsApp · no app, no login');
}
el(drv, { position: 'absolute', left: '106px', top: '300px', width: '4px', height: '390px', background: '#ddd6c6' });
const STATUS = [['Airport pickup complete', '07:42'], ['En route to Maasai Mara', '10:15'], ['Arrived at Mara Serena Safari Lodge', '15:30']];
const statusEls = STATUS.map(([s, tm], i) => {
  const y = 290 + i * 130;
  const dot = el(drv, { position: 'absolute', left: '90px', top: `${y}px`, width: '36px', height: '36px', borderRadius: '50%', boxSizing: 'border-box' });
  const txt = el(drv, { position: 'absolute', left: '156px', top: `${y - 14}px`, fontSize: '52px', fontWeight: i === 2 ? 800 : 700, letterSpacing: '-0.015em', whiteSpace: 'pre', overflow: 'hidden', paddingBottom: '8px' });
  const inner = el(txt, { display: 'inline-block' }, s);
  const time = el(drv, { position: 'absolute', left: '158px', top: `${y + 50}px`, fontSize: '34px', fontWeight: 550, color: MUTED }, tm, 'num');
  return { dot, txt, inner, time };
});
{
  const y = 290 + 3 * 130;
  el(drv, { position: 'absolute', left: '90px', top: `${y}px`, width: '36px', height: '36px', borderRadius: '50%', border: '4px dashed #cfc7b5', boxSizing: 'border-box', background: C.white });
  el(drv, { position: 'absolute', left: '156px', top: `${y - 8}px`, fontSize: '40px', fontWeight: 600, color: MUTED }, 'Morning game drive · tomorrow');
}
const alertEl = el(drv, { position: 'absolute', left: '60px', top: '756px', width: '1240px', height: '86px', background: '#f8dcd6', borderRadius: '16px' });
el(alertEl, { position: 'absolute', left: '26px', top: '19px', fontSize: '40px', fontWeight: 750, color: C.red, whiteSpace: 'pre' }, '⚠ Grace W. · first-aid certificate expires in 21 days');
const call2 = pill(world, 'No login, no app.', { x: 4800, y: 420, rot: 4, bg: C.gold, fg: C.forest, size: 64, weight: 800 });

// camera: one continuous move over the canvas. Holds drift; moves ease in-out.
const CAMS = [
  { t: CUE.canvas, cx: 750, cy: 462, s: 1.15, drift: 30 },
  { t: CUE.itinerary, cx: 2640, cy: 430, s: 1.18, drift: 30, tilt: 8 },
  { t: CUE.driver, cx: 4380, cy: 458, s: 1.2, drift: 20 },
  { t: CUE.pullback, cx: 2560, cy: 420, s: 0.37, drift: 0 },
];
const MOVE = 0.22;
function camAt(t) {
  let k = 0;
  while (k + 1 < CAMS.length && t >= CAMS[k + 1].t) k++;
  const a = CAMS[k];
  const hold = (c, tt) => ({ cx: c.cx + c.drift * prog(tt, c.t + MOVE, c.t + 2), cy: c.cy, s: c.s, tilt: 0 });
  const here = hold(a, t);
  if (k === 0) return here;
  const prev = hold(CAMS[k - 1], a.t);
  const p = ease.inOutCubic(prog(t, a.t, a.t + MOVE));
  // zoom moves interpolate scale geometrically
  return { cx: lerp(prev.cx, here.cx, p), cy: lerp(prev.cy, here.cy, p), s: prev.s * Math.pow(here.s / prev.s, p), tilt: (a.tilt || 0) * Math.sin(Math.PI * p) };
}

function drawS4(t) {
  const up = ease.outExpo(prog(t, CUE.canvas, CUE.canvas + 0.25));
  s4.style.transform = `translateY(${(1 - up) * H}px)`;
  const c = camAt(t);
  rig.style.transform = `perspective(2400px) rotateX(${(c.tilt + 12 * (1 - up)).toFixed(3)}deg)`;
  world.style.transform = `translate(${W / 2 - c.cx * c.s}px, ${H / 2 - c.cy * c.s}px) scale(${c.s})`;
  // motion blur from camera speed (screen px per frame), plus the pulled-back depth of field
  const a = camAt(t - 1 / 120), b = camAt(t + 1 / 120);
  const speed = Math.hypot((b.cx - a.cx) * c.s, (b.cy - a.cy) * c.s) + Math.abs(Math.log(b.s / a.s)) * 900;
  const dof = 5 * ease.outCubic(prog(t, CUE.pullback, CUE.pullback + MOVE));
  const blur = Math.min(11, speed * 0.18) + dof;
  world.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
  canvasBg.style.background = `${dots('rgba(20,33,26,0.08)', 30 * c.s)}, #eef1ea`;
  canvasBg.style.backgroundPosition = `${W / 2 - c.cx * c.s}px ${H / 2 - c.cy * c.s}px`;
  dim.style.visibility = dof > 0 ? 'visible' : 'hidden';
  dim.style.background = `rgba(246,241,231,${(0.5 * dof / 5).toFixed(3)})`;

  // 4 · costing
  // the cost sheet is already filled in when the shot opens; the totals are what happens
  rowEls.forEach((r) => wipe(r, 1));
  const tt = prog(t, CUE.totals, CUE.totals + 0.45);
  totEls.forEach(({ b: box, v }, i) => {
    const val = TOTALS[i][1] * ease.outExpo(tt);
    v.textContent = t < CUE.totals ? '—' : i === 2 ? `${val.toFixed(1)}%` : money(val);
    v.style.transform = `scale(${1 + 0.06 * kick(t - CUE.totals - i * 0.04, 4, 0.4)})`;
  });
  pop(healthyPill, t - CUE.healthy);
  wipe(advisor, t - CUE.advisor, 0.25);
  advisorText.textContent = ADVISOR.slice(0, Math.floor(ADVISOR.length * prog(t, CUE.advisor, CUE.advisor + 0.25)));

  // 5 · itinerary
  dayEls.forEach((r, i) => wipe(r, i < 2 ? 1 : t - CUE[`day-${i + 1}`], 0.3, 20));
  pop(call1, t - CUE['callout-1']);
  lead1(t - CUE['callout-1'] - 0.05);
  const ph = t - CUE.phone;
  phone.style.visibility = ph < 0 ? 'hidden' : 'visible';
  phone.style.transform = `translateY(${(1 - ease.outExpo(prog(ph, 0, 0.4))) * 520}px) rotate(${lerp(-6, 0, spring(ph, 2.4, 0.5))}deg)`;

  // 6 · dispatch
  statusEls.forEach(({ dot, inner, time }, i) => {
    const ds = i < 2 ? 1 : t - CUE[`status-${i + 1}`];
    const on = ds >= 0;
    dot.style.background = on ? C.emerald : C.white;
    dot.style.border = on ? 'none' : '3px solid #cfc7b5';
    dot.style.transform = `scale(${1 + 0.35 * kick(ds, 4, 0.35)})`;
    rise(inner, ds, 0.35);
    time.style.visibility = on ? 'visible' : 'hidden';
  });
  const da = t - CUE.alert;
  wipe(alertEl, da, 0.25);
  alertEl.style.transform = `translateX(${10 * kick(da - 0.2, 7, 0.3)}px)`;
  pop(call2, t - CUE['callout-2']);

  // 7 · three pills over the pulled-back canvas
  PILLS.forEach((p, i) => pop(p, t - CUE[`pill-${i + 1}`]));
}
const PILLS = [
  ['Enquiry in.', 610, 350, -5, C.sky],
  ['Trip run.', 1290, 540, 4, C.violet],
  ['Paid in M-Pesa.', 820, 740, -3, C.emerald],
].map(([text, x, y, rot, bg]) => pill(s4, text, { x, y, rot, bg, fg: C.white, size: 96, weight: 800, pad: [34, 66], depth: 11 }));

// ---------- 8 · list ----------
const VOCAB = ['Maasai Mara', 'USD', 'Amboseli', 'KES', 'Serengeti', 'M-Pesa', 'Ngorongoro', 'VAT 16%', 'Tsavo', 'PSV', 'Samburu',
  'Land Cruiser 4×4', 'Lake Nakuru', 'HOT', 'Bwindi', 'WARM', 'Zanzibar', '30 · 14 · 7 · 3 · 1', 'Murchison Falls', 'Tarangire', 'Diani'];
const FIELDS = [
  ['Quotes.', C.forest, C.cream],
  ['Itineraries.', C.gold, C.forest],
  ['Invoices.', C.sky, C.white],
  ['Drivers.', C.violet, C.white],
].map(([word, bg, fg], f) => {
  const layer = el(stage, { ...FULL, background: bg, overflow: 'hidden' });
  const wall = el(layer, { position: 'absolute', left: '-700px', top: '-700px', width: '3320px', height: '2480px', transform: 'rotate(-12deg)' });
  const lightBg = f === 0;
  const chipBg = shade(bg, lightBg ? 0.08 : -0.07), chipFg = shade(bg, lightBg ? 0.28 : -0.22);
  for (let r = 0; r < 22; r++) {
    const row = el(wall, { position: 'absolute', left: `${(r % 2) * -140}px`, top: `${r * 112}px`, whiteSpace: 'nowrap' });
    for (let k = 0; k < 16; k++) {
      el(row, { display: 'inline-block', margin: '0 14px', padding: '16px 30px', borderRadius: '999px', background: chipBg, color: chipFg, fontSize: '34px', fontWeight: 650 }, VOCAB[(r * 5 + k * 3 + f * 7) % VOCAB.length]);
    }
  }
  const w = el(layer, { position: 'absolute', left: '50%', top: '50%', color: fg }, word, 'disp');
  return { layer, wall, w, at: CUE[`field-${f + 1}`] };
});
for (const f of FIELDS) { // fit each word to ~1700 px
  f.layer.style.display = 'block';
  f.w.style.fontSize = '100px';
  const size = Math.min(380, (100 * 1700) / f.w.getBoundingClientRect().width);
  f.w.style.fontSize = `${size}px`;
  f.layer.style.display = 'none';
}
function drawField(f, i, t) {
  const r = 1120 * ease.outCubic(prog(t, f.at, f.at + 0.3));
  f.layer.style.clipPath = `circle(${r.toFixed(1)}px at 50% 50%)`;
  f.wall.style.transform = `rotate(-12deg) translateX(${-60 * (t - f.at)}px)`;
  const next = FIELDS[i + 1];
  const leave = next ? ease.inCubic(prog(t, next.at, next.at + 0.3)) : 0;
  const arrive = ease.outExpo(prog(t, f.at, f.at + 0.4));
  f.w.style.transform = `translate(-50%, -52%) scale(${lerp(0.82, 1, arrive) * (1 + 0.45 * leave)})`;
  f.w.style.filter = leave > 0.01 ? `blur(${(16 * leave).toFixed(2)}px)` : 'none';
}

// ---------- 9 · end card ----------
const s9 = el(stage, { ...FULL, background: `${dots('rgba(246,241,231,0.07)')}, ${C.forest}` });
const s9cam = el(s9, { ...FULL });
const ring = compass(s9cam, 980, C.forest3, 0.9);
Object.assign(ring.style, { left: '1110px', top: '50px' });
const logo = el(s9cam, { position: 'absolute', left: `${M + 40}px`, top: '150px', height: '116px', display: 'flex', alignItems: 'center', gap: '34px', transformOrigin: '0 50%' });
const tile = el(logo, { position: 'relative', width: '116px', height: '116px', borderRadius: '28px', background: C.gold, flex: 'none' });
compass(tile, 70, C.forest, 2.4).style.cssText += 'left:23px;top:23px;';
el(logo, { fontSize: '96px', fontWeight: 650, letterSpacing: '-0.035em', color: C.cream, lineHeight: '1' }, 'SafariOS');
const eyebrow = words(s9cam, [{ text: 'BUILT FOR EAST AFRICAN SAFARI OPERATORS' }], { x: M + 44, y: 334, size: 40 });
eyebrow.line.style.cssText += `font-weight:650;letter-spacing:0.16em;color:${C.gold};`;
const eyeInner = (() => { const m = document.createElement('span'); m.className = 'mask'; const i = document.createElement('span'); i.textContent = 'BUILT FOR EAST AFRICAN SAFARI OPERATORS'; m.appendChild(i); eyebrow.line.replaceChildren(m); return i; })();
const E1 = words(s9cam, [{ text: 'The operating system', cls: 'disp', color: C.cream }], { x: M + 36, y: 398, size: 124 });
const E2 = words(s9cam, [{ text: 'for safari businesses.', cls: 'serif', color: C.gold }], { x: M + 36, y: 534, size: 132 });
const cta = el(s9cam, { position: 'absolute', left: `${M + 44}px`, top: '736px', background: C.gold, color: C.forest, fontSize: '56px', fontWeight: 750, padding: '30px 56px', borderRadius: '999px', boxShadow: extrude(C.gold, 8, 0.35), transformOrigin: '0 50%', whiteSpace: 'pre', lineHeight: '1' }, 'Create your workspace →');
const urlL = words(s9cam, [{ text: 'safarios-demo.vercel.app' }], { x: M + 50, y: 890, size: 52 });
urlL.line.style.cssText += 'font-weight:500;color:rgba(246,241,231,0.72);';

function drawS9(t) {
  const u = t - CUE.end;
  s9cam.style.transformOrigin = '600px 540px';
  s9cam.style.transform = `scale(${1 + 0.025 * prog(t, CUE.end + 0.3, T.duration)})`;
  ring.style.transform = `rotate(${-10 + 8 * prog(t, CUE.end, T.duration)}deg)`;
  const lz = ease.outExpo(prog(u, 0, 0.3));
  logo.style.transform = `scale(${lerp(2.6, 1, lz)})`;
  logo.style.filter = lz < 0.999 ? `blur(${(12 * (1 - lz)).toFixed(2)}px)` : 'none';
  rise(eyeInner, t - CUE.eyebrow);
  E1.words.forEach((w, i) => rise(w, t - CUE['line-1'] - i * E8));
  E2.words.forEach((w, i) => rise(w, t - CUE['line-2'] - i * E16));
  const dc = t - CUE.cta;
  cta.style.visibility = dc < 0 ? 'hidden' : 'visible';
  cta.style.transform = `translateY(${-30 * (1 - ease.outCubic(prog(dc, 0, 0.3)))}px) scale(${0.4 + 0.6 * spring(dc, 3.2, 0.45)}) rotate(${-2 * (1 - spring(dc, 2.4, 0.5))}deg)`;
  urlL.words.forEach((w) => rise(w, dc - E8));
}

// ---------- cue targets: which element each cue moves (tools/check.py measures change inside it) ----------
window.cueTargets = {
  hook: hookCard, ...Object.fromEntries(CHIPS.map((p, i) => [`chip-${i + 1}`, p.el])),
  promise: L1.words[0], 'word-2': L1.words[1], 'word-3': L2.words[0], 'word-4': L2.words[1],
  ...Object.fromEntries(MODS.map((p, i) => [`mod-${i + 1}`, p.el])), askbar: ask, send: askSend,
  pipeline: T3.words[0], 'hop-1': hero, 'hop-2': hero, 'hop-3': hero,
  totals: totEls[0].b, healthy: healthyPill.el, advisor,
  'day-3': dayEls[2], 'callout-1': call1.el, phone,
  'callout-2': call2.el, 'status-3': statusEls[2].txt, alert: alertEl,
  ...Object.fromEntries(PILLS.map((p, i) => [`pill-${i + 1}`, p.el])),
  eyebrow: eyeInner, 'line-1': E1.words[0], 'line-2': E2.words[0], cta,
}; // cues not listed (camera moves, wipes, the hard cut) change the whole frame
window.cueBox = (name) => {
  const e = window.cueTargets[name];
  if (!e) return null;
  const r = e.getBoundingClientRect();
  return r.width * r.height > 0 ? [r.left, r.top, r.width, r.height] : null;
};

// ---------- seek ----------
const SHOTS = [
  { el: ground, from: 0, to: CUE.canvas + 0.3, draw: () => {} },
  { el: s1, from: 0, to: CUE.promise, draw: drawS1 },
  { el: s2, from: CUE.promise, to: CUE.pipeline, draw: drawS2 },
  { el: s3, from: CUE.pipeline, to: CUE.canvas + 0.3, draw: drawS3 },
  { el: s4, from: CUE.canvas, to: CUE['field-1'] + 0.32, draw: drawS4 },
  ...FIELDS.map((f, i) => ({ el: f.layer, from: f.at, to: i + 1 < FIELDS.length ? FIELDS[i + 1].at + 0.32 : CUE.end, draw: (t) => drawField(f, i, t) })),
  { el: s9, from: CUE.end, to: T.duration + 1, draw: drawS9 },
];
window.seek = function seek(time) {
  const t = clamp(time, 0, T.duration);
  for (const s of SHOTS) {
    const on = t >= s.from && t < s.to;
    s.el.style.display = on ? 'block' : 'none';
    if (on) s.draw(t);
  }
};
window.seek(0);
window.filmReady = true;

if (!navigator.webdriver) { // preview-only
  const start = performance.now(); // preview-only
  const tick = (now) => { window.seek(((now - start) / 1000) % T.duration); requestAnimationFrame(tick); }; // preview-only
  requestAnimationFrame(tick); // preview-only
} // preview-only
