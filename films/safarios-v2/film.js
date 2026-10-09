// safarios-v2: one honeymoon booking from website request to fully paid, then a circle-wipe run through the rest of the modules, 32 s at 120 BPM.
// window.seek(t) paints frame t from scratch; nothing carries between frames.
// One timeline, three formats: layout(F) places the stage, captions and type for 16x9, 9x16 or 1x1.
import { clamp, lerp, prog, ease, springTrack, SNAPPY } from '../../lib/motion.js';
import { hexToOklab, oklabToCss } from '../../lib/color.js';

const T = await (await fetch('./timeline.json')).json();
const F = window.filmFormat || T.formats[0];
const W = F.width, H = F.height, D = T.duration;
const C = T.palette;
const CUE = Object.fromEntries(T.cues.map((c) => [c.name, (c.beat * 60) / T.bpm]));
const dbg = window.filmDebug || {};

// ---------------------------------------------------------------- layout
function layout(f) {
  if (f.name === '9x16') return { cap: { x: 70, y: 260, w: 940, size: 132 }, stage: { cx: 540, cy: 1130, s: 1.0 }, hook: { size: 200, m: 60 },
    end: { x: 70, y: 640, tile: 132, word: 80, h1: 100, cta: 52, url: 48, gap: 1.0 }, feat: { x: 70, cy: 1190, size: 68 } };
  if (f.name === '1x1') return { cap: { x: 80, y: 70, w: 920, size: 92 }, stage: { cx: 540, cy: 700, s: 0.8 }, hook: { size: 190, m: 60 },
    end: { x: 80, y: 270, tile: 104, word: 64, h1: 84, cta: 44, url: 40, gap: 0.9 }, feat: { x: 80, cy: 640, size: 56 } };
  return { cap: { x: 110, y: 300, w: 600, size: 120 }, stage: { cx: 1335, cy: 540, s: 1.12 }, hook: { size: 300, m: 120 },
    end: { x: 120, y: 190, tile: 150, word: 88, h1: 140, cta: 60, url: 56, gap: 1.0 }, feat: { x: 860, cy: 540, size: 66 } };
}
const L = layout(F);

// ---------------------------------------------------------------- motion helpers
// Spring from 0 to 1 that starts moving on its first frame (launch velocity v0, 1/s), so every cued
// entrance is visible one frame after its sound. Underdamped closed form.
function launch(dt, freq = 2.2, damp = 0.8, v0 = 9) {
  if (dt <= 0) return 0;
  const w = 2 * Math.PI * freq, wd = w * Math.sqrt(1 - damp * damp);
  const B = (v0 - damp * w) / wd;
  return 1 + Math.exp(-damp * w * dt) * (-Math.cos(wd * dt) + B * Math.sin(wd * dt));
}
const after = (t, t0, f = launch) => (t < t0 ? 0 : f(t - t0));
const io = (t, a, b, fn = ease.inOutCubic) => fn(prog(t, a, b));
const mixHex = (a, b, u) => { const A = hexToOklab(a), B = hexToOklab(b); return oklabToCss(A.map((v, i) => lerp(v, B[i], u))); };

// ---------------------------------------------------------------- DOM helpers
const frame = document.getElementById('frame');
frame.style.width = `${W}px`;
frame.style.height = `${H}px`;
function el(parent, css = {}, cls = '') {
  const e = document.createElement('div');
  if (cls) e.className = cls;
  Object.assign(e.style, css);
  parent.appendChild(e);
  return e;
}
const readable = [];   // every string meant to be read: audited for size by tools/check.py
// Masked text: the mask covers the glyphs' full ascent and descent (+ margin), the inner span rises into it.
function mtext(parent, x, y, size, text, o = {}) {
  const side = (o.serif ? 0.3 : 0.12) * size;   // italic swashes overhang the advance width
  const m = el(parent, { left: `${x}px`, top: `${y - 0.18 * size}px`, padding: `${0.18 * size}px ${side}px ${0.32 * size}px`,
    margin: `0 ${-side}px`, fontSize: `${size}px`, fontWeight: o.weight ?? 700, color: o.color ?? C.ink,
    letterSpacing: o.track ?? '-0.02em', transform: o.right ? 'translateX(-100%)' : '' }, 'mask');
  if (dbg.noMasks) m.style.overflow = 'visible';
  const s = document.createElement('span');
  s.textContent = text;
  if (o.serif) s.className = 'serif';
  m.appendChild(s);
  readable.push(s);
  return { m, s, size };
}
// rise in at tIn (launch spring), drop out from tOut over 0.2 s; hidden outside
function rise(tx, t, tIn, tOut = Infinity) {
  const a = after(t, tIn), b = ease.inCubic(prog(t, tOut, tOut + 0.2));
  tx.m.style.visibility = t < tIn || t > tOut + 0.2 ? 'hidden' : 'visible';
  tx.s.style.transform = `translateY(${((1 - a) + b) * 1.3 * tx.size}px)`;
}
function chip(parent, x, y, size, text, bg, fg, o = {}) {
  const c = el(parent, { left: `${x}px`, top: `${y}px`, fontSize: `${size}px`, padding: `${0.28 * size}px ${0.5 * size}px`,
    background: bg, color: fg, fontWeight: o.weight ?? 750, letterSpacing: '-0.01em', transform: o.right ? 'translateX(-100%)' : '' }, 'chip');
  const s = document.createElement('span');
  s.textContent = text;
  c.appendChild(s);
  readable.push(s);
  return c;
}
function popScale(c, t, tIn, tOut = Infinity, origin = '50% 50%') {
  const a = after(t, tIn, (d) => launch(d, 2.6, 0.75, 14)), b = ease.inCubic(prog(t, tOut, tOut + 0.18));
  c.style.visibility = t < tIn || t > tOut + 0.18 ? 'hidden' : 'visible';
  c.style.transformOrigin = origin;
  const base = c.dataset.right ? 'translateX(-100%) ' : '';
  c.style.transform = `${base}scale(${Math.max(0, a * (1 - b))})`;
}
const show = (e, on) => { e.style.display = on ? '' : 'none'; };

// ---------------------------------------------------------------- layers
const ground = el(frame, { position: 'absolute', inset: '0' });
const stageRoot = el(frame, { position: 'absolute', left: `${L.stage.cx}px`, top: `${L.stage.cy}px`, transform: `scale(${L.stage.s})`, transformOrigin: '0 0' });
const cam = el(stageRoot, { position: 'absolute', left: '0', top: '0', transformOrigin: '0 0' });
const hookLayer = el(frame, { position: 'absolute', inset: '0' });
const capLayer = el(frame, { position: 'absolute', inset: '0' });
const endLayer = el(frame, { position: 'absolute', inset: '0' });
const featLayer = el(frame, { position: 'absolute', inset: '0' });   // above the gold field (the end card's tile at full size)
const fieldLayer = el(frame, { position: 'absolute', inset: '0' });  // the circle-wipe run, over the gold field

// ================================================================ 1 · request (hook)
const WORDS = ['Honeymoon', 'safari', 'for', 'two,', 'in', 'January?'];
const WT = WORDS.map((_, i) => CUE[`type-${i + 1}`]);
const HS = L.hook.size;
const hookWords = WORDS.map((w, i) => {
  const s = el(hookLayer, { fontSize: `${HS}px`, fontWeight: 760, letterSpacing: '-0.035em', transformOrigin: '0 0',
    color: i === 5 ? C.goldDeep : C.ink }, 't');
  s.textContent = w;
  if (i === 5) s.className = 't serif';
  readable.push(s);
  return s;
});
const caret = el(hookLayer, { position: 'absolute', width: `${0.07 * HS}px`, height: `${0.92 * HS}px`, background: C.forest, borderRadius: `${0.02 * HS}px` });

// ================================================================ 2 · scored: the request card on the board
const gScored = el(cam, { position: 'absolute' });
const colHead = mtext(gScored, -500, -425, 56, 'Enquiry', { weight: 750 });
const colCount = chip(gScored, -250, -432, 44, '1', '#e0f2fe', '#0369a1');
colCount.querySelector('span').style.fontSize = '44px';
readable.pop();   // the count is a badge, not copy
const peek = el(gScored, { position: 'absolute', left: '-500px', top: '400px', width: '1000px', height: '330px', borderRadius: '40px', border: '4px dashed rgba(20,33,26,0.12)', boxSizing: 'border-box' });
const peekHead = mtext(gScored, -500, 315, 56, 'Quoted', { weight: 750 });
const reqCard = el(gScored, { borderRadius: '40px' }, 'card');
const webChip = chip(gScored, -450, -270, 48, 'Website', '#e0f2fe', '#0369a1');
readable.pop();   // 48 su badge; the request text carries the meaning
const who = mtext(gScored, -450, 40, 56, 'Sofia R. · 2 adults', { weight: 550, color: 'rgba(20,33,26,0.82)' });
const ring = el(gScored, { position: 'absolute', left: '330px', top: '-20px', width: '150px', height: '150px', borderRadius: '50%' });
const ringNum = el(gScored, { left: '405px', top: '55px', fontSize: '64px', fontWeight: 800, transform: 'translate(-50%,-50%)', letterSpacing: '-0.03em' }, 't');
readable.push(ringNum);
const hot = chip(gScored, 300, 52, 56, 'HOT', C.statusHotGround, C.statusHot, { right: true });
hot.dataset.right = '1';
const btn = chip(gScored, 470, 150, 56, 'Build quote →', C.gold, C.forest, { right: true });
btn.dataset.right = '1';
btn.style.boxShadow = '0 10px 24px -12px rgba(185,129,28,0.8)';
const CARD = { x: -500, y: -320, w: 1000, h: 590 };
// where the request words sit inside the card (stage su): two lines at 64 su
const CARD_TEXT = 64;
// cursor (shared by the scored and drafted scenes)
const cursor = el(cam, { position: 'absolute', width: '64px', height: '64px' });
cursor.innerHTML = '<svg viewBox="0 0 24 24" width="64" height="64"><path d="M4 2 L4 19 L8.6 14.8 L11.6 21.6 L14.6 20.3 L11.7 13.6 L18 13.6 Z" fill="#14211a" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>';

// ================================================================ 3 · costed
const gCost = el(cam, { position: 'absolute' });
const costCard = el(gCost, { left: '-500px', top: '-450px', width: '1000px', height: '780px', borderRadius: '40px' }, 'card');
const costTitle = mtext(gCost, -450, -410, 64, 'Honeymoon Under the Stars', { weight: 780 });
const costSub = mtext(gCost, -450, -335, 56, '2 adults · 5 nights', { weight: 550, color: 'rgba(20,33,26,0.8)' });
const ROWS = [['Tented camp · 5 nights', '$2,150'], ['Park fees · 2 × 5 days', '$2,000'], ['Land Cruiser + guide', '$900'], ['Dinner under the stars', '$500']];
const rowEls = ROWS.map(([a, b], i) => {
  const y = -245 + i * 78;
  const line = el(gCost, { position: 'absolute', left: '-450px', top: `${y + 66}px`, width: '900px', height: '2px', background: 'rgba(20,33,26,0.07)' });
  return { a: mtext(gCost, -450, y, 56, a, { weight: 560 }), b: mtext(gCost, 450, y - 4, 60, b, { weight: 760, right: true }), line };
});
const netL = mtext(gCost, -450, 72, 56, 'Net $5,550', { weight: 600, color: 'rgba(20,33,26,0.8)' });
const sellL = mtext(gCost, 450, 68, 64, 'Sell $7,400', { weight: 820, right: true });
const kesL = mtext(gCost, 450, 146, 56, '≈ KES 962,000', { weight: 550, color: 'rgba(20,33,26,0.78)', right: true });
const marginNum = el(gCost, { left: '-450px', top: '196px', fontSize: '110px', fontWeight: 820, letterSpacing: '-0.04em' }, 't');
readable.push(marginNum);
const healthy = chip(gCost, -30, 216, 56, 'Healthy', '#d1fae5', '#047857');
const advisor = el(gCost, { position: 'absolute', left: '-500px', top: '350px', width: '1000px', height: '96px', borderRadius: '28px', background: '#f6e7c6' });
const advText = mtext(advisor, 40, 20, 56, 'In the 25–35 % honeymoon band.', { weight: 620 });

// ================================================================ 4 · drafted
const gDraft = el(cam, { position: 'absolute' });
const draftCard = el(gDraft, { left: '-500px', top: '-430px', width: '1000px', height: '860px', borderRadius: '40px', overflow: 'hidden' }, 'card');
const draftHead = el(draftCard, { position: 'absolute', left: '0', top: '0', width: '1000px', height: '250px', background: C.forest });
const draftTitle = mtext(draftCard, 50, 50, 76, 'Honeymoon Under the Stars', { serif: true, color: C.cream, weight: 450, track: '-0.01em' });
const draftSub = mtext(draftCard, 50, 152, 56, '15–20 Jan 2027 · Maasai Mara', { weight: 560, color: 'rgba(246,241,231,0.78)' });
const prompt = el(draftCard, { position: 'absolute', left: '50px', top: '290px', width: '900px', height: '100px', borderRadius: '50px', background: '#f1ede4' });
const promptStar = el(prompt, { left: '34px', top: '22px', fontSize: '56px', color: C.goldDeep }, 't');
promptStar.textContent = '✦';
const PROMPT_WORDS = ['5 nights', ' in the', ' Mara'];
const promptTx = el(prompt, { left: '110px', top: '22px', fontSize: '56px', fontWeight: 600 }, 't');
readable.push(promptTx);
const DAYS = [['Day 1', 'Nairobi → Maasai Mara'], ['Day 2', 'Dawn drive, Mara River'], ['Day 3', 'Dinner under the stars']];
const dayEls = DAYS.map(([a, b], i) => {
  const y = 430 + i * 110;
  return { a: mtext(draftCard, 50, y, 52, a, { weight: 800, color: C.goldDeep }), b: mtext(draftCard, 240, y - 2, 56, b, { weight: 620 }) };
});
dayEls.forEach((d) => readable.splice(readable.indexOf(d.a.s), 1));   // the day labels are 52 su markers beside the readable rows
const publish = chip(draftCard, 950, 740, 56, 'Publish to portal', C.gold, C.forest, { right: true });
publish.dataset.right = '1';

// ================================================================ 5–6 · the phone: client portal, then the driver
const PH = { w: 500, h: 900, r: 76 };
const phone = el(cam, { position: 'absolute', transformStyle: 'preserve-3d', zIndex: '1' });   // flies in front of the paid lanes
const faceA = el(phone, { position: 'absolute', inset: '0', backfaceVisibility: 'hidden', borderRadius: `${PH.r}px`, overflow: 'hidden', background: '#fff' });
const faceB = el(phone, { position: 'absolute', inset: '0', backfaceVisibility: 'hidden', borderRadius: `${PH.r}px`, overflow: 'hidden', background: '#fff', transform: 'rotateY(180deg)' });
const portalWho = mtext(faceA, 50, 70, 52, 'Sofia R.', { weight: 600, color: 'rgba(20,33,26,0.78)' });
readable.pop();
const WORLDS = [
  { t: 'portal-30', n: '30', g: C.cream, a: 'Booking', b: 'confirmed ✓' },
  { t: 'portal-14', n: '14', g: C.sand, a: 'Passports', b: 'uploaded ✓' },
  { t: 'portal-7', n: '7', g: C.sage, a: 'Packing list', b: '9 of 12 ✓' },
  { t: 'portal-1', n: '1', g: C.forest, a: 'Pickup 07:40', b: 'Joseph K.' },
];
const pNum = el(faceA, { left: '46px', top: '150px', fontSize: '200px', fontWeight: 820, letterSpacing: '-0.05em', color: C.forest }, 't');
readable.push(pNum);
const pDays = el(faceA, { left: '52px', top: '370px', fontSize: '64px', fontWeight: 720, letterSpacing: '-0.02em' }, 't');
readable.push(pDays);
const pBox = el(faceA, { position: 'absolute', left: '36px', top: '520px', width: '428px', height: '230px', borderRadius: '36px', background: '#f4efe5' });
const pA = el(pBox, { left: '34px', top: '44px', fontSize: '56px', fontWeight: 700, letterSpacing: '-0.02em' }, 't');
const pB = el(pBox, { left: '34px', top: '124px', fontSize: '56px', fontWeight: 600, color: '#047857', letterSpacing: '-0.02em' }, 't');
readable.push(pA, pB);
// driver face
const dName = el(faceB, { left: '50px', top: '62px', fontSize: '68px', fontWeight: 800, letterSpacing: '-0.03em' }, 't');
dName.textContent = 'Joseph K.';
const dCar = el(faceB, { left: '52px', top: '148px', fontSize: '56px', fontWeight: 600, color: 'rgba(20,33,26,0.8)' }, 't');
dCar.textContent = 'Land Cruiser';
const dPlate = el(faceB, { left: '52px', top: '214px', fontSize: '56px', fontWeight: 600, color: 'rgba(20,33,26,0.8)' }, 't');
dPlate.textContent = 'KDA 123A';
readable.push(dName, dCar, dPlate);
const STOPS = [['07:42', 'Airport pickup'], ['10:15', 'En route'], ['15:30', 'At camp']];
const stopEls = STOPS.map(([a, b], i) => {
  const y = 330 + i * 176;
  const dot = el(faceB, { position: 'absolute', left: '52px', top: `${y + 14}px`, width: '40px', height: '40px', borderRadius: '50%', boxSizing: 'border-box' });
  const rail = i < 2 ? el(faceB, { position: 'absolute', left: '70px', top: `${y + 62}px`, width: '4px', height: '124px', background: 'rgba(20,33,26,0.12)' }) : null;
  return { dot, rail, a: mtext(faceB, 120, y, 64, a, { weight: 800 }), b: mtext(faceB, 120, y + 80, 56, b, { weight: 560, color: 'rgba(20,33,26,0.8)' }) };
});

// ================================================================ 7 · paid: swimlanes
const gPaid = el(cam, { position: 'absolute' });
const laneA = mtext(gPaid, -500, -440, 56, 'Confirmed', { weight: 760 });
const laneB = mtext(gPaid, -500, 20, 56, 'Completed', { weight: 760 });
const laneBg = el(gPaid, { position: 'absolute', left: '-500px', top: '100px', width: '1000px', height: '330px', borderRadius: '40px', border: '4px dashed rgba(20,33,26,0.12)', boxSizing: 'border-box' });
const paidCard = el(gPaid, { width: '1000px', height: '330px', borderRadius: '40px' }, 'card');
const thumb = el(paidCard, { position: 'absolute', left: '40px', top: '55px', width: '124px', height: '220px', borderRadius: '24px', background: C.forest });
const pcName = mtext(paidCard, 200, 50, 64, 'Sofia R.', { weight: 800 });
const pcSub = mtext(paidCard, 200, 132, 56, 'Honeymoon · 2 adults', { weight: 550, color: 'rgba(20,33,26,0.8)' });
const pcBal = mtext(paidCard, 200, 222, 56, 'Balance', { weight: 550, color: 'rgba(20,33,26,0.8)' });
const pcVal = el(paidCard, { left: '440px', top: '216px', fontSize: '64px', fontWeight: 820, letterSpacing: '-0.03em' }, 't');
readable.push(pcVal);
const mpesa = chip(paidCard, 960, 40, 56, 'M-Pesa ✓', '#d1fae5', '#047857', { right: true });
mpesa.dataset.right = '1';
const fullyPaid = chip(paidCard, 960, 208, 56, 'Fully paid', C.gold, C.forest, { right: true });
fullyPaid.dataset.right = '1';

// ================================================================ captions (screen space)
const CAPS = [
  { words: [['Scored', 0], [' HOT.', 1]], in: CUE['cap-scored'], out: 4.45 },
  { words: [['Priced to', 0], [' margin.', 1]], in: 5.0, out: 8.4 },
  { words: [['Drafted with', 0], [' AI.', 1]], in: 9.0, out: 11.75 },
  { words: [['Their trip,', 0], [' in their', 1], [' pocket.', 1]], in: 12.0, out: 15.62, dark: [15.0, 16.0] },
  { words: [['No app.', 0], [' No login.', 1]], in: CUE['cap-nologin'], out: 19.8, onGold: true },
  { words: [['Paid in', 0], [' full.', 1]], in: 21.4, out: 22.45 },
  { words: [['One login.', 0], [' All of it.', 1]], in: CUE.rest, out: Infinity, onGold: true, layer: featLayer, keep: true },
];
// captions wrap to the caption column: words are laid out once, after the fonts load
let capEls = [];
const buildCaps = () => CAPS.map((c) => {
  const size = L.cap.size;
  const items = [];
  let x = 0, y = 0;
  const width = (text, em) => {
    const probe = el(c.layer ?? capLayer, { fontSize: `${size}px`, fontWeight: em ? 450 : 800, letterSpacing: em ? '-0.01em' : '-0.035em', visibility: 'hidden' }, em ? 't serif' : 't');
    probe.textContent = text;
    const pw = probe.offsetWidth;
    probe.remove();
    return pw;
  };
  for (const [w, em] of c.words) {
    if (c.keep && x > 0 && x + width(w, em) > L.cap.w && width(w.trimStart(), em) <= L.cap.w) { x = 0; y += size * 1.08; }   // phrase moves down whole
    for (const [k, part] of w.split(/(?= )/).entries()) {
      const pw = width(part, em);
      if (x > 0 && x + pw > L.cap.w) { x = 0; y += size * 1.08; }
      const text = x === 0 ? part.trimStart() : part;
      const tx = mtext(c.layer ?? capLayer, L.cap.x + x, L.cap.y + y, size, text, { weight: em ? 450 : 800, serif: !!em, track: em ? '-0.01em' : '-0.035em' });
      tx.em = em;
      items.push(tx);
      x += x === 0 ? pw - (part.length - text.length) * size * 0.25 : pw;
    }
  }
  return { ...c, items };
});

// ================================================================ 8 · everything else (screen space, on the gold field)
// From launch.mp4 (as v1 had it): a run of circle wipes, one per beat, each a full-bleed brand field with a
// tilted tone-on-tone wallpaper of module chips and one huge word. A last gold circle opens onto the full list.
const FEATURES = ['WhatsApp CRM', 'Trip reminders', 'Fleet compliance', 'Ops calendar', 'Supplier payables',
  'Content studio', 'Ask your data', 'Anomaly alerts', 'Roles & audit log', 'Your branding'];
const VOCAB = [...FEATURES, 'M-Pesa', 'KES', 'Maasai Mara', 'HOT', '30 · 14 · 7 · 3 · 1', 'Land Cruiser', 'Amboseli', 'USD'];
const FL = L.feat, RH = 1.4 * FL.size;   // list row pitch
const featRows = FEATURES.map((f, i) => mtext(featLayer, FL.x, FL.cy + (i - FEATURES.length / 2) * RH, FL.size, `✓  ${f}`, { weight: 760, color: C.forest, track: '-0.025em' }));
const RMAX = Math.hypot(W, H) / 2 + 8;
const wipeR = (t, t0) => RMAX * (0.14 + 0.86 * ease.outCubic(prog(t, t0, t0 + 0.3)));   // opens at 14 % on the cue frame
const FIELDS = [
  ['Leads.', C.forest, C.cream],
  ['Fleet.', C.sand, C.forest],
  ['Money.', C.goldDeep, C.forest],
  ['Brand.', C.sage, C.forest],
].map(([word, bg, fg], f) => {
  const layer = el(fieldLayer, { position: 'absolute', inset: '0', background: bg, overflow: 'hidden' });
  const dark = f === 0;
  const chipBg = mixHex(bg, dark ? C.cream : C.ink, dark ? 0.09 : 0.07), chipFg = mixHex(bg, dark ? C.cream : C.ink, dark ? 0.32 : 0.26);
  const lip = mixHex(bg, C.ink, dark ? 0.35 : 0.16);
  const side = 1.3 * Math.hypot(W, H);
  const wall = el(layer, { position: 'absolute', left: `${(W - side) / 2}px`, top: `${(H - side) / 2}px`, width: `${side}px`, height: `${side}px` });
  for (let r = 0; r * 92 < side; r++) {
    const row = el(wall, { position: 'absolute', left: `${(r % 2) * -150}px`, top: `${r * 92}px`, whiteSpace: 'nowrap' });
    for (let k = 0; k * 260 < side + 300; k++) {
      el(row, { display: 'inline-block', margin: '0 12px', padding: '14px 28px', borderRadius: '999px', background: chipBg, color: chipFg,
        fontSize: '34px', fontWeight: 650, lineHeight: '1', boxShadow: `0 6px 0 ${lip}` }).textContent = VOCAB[(r * 5 + k * 3 + f * 7) % VOCAB.length];
    }
  }
  const w = el(layer, { left: `${L.cap.x}px`, top: `${H / 2}px`, color: fg, fontWeight: 800, letterSpacing: '-0.045em', transformOrigin: '0 50%' }, 't');
  w.textContent = word;
  readable.push(w);
  return { layer, wall, w, at: CUE[`field-${f + 1}`], next: f < 3 ? CUE[`field-${f + 2}`] : CUE.list };
});
function fitFields() {   // each word fills the width between the caption margins, at most 42 % of the frame's height
  for (const f of FIELDS) {
    f.w.style.fontSize = '100px';
    f.w.style.fontSize = `${Math.min(0.42 * H, (100 * (W - 2 * L.cap.x)) / f.w.offsetWidth)}px`;
  }
}

// ================================================================ end card (screen space)
const E = L.end;
const tile = el(endLayer, { position: 'absolute', background: C.gold });
const compass = el(endLayer, { position: 'absolute' });
compass.innerHTML = `<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="31" fill="none" stroke="${C.forest}" stroke-width="7"/><path d="M50 26 L58 50 L50 74 L42 50 Z" fill="${C.forest}" transform="rotate(35 50 50)"/></svg>`;
const wordmark = mtext(endLayer, E.x + E.tile + 0.28 * E.tile, E.y + (E.tile - E.word) / 2 - 2, E.word, 'SafariOS', { weight: 700, track: '-0.03em' });
const h1a = mtext(endLayer, E.x, E.y + E.tile + 0.9 * E.h1, E.h1, 'The operating system', { weight: 800, track: '-0.035em' });
const h1b = mtext(endLayer, E.x, E.y + E.tile + 2.0 * E.h1, E.h1, 'for safari businesses.', { serif: true, weight: 450, color: C.goldDeep, track: '-0.01em' });
const cta = chip(endLayer, E.x, E.y + E.tile + 3.45 * E.h1, E.cta, 'Create your workspace →', C.forest, C.cream);
const endCursor = el(endLayer, { position: 'absolute', left: '0', top: '0', width: `${1.7 * E.cta}px`, height: `${1.7 * E.cta}px` });
endCursor.innerHTML = cursor.innerHTML.replace(/width="64" height="64"/, 'width="100%" height="100%"')
  .replace('fill="#14211a" stroke="#fff"', 'fill="#fff" stroke="#14211a"');   // light cursor so it reads on the forest button
const url = mtext(endLayer, E.x + 4, E.y + E.tile + 3.45 * E.h1 + 2.2 * E.cta, E.url, 'safarios-demo.vercel.app', { weight: 600, color: 'rgba(20,33,26,0.8)' });

// ---------------------------------------------------------------- measured once (fonts are loaded): word geometry
let HW = null;     // hook words: widths at the hook size, x positions on the line, card positions
function measure() {
  const widths = hookWords.map((s) => s.offsetWidth);
  const space = 0.26 * HS;
  const xs = [];
  let x = L.hook.m;
  widths.forEach((w, i) => { xs.push(x); x += w + space; });
  const k = CARD_TEXT / HS;
  // card layout: words 0–3 on line 1, 4–5 on line 2 (stage su, inside the card)
  const card = [];
  let cx = -450;
  widths.forEach((w, i) => {
    if (i === 4) cx = -450;
    card.push({ x: cx, y: i < 4 ? -190 : -105 });
    cx += (w + space) * k;
  });
  HW = { widths, xs, space, k, card };
  fitFields();
  FP.x = -500 + 960 - fullyPaid.offsetWidth / 2;
  FP.y = 100 + 208 + fullyPaid.offsetHeight / 2;
}

// ---------------------------------------------------------------- the stage camera
// Returns { s, fx, fy, u }: a stage point p lands at (p − f)·s + f·(1 − u). Zooms fly into f.
function camAt(t) {
  if (t >= 4.55 && t < 5.0) { const u = io(t, 4.55, 4.93, ease.inExpo); return { s: lerp(1, 16, u), fx: 300, fy: 190, u }; }
  if (t >= 5.0 && t < 5.4) { const u = 1 - io(t, 5.0, 5.4, ease.outCubic); return { s: 1 + 0.35 * u, fx: 0, fy: -300, u: 0 }; }
  if (t >= 8.55 && t < 9.0) { const u = io(t, 8.55, 8.93, ease.inExpo); return { s: lerp(1, 9, u), fx: -40, fy: -355, u }; }
  if (t >= 9.0 && t < 9.4) { const u = 1 - io(t, 9.0, 9.4, ease.outCubic); return { s: 1 + 0.4 * u, fx: 0, fy: -300, u: 0 }; }
  if (t >= 20.0 && t < 20.5) { const u = 1 - io(t, 20.0, 20.5, ease.outCubic); return { s: 1 + 0.5 * u, fx: -300, fy: -200, u: 0 }; }
  if (t >= 22.55 && t < 23.0) { const u = io(t, 22.55, 22.93, ease.inExpo); return { s: lerp(1, 30, u), fx: FP.x, fy: FP.y, u }; }
  return { s: 1, fx: 0, fy: 0, u: 0 };
}
const FP = { x: 0, y: 0 };   // centre of the Fully paid chip in the Completed lane; set in measure()
const toScreen = (p, c) => ({ x: L.stage.cx + L.stage.s * ((p.x - c.fx) * c.s + c.fx * (1 - c.u)), y: L.stage.cy + L.stage.s * ((p.y - c.fy) * c.s + c.fy * (1 - c.u)) });

// ---------------------------------------------------------------- paint
function groundAt(t) {
  if (t < CUE['portal-14']) return C.cream;
  if (t < CUE['portal-7']) return C.sand;
  if (t < CUE['portal-1']) return C.sage;
  if (t < CUE['driver-flip']) return C.forest;
  if (t < CUE['board-back']) return C.gold;
  if (t < CUE['board-back'] + 0.35) return mixHex(C.gold, C.cream, io(t, 20.0, 20.35, ease.outCubic));
  return C.cream;
}

function render(t) {
  ground.style.background = groundAt(t);
  cursor.style.display = 'none';
  const WB = [];   // the hook words' current boxes (screen px), for the card that grows around them
  const c = camAt(t);
  cam.style.transform = `translate(${c.fx * (1 - c.u)}px, ${c.fy * (1 - c.u)}px) scale(${c.s}) translate(${-c.fx}px, ${-c.fy}px)`;

  // ---------- 1 · hook words, caret, pull-back into the card
  const hookOn = t < 5.0;
  show(hookLayer, hookOn);
  if (hookOn) {
    const pan = PAN(t);
    // phase A (pull-back → board): the whole line shrinks as one rigid unit onto the card's first line.
    // phase B (board → +0.3 s): once small, it reflows into the card's two lines at 64 su.
    const pa = io(t, CUE.pullback, CUE.board, ease.inOutCubic);
    const pbf = io(t, CUE.board, CUE.board + 0.3, ease.inOutCubic);
    const yLine = H / 2 - 0.55 * HS;
    const lineW = HW.xs[5] + HW.widths[5] - HW.xs[0];
    const kA = (920 * L.stage.s * c.s) / lineW;                  // one line across the card's width
    const c0 = toScreen(HW.card[0], c);
    const ax = lerp(HW.xs[0] - pan, c0.x, pa), ay = lerp(yLine, c0.y, pa), ak = lerp(1, kA, pa);
    hookWords.forEach((s, i) => {
      s.style.visibility = t >= WT[i] ? 'visible' : 'hidden';
      const lift = (1 - after(t, WT[i], (d) => launch(d, 3.5, 0.8, 12))) * 0.12 * HS * (1 - pa);
      const A = { x: ax + (HW.xs[i] - HW.xs[0]) * ak, y: ay + lift, k: ak };
      const cp = toScreen(HW.card[i], c);
      const Bp = { x: cp.x, y: cp.y, k: HW.k * L.stage.s * c.s };
      const py = i >= 4 ? ease.outCubic(pbf) : pbf, px = i >= 4 ? ease.inCubic(pbf) : pbf;
      const X = lerp(A.x, Bp.x, px), Y = lerp(A.y, Bp.y, py), K = lerp(A.k, Bp.k, pbf);
      s.style.transform = `translate(${X}px, ${Y}px) scale(${K})`;
      WB[i] = { x: X, y: Y, w: HW.widths[i] * K, h: HS * K };
    });
    const last = WT.filter((w) => t >= w).length - 1;
    const cx = last < 0 ? L.hook.m : HW.xs[last] + HW.widths[last] + 0.06 * HS;
    const blink = t >= 1.75 ? Math.floor((t - 1.75) * 4) % 2 === 0 : true;
    caret.style.display = t < CUE.pullback && blink ? '' : 'none';
    caret.style.transform = `translate(${cx - pan}px, ${H / 2 - 0.5 * HS}px)`;
  }

  // ---------- 2 · scored
  const scoredOn = t >= CUE.pullback && t < 5.0;
  show(gScored, scoredOn);
  if (scoredOn) {
    // the card grows out of the shrinking words: from their bounds to the card
    const pb = io(t, CUE.pullback, CUE.board, ease.inOutCubic);
    // start from the words' current bounds (screen → stage su), padded, and grow to the card
    const su = (v, o) => (v - o) / L.stage.s;
    const bx0 = su(Math.min(...WB.map((b) => b.x)), L.stage.cx) - 50, by0 = su(Math.min(...WB.map((b) => b.y)), L.stage.cy) - 40;
    const bx1 = su(Math.max(...WB.map((b) => b.x + b.w)), L.stage.cx) + 50, by1 = su(Math.max(...WB.map((b) => b.y + b.h)), L.stage.cy) + 40;
    const fit = ease.outCubic(prog(t, CUE.pullback + 0.15, CUE.board + 0.15));
    const R = { x: lerp(bx0, CARD.x, fit), y: lerp(by0, CARD.y, fit), w: lerp(bx1 - bx0, CARD.w, fit), h: lerp(by1 - by0, CARD.h, fit) };
    Object.assign(reqCard.style, { left: `${R.x}px`, top: `${R.y}px`, width: `${R.w}px`, height: `${R.h}px`, visibility: pb > 0 ? 'visible' : 'hidden' });
    rise(colHead, t, CUE.board, 4.45);
    popScale(colCount, t, CUE.board + 0.06, 4.45);
    const pk = after(t, CUE.board);
    peek.style.transform = `translateY(${(1 - pk) * 160}px)`;
    peek.style.visibility = t >= CUE.board ? 'visible' : 'hidden';
    rise(peekHead, t, CUE.board);
    popScale(webChip, t, CUE.board, Infinity, '0 50%');
    rise(who, t, CUE.board + 0.12);
    // score ring 0 → 82 over half a beat
    const sc = clamp(io(t, CUE.score, CUE.hot, ease.outCubic));
    ring.style.visibility = t >= CUE.score ? 'visible' : 'hidden';
    ring.style.background = `conic-gradient(${C.forest} ${sc * 0.82 * 360}deg, rgba(20,33,26,0.08) 0deg)`;
    ring.style.mask = ring.style.webkitMask = 'radial-gradient(circle, transparent 52px, #000 53px)';
    ringNum.style.visibility = t >= CUE.score ? 'visible' : 'hidden';
    ringNum.textContent = String(Math.round(82 * sc));
    popScale(hot, t, CUE.hot, Infinity, '100% 50%');
    popScale(btn, t, CUE.board + 0.25, Infinity, '100% 50%');
    // cursor arrives 4.0 → 4.35, clicks at 4.5
    const ca = io(t, 4.0, 4.35, ease.outCubic);
    cursor.style.display = t >= 4.0 && t < 5.0 ? '' : 'none';
    cursor.style.transform = `translate(${lerp(640, 330, ca)}px, ${lerp(520, 178, ca)}px)`;
    const press = t >= CUE['build-quote'] ? 1 - 0.06 * Math.exp(-(t - CUE['build-quote']) * 18) : 1;
    if (t >= CUE['build-quote']) { btn.style.transform = `translateX(-100%) scale(${press})`; btn.style.background = mixHex(C.gold, C.goldDeep, Math.exp(-(t - CUE['build-quote']) * 6)); }
    else btn.style.background = C.gold;
  }

  // ---------- 3 · costed
  const costOn = t >= 5.0 && t < 9.0;
  show(gCost, costOn);
  if (costOn) {
    rise(costTitle, t, 5.0);
    rise(costSub, t, 5.05);
    rowEls.forEach((r, i) => {
      const t0 = CUE[`row-${i + 1}`];
      rise(r.a, t, t0); rise(r.b, t, t0 + 0.04);
      r.line.style.transform = `scaleX(${after(t, t0)})`;
      r.line.style.transformOrigin = '0 0';
    });
    rise(netL, t, CUE.totals); rise(sellL, t, CUE.totals + 0.04); rise(kesL, t, CUE.totals + 0.12);
    const mg = io(t, CUE.totals, CUE.margin, ease.outCubic);
    marginNum.style.visibility = t >= CUE.totals ? 'visible' : 'hidden';
    marginNum.textContent = `${(25 * mg).toFixed(1)} %`;
    popScale(healthy, t, CUE.margin, Infinity, '0 50%');
    const ad = after(t, CUE.advisor);
    advisor.style.visibility = t >= CUE.advisor ? 'visible' : 'hidden';
    advisor.style.transform = `translateY(${(1 - ad) * 60}px) scaleY(${clamp(ad * 1.5)})`;
    advisor.style.transformOrigin = '50% 0';
    rise(advText, t, CUE.advisor + 0.08);
  }

  // ---------- 4 · drafted (card stays for the morph into the phone)
  const draftOn = t >= 9.0 && t < 12.2;
  show(gDraft, draftOn);
  if (draftOn) {
    const mo = after(t, CUE['portal-30'], (d) => launch(d, 3.4, 0.9, 12));   // morph card → phone
    const R = { x: lerp(-500, -PH.w / 2, mo), y: lerp(-430, -PH.h / 2, mo), w: lerp(1000, PH.w, mo), h: lerp(860, PH.h, mo), r: lerp(40, PH.r, mo) };
    Object.assign(draftCard.style, { left: `${R.x}px`, top: `${R.y}px`, width: `${R.w}px`, height: `${R.h}px`, borderRadius: `${R.r}px` });
    const out = CUE['portal-30'];   // content folds away on the hit, while the card morphs
    draftHead.style.transform = `scaleY(${1 - ease.inCubic(prog(t, out, out + 0.22))})`;
    draftHead.style.transformOrigin = '0 0';
    rise(draftTitle, t, 9.0, out); rise(draftSub, t, 9.06, out);
    const pr = after(t, CUE.prompt);
    prompt.style.visibility = t >= CUE.prompt && t < out + 0.2 ? 'visible' : 'hidden';
    prompt.style.transform = `translateY(${(1 - pr) * 40 + ease.inCubic(prog(t, out, out + 0.2)) * 40}px) scaleX(${clamp(pr * 1.4) * (1 - ease.inCubic(prog(t, out, out + 0.2)))})`;
    prompt.style.transformOrigin = '0 50%';
    const nw = t < CUE.prompt ? 0 : Math.min(3, 1 + Math.floor((t - CUE.prompt) / 0.125));
    promptTx.textContent = PROMPT_WORDS.slice(0, nw).join('');
    dayEls.forEach((d, i) => { const t0 = CUE[`day-${i + 1}`]; rise(d.a, t, t0, out); rise(d.b, t, t0, out); });
    popScale(publish, t, 10.2, out, '100% 50%');
    if (t >= CUE.publish) publish.style.background = mixHex(C.gold, C.goldDeep, Math.exp(-(t - CUE.publish) * 6));
    else publish.style.background = C.gold;
    const ca = io(t, 11.0, 11.35, ease.outCubic);
    const showCur = t >= 11.0 && t < out;
    cursor.style.display = showCur ? '' : 'none';
    if (showCur) cursor.style.transform = `translate(${lerp(620, 270, ca)}px, ${lerp(560, 355, ca)}px)`;
    draftCard.style.display = t >= CUE['portal-30'] + 0.2 ? 'none' : '';
  }

  // ---------- 5–6 · phone
  const phoneOn = t >= CUE['portal-30'] + 0.2 && t < CUE['board-back'] + 0.5;
  show(phone, phoneOn);
  if (phoneOn) {
    // anchored: centred, fixed. From 20.0 it shrinks into the card's thumbnail.
    const sh = io(t, CUE['board-back'], CUE['board-back'] + 0.5, ease.inOutCubic);
    const TH = { x: -500 + 40 + 62, y: -440 + 85 + 165 - 25, w: 124, h: 220, r: 24 };   // thumbnail centre in its Confirmed position
    const cxp = lerp(0, TH.x, sh), cyp = lerp(0, TH.y, sh), w = lerp(PH.w, TH.w, sh), h = lerp(PH.h, TH.h, sh);
    const flip = io(t, CUE['driver-flip'], CUE['driver-flip'] + 0.45, ease.outCubic) * 180;   // starts at full speed on the cue
    Object.assign(phone.style, { left: `${cxp - w / 2}px`, top: `${cyp - h / 2}px`, width: `${PH.w}px`, height: `${PH.h}px`,
      transformOrigin: '0 0', transform: `scale(${w / PH.w}, ${h / PH.h})` });
    const ring2 = `0 0 0 16px ${C.ink}, 0 50px 90px -30px rgba(0,0,0,0.45)`;
    faceA.style.boxShadow = faceB.style.boxShadow = ring2;
    faceA.style.transform = `perspective(2400px) rotateY(${flip}deg)`;
    faceB.style.transform = `perspective(2400px) rotateY(${flip + 180}deg)`;
    faceA.style.transformOrigin = faceB.style.transformOrigin = '50% 50%';
    // portal content swaps instantly on each world change
    const wi = WORLDS.reduce((k, wd, i) => (t >= CUE[wd.t] ? i : k), 0);
    const wd = WORLDS[wi];
    const pop = after(t, CUE[wd.t] + (wi === 0 ? 0.2 : 0), (d) => launch(d, 3, 0.7, 10));
    pNum.textContent = wd.n;
    pNum.style.transform = `scale(${0.9 + 0.1 * pop})`;
    pNum.style.transformOrigin = '0 80%';
    pDays.textContent = wd.n === '1' ? 'day to go' : 'days to go';
    pA.textContent = wd.a;
    pB.textContent = wd.b;
    rise(portalWho, t, CUE['portal-30'] + 0.2);
    // driver stops
    stopEls.forEach((s, i) => {
      const t0 = CUE[`stop-${i + 1}`];
      const on = t >= t0;
      s.dot.style.background = on ? '#10b981' : '#fff';
      s.dot.style.border = on ? '0' : '5px solid rgba(20,33,26,0.25)';
      s.dot.style.transform = `scale(${on ? 0.7 + 0.3 * after(t, t0, (d) => launch(d, 3, 0.6, 14)) : 1})`;
      rise(s.a, t, t0); rise(s.b, t, t0 + 0.05);
    });
  }

  // ---------- 7 · paid
  const paidOn = t >= CUE['board-back'] && t < 23.0;
  show(gPaid, paidOn);
  if (paidOn) {
    rise(laneA, t, CUE['board-back'] + 0.05); rise(laneB, t, CUE['board-back'] + 0.15);
    laneBg.style.visibility = t >= CUE['board-back'] + 0.15 ? 'visible' : 'hidden';
    const mv = after(t, CUE.completed, (d) => launch(d, 2.2, 0.85, 3));
    const y = lerp(-370, 100, mv);
    Object.assign(paidCard.style, { left: '-500px', top: `${y}px` });
    // the phone flies alone into its slot (20.0–20.5); the card then grows out of the thumbnail around it
    const land = CUE['board-back'] + 0.5;
    const ci = after(t, land, (d) => launch(d, 3, 0.85, 10));
    paidCard.style.visibility = t >= land ? 'visible' : 'hidden';
    paidCard.style.transform = `scale(${0.3 + 0.7 * ci}, ${0.7 + 0.3 * ci})`;
    paidCard.style.transformOrigin = '10% 50%';
    thumb.style.visibility = t >= land ? 'visible' : 'hidden';
    rise(pcName, t, land + 0.05); rise(pcSub, t, land + 0.1); rise(pcBal, t, land + 0.15);
    pcVal.textContent = t >= CUE['fully-paid'] ? '$0' : '$7,400';
    pcVal.style.visibility = t >= CUE['board-back'] + 0.65 ? 'visible' : 'hidden';
    pcVal.style.color = t >= CUE['fully-paid'] ? '#047857' : C.ink;
    // M-Pesa chip drops in on the payment cue
    const dp = after(t, CUE.payment, (d) => launch(d, SNAPPY.freq, SNAPPY.damp, 10));
    mpesa.style.visibility = t >= CUE.payment ? 'visible' : 'hidden';
    mpesa.style.transform = `translateX(-100%) translateY(${(1 - dp) * -80}px)`;
    popScale(fullyPaid, t, CUE['fully-paid'], Infinity, '100% 50%');
  }

  // ---------- captions
  capEls.forEach((cp) => {
    const dark = cp.dark && t >= cp.dark[0] && t < cp.dark[1];
    cp.items.forEach((tx, j) => {
      rise(tx, t, cp.in + 0.0625 * j, cp.out + 0.03 * j);
      tx.m.style.color = tx.em ? (cp.onGold ? C.forest : dark ? C.gold : C.goldDeep) : (dark ? C.cream : C.ink);
    });
  });

  // ---------- 8–9 · the gold field: everything else, then it contracts into the logo tile
  const endOn = t >= CUE.rest;
  show(endLayer, endOn);
  const k = io(t, CUE.end, CUE.end + 0.4, ease.outCubic);
  const R = { x: lerp(0, E.x, k), y: lerp(0, E.y, k), w: lerp(W, E.tile, k), h: lerp(H, E.tile, k), r: lerp(0, 0.24 * E.tile, k) };
  const featOn = t >= CUE.rest && t < CUE.end + 0.2;
  show(featLayer, featOn);
  if (featOn) {
    // the list rises row by row inside the last circle, then rides into the logo tile with the gold
    featRows.forEach((r, i) => rise(r, t, CUE.list + 0.05 * i));
    const u = Math.min(R.w / W, R.h / H);
    featLayer.style.transformOrigin = '0 0';
    featLayer.style.transform = `translate(${R.x + R.w / 2 - (u * W) / 2}px, ${R.y + R.h / 2 - (u * H) / 2}px) scale(${u})`;
  }
  // the wipe run: each field opens from the centre on its beat; its word scales up and blurs as the next circle grows
  const fieldsOn = t >= CUE['field-1'] && t < CUE.list + 0.3;
  show(fieldLayer, fieldsOn);
  if (fieldsOn) {
    FIELDS.forEach((f) => {
      const on = t >= f.at && t < f.next + 0.3;
      show(f.layer, on);
      if (!on) return;
      f.layer.style.clipPath = `circle(${wipeR(t, f.at).toFixed(1)}px at 50% 50%)`;
      f.wall.style.transform = `rotate(-12deg) translateX(${-70 * (t - f.at)}px)`;
      const arrive = ease.outExpo(prog(t, f.at, f.at + 0.4)), leave = ease.inCubic(prog(t, f.next, f.next + 0.3));
      f.w.style.transform = `translateY(-52%) scale(${lerp(0.84, 1, arrive) * (1 + 0.45 * leave)})`;
      f.w.style.filter = leave > 0.01 ? `blur(${(16 * leave).toFixed(2)}px)` : 'none';
    });
    // the gold opens back through the run on the list cue
    const hole = t >= CUE.list ? wipeR(t, CUE.list) : 0;
    fieldLayer.style.mask = fieldLayer.style.webkitMask = hole > 0 ? `radial-gradient(circle at 50% 50%, transparent ${hole.toFixed(1)}px, #000 ${(hole + 1).toFixed(1)}px)` : 'none';
  }
  if (endOn) {
    Object.assign(tile.style, { left: `${R.x}px`, top: `${R.y}px`, width: `${R.w}px`, height: `${R.h}px`, borderRadius: `${R.r}px` });
    const cs = after(t, CUE.end + 0.2);
    Object.assign(compass.style, { left: `${E.x + 0.1 * E.tile}px`, top: `${E.y + 0.1 * E.tile}px`, width: `${0.8 * E.tile}px`, height: `${0.8 * E.tile}px`,
      transform: `scale(${cs}) rotate(${(1 - cs) * -90}deg)`, visibility: t >= CUE.end + 0.2 ? 'visible' : 'hidden' });
    rise(wordmark, t, CUE.end + 0.25);
    rise(h1a, t, CUE['h1-1']);
    rise(h1b, t, CUE['h1-2']);
    popScale(cta, t, CUE.cta, Infinity, '0 50%');
    rise(url, t, CUE.cta + 0.12);
    // cursor glides in (0.55 s before the press, settled 0.1 s before it) and presses the CTA on the cue
    const tx = E.x + 0.93 * cta.offsetWidth, ty = cta.offsetTop + 0.62 * cta.offsetHeight;   // tip on the arrow, clear of the label
    const gl = io(t, CUE['cta-press'] - 0.55, CUE['cta-press'] - 0.1, ease.outCubic);
    endCursor.style.visibility = t >= CUE['cta-press'] - 0.55 ? 'visible' : 'hidden';
    endCursor.style.transform = `translate(${lerp(W * 0.92, tx, gl) - 0.28 * E.cta}px, ${lerp(H * 1.05, ty, gl) - 0.14 * E.cta}px)`;
    if (t >= CUE['cta-press']) {
      const pr = Math.exp(-(t - CUE['cta-press']) * 9);
      cta.style.transformOrigin = '93% 62%';   // the button gives under the cursor tip
      cta.style.transform = `scale(${1 - 0.08 * pr})`;
      cta.style.background = mixHex(C.forest, C.forest3, pr);
    } else cta.style.background = C.forest;
    // slow creep while it holds
    endLayer.style.transform = `scale(${1 + 0.012 * prog(t, CUE.cta + 1.0, D)})`;
    endLayer.style.transformOrigin = `${E.x}px ${H / 2}px`;
  }
}

// the caret leads: the line pans so each word is fully on screen, and the pan is at rest, by the time it lands
// (SNAPPY settles in 0.19 s; it is retargeted 0.24 s before each word)
let PAN = () => 0;
function buildPan() {
  const keys = [{ t: 0, v: 0 }];
  WT.forEach((w, i) => keys.push({ t: w - 0.24, v: Math.max(0, HW.xs[i] + HW.widths[i] + 0.2 * HS + L.hook.m - W) }));
  PAN = springTrack(keys, { freq: SNAPPY.freq, damp: SNAPPY.damp });
}

window.seek = function seek(time) {
  window.__t = time;
  render(clamp(time, 0, D - 1e-6));
};

// ---------------------------------------------------------------- hooks for tools/check.py
const box = (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; };
const CUE_EL = {
  caret: () => caret, 'type-1': () => hookWords[0], 'type-2': () => hookWords[1], 'type-3': () => hookWords[2],
  'type-4': () => hookWords[3], 'type-5': () => hookWords[4], 'type-6': () => hookWords[5],
  board: () => colHead.m, itinerary: () => draftCard, score: () => ring, hot: () => hot, 'cap-scored': () => capEls[0].items[0].m, 'build-quote': () => btn,
  'row-1': () => rowEls[0].a.m, 'row-2': () => rowEls[1].a.m, 'row-3': () => rowEls[2].a.m, 'row-4': () => rowEls[3].a.m,
  totals: () => netL.m, margin: () => healthy, advisor: () => advisor, prompt: () => prompt,
  'day-1': () => dayEls[0].b.m, 'day-2': () => dayEls[1].b.m, 'day-3': () => dayEls[2].b.m, publish: () => publish,
  'portal-30': () => draftCard, 'portal-14': () => pNum, 'portal-7': () => pNum, 'portal-1': () => pNum,
  'cap-nologin': () => capEls[4].items[0].m, 'stop-1': () => stopEls[0].a.m, 'stop-2': () => stopEls[1].a.m, 'stop-3': () => stopEls[2].a.m,
  'cta-press': () => cta, payment: () => mpesa, 'fully-paid': () => fullyPaid, completed: () => paidCard,
  'h1-1': () => h1a.m, 'h1-2': () => h1b.m, cta: () => cta,
  rest: () => capEls[6].items[0].m,   // the field wipes and the list's circle change the whole frame: no box
};
window.cueBox = (name) => { const f = CUE_EL[name]; if (!f) return null; const e = f(); return e && e.getClientRects().length ? box(e) : null; };
// readable text on screen with its rendered size: font size × the scale of every transform above it
window.filmTextAudit = () => {
  const out = [];
  for (const s of readable) {
    if (!s.getClientRects().length || !s.textContent.trim()) continue;
    let vis = true, k = 1;
    for (let n = s; n && n !== document.body; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.visibility === 'hidden' || cs.display === 'none') { vis = false; break; }
      if (cs.transform && cs.transform !== 'none') { const m = new DOMMatrix(cs.transform); k *= Math.hypot(m.a, m.b); }
    }
    if (!vis) continue;
    const r = s.getBoundingClientRect();
    if (r.right < 0 || r.left > W || r.bottom < 0 || r.top > H) continue;
    // inside a mask: count it only when most of it is inside the mask's box
    const m = s.parentElement.classList.contains('mask') ? s.parentElement.getBoundingClientRect() : null;
    if (m && !dbg.noMasks && Math.max(0, Math.min(r.bottom, m.bottom) - Math.max(r.top, m.top)) < 0.6 * r.height) continue;
    out.push({ text: s.textContent, px: parseFloat(getComputedStyle(s).fontSize) * k });
  }
  return out;
};

await document.fonts.load('800 100px Inter');
await document.fonts.load('600 100px Inter');
await document.fonts.load('450 100px Fraunces');
await document.fonts.load('italic 450 100px Fraunces');
await document.fonts.ready;
measure();
buildPan();
capEls = buildCaps();
window.seek(0);
window.filmReady = true;

if (!navigator.webdriver) { // preview-only
  const start = performance.now(); // preview-only
  const tick = (now) => { window.seek(((now - start) / 1000) % D); requestAnimationFrame(tick); }; // preview-only
  requestAnimationFrame(tick); // preview-only
} // preview-only
