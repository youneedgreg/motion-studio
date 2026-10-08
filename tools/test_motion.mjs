// Tests for lib/motion.js springs: node tools/test_motion.mjs   (exit 1 on any failure)
// The reference is the spring ODE  x'' = w²(target − x) − 2·damp·w·x'  integrated with
// semi-implicit Euler at dt = 1e-5; the closed forms must match it to 1e-3.
import { spring, springTrack, SNAPPY, DEFAULT, HEAVY, CAMERA, PLAYFUL } from '../lib/motion.js';

const DT = 1e-5;
const TOL = 1e-3;
let failures = 0;
const check = (ok, msg) => { if (!ok) { failures++; console.log(`  FAIL  ${msg}`); } };

// Integrate from rest at x = x0 with a target function; calls visit(t, x, v) after every step.
function simulate({ freq, damp }, T, target, visit, x0 = 0) {
  const w = 2 * Math.PI * freq;
  let x = x0, v = 0;
  const n = Math.round(T / DT);
  for (let i = 1; i <= n; i++) {
    const t0 = (i - 1) * DT;
    v += (w * w * (target(t0) - x) - 2 * damp * w * v) * DT;   // semi-implicit: velocity first,
    x += v * DT;                                                // then position with the new velocity
    visit(i * DT, x, v);
  }
}

// ---------- 1. step response: closed form vs ODE, start/end, overshoot, settle ----------
const CASES = [
  ['SNAPPY', SNAPPY], ['DEFAULT', DEFAULT], ['HEAVY', HEAVY], ['CAMERA', CAMERA], ['PLAYFUL', PLAYFUL],
  ...[0.3, 0.8, 1, 1.5, 3].map((d) => [`damp ${d}`, { freq: 2.2, damp: d }]),
];
console.log('step response (closed form vs semi-implicit Euler, dt = 1e-5, t in 0..2 s)');
console.log('case          freq  damp   max|closed−sim|  overshoot  settle 2%   |1−x(2 s)|   |1−x(10 s)|');
for (const [name, p] of CASES) {
  let maxErr = 0, nan = false;
  simulate(p, 2, () => 1, (t, x) => {
    const c = spring(t, p.freq, p.damp);
    if (!Number.isFinite(c)) nan = true;
    maxErr = Math.max(maxErr, Math.abs(c - x));
  });
  // overshoot and 2 % settle time from the closed form over a long window
  let peak = 0, settle = 0;
  for (let t = 0; t <= 20; t += 1e-4) {
    const x = spring(t, p.freq, p.damp);
    if (!Number.isFinite(x)) nan = true;
    peak = Math.max(peak, x);
    if (Math.abs(x - 1) > 0.02) settle = t;
  }
  const at0 = spring(0, p.freq, p.damp), atEps = spring(1e-9, p.freq, p.damp);
  const end2 = Math.abs(1 - spring(2, p.freq, p.damp)), end10 = Math.abs(1 - spring(10, p.freq, p.damp));
  console.log(`${name.padEnd(12)}  ${p.freq.toFixed(1).padStart(4)}  ${String(p.damp).padStart(4)}   ${maxErr.toExponential(2).padStart(15)}  ${((peak - 1) * 100).toFixed(2).padStart(8)} %  ${settle.toFixed(3).padStart(7)} s   ${end2.toExponential(2).padStart(10)}   ${end10.toExponential(2).padStart(10)}`);
  check(maxErr < TOL, `${name}: closed form deviates from the ODE by ${maxErr}`);
  check(!nan, `${name}: NaN/Infinity in the response`);
  check(at0 === 0 && Math.abs(atEps) < 1e-9, `${name}: does not start at 0 (x(0) = ${at0}, x(1e-9) = ${atEps})`);
  check(end10 < 1e-3, `${name}: does not end within 0.001 of 1 (|1 − x(10 s)| = ${end10})`);
}

// ---------- 2. springTrack retargeting vs ODE with target changes ----------
console.log('\nspringTrack retargeting (targets change before earlier moves settle), t in 0..3 s');
const KEYS = [{ t: 0, v: 0 }, { t: 0.3, v: 1 }, { t: 0.5, v: -0.5 }, { t: 1.2, v: 2 }, { t: 1.35, v: 1.4 }];
const targetAt = (keys) => (t) => { let v = keys[0].v; for (const k of keys) if (t >= k.t) v = k.v; return v; };
for (const [name, p] of CASES) {
  const tr = springTrack(KEYS, p);
  let maxErr = 0;
  simulate(p, 3, targetAt(KEYS), (t, x) => { maxErr = Math.max(maxErr, Math.abs(tr(t) - x)); });
  console.log(`  ${name.padEnd(12)} max|track − sim| ${maxErr.toExponential(2)}`);
  check(maxErr < TOL, `${name}: springTrack deviates from the retargeted ODE by ${maxErr}`);
}

// ---------- 3. periodic springTrack: seam and steady state ----------
// Value and velocity at t = 0 and t = period must match, and the track must equal the steady-state
// solution of the ODE driven by the periodic target (simulated from rest for many periods).
console.log('\nperiodic springTrack (period 3 s): seam and steady state vs ODE');
const P = 3;
const PKEYS = [{ t: 0, v: 0 }, { t: 0.8, v: 1 }, { t: 1.6, v: -0.4 }, { t: 2.3, v: 0.6 }];
const periodicTarget = (t) => { const u = ((t % P) + P) % P; let v = PKEYS[PKEYS.length - 1].v; for (const k of PKEYS) if (u >= k.t) v = k.v; return v; };
const H = 1e-6;
for (const [name, p] of CASES) {
  const tr = springTrack(PKEYS, { ...p, period: P });
  const vel = (t) => (tr(t + H) - tr(t - H)) / (2 * H);
  const dValue = Math.abs(tr(P) - tr(0));
  // velocity arriving at the end of the period vs velocity leaving its start (the loop seam)
  const dVel = Math.abs((tr(P) - tr(P - H)) / H - (tr(H) - tr(0)) / H);
  const cycles = 60;
  let maxErr = 0, maxVErr = 0;
  simulate(p, cycles * P, periodicTarget, (t, x, v) => {
    if (t < (cycles - 1) * P) return;           // compare the last period, long after start-up
    maxErr = Math.max(maxErr, Math.abs(tr(t) - x));
    if (Math.round(t / DT) % 200 === 0) maxVErr = Math.max(maxVErr, Math.abs(vel(t) - v));
  }, PKEYS[PKEYS.length - 1].v);
  console.log(`  ${name.padEnd(12)} |Δvalue| ${dValue.toExponential(1)}  |Δvelocity| ${dVel.toExponential(1)}  steady state: max|track − sim| ${maxErr.toExponential(2)}, max|velocity err| ${maxVErr.toExponential(2)}`);
  check(dValue < 1e-9, `${name}: value differs at t = 0 and t = period (${dValue})`);
  check(dVel < 1e-3, `${name}: velocity differs at t = 0 and t = period (${dVel})`);
  check(maxErr < TOL, `${name}: periodic track deviates from the steady-state ODE by ${maxErr}`);
  check(maxVErr < 1e-2, `${name}: periodic track velocity deviates from the ODE by ${maxVErr}`);
}

console.log(failures ? `\n${failures} failure(s)` : '\nall spring tests passed');
process.exit(failures ? 1 : 0);
