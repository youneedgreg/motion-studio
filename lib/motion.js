// Timing primitives. Everything here is a pure function of its inputs.
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, u) => a + (b - a) * u;
// Normalised progress of t through [a, b], clamped to 0..1.
export const prog = (t, a, b) => clamp((t - a) / (b - a));

export const ease = {
  linear: (u) => u,
  inCubic: (u) => u * u * u,
  outCubic: (u) => 1 - Math.pow(1 - u, 3),
  inOutCubic: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
  outQuint: (u) => 1 - Math.pow(1 - u, 5),
  inExpo: (u) => (u <= 0 ? 0 : Math.pow(2, 10 * u - 10)),
  outExpo: (u) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u)),
  inOutExpo: (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u < 0.5 ? Math.pow(2, 20 * u - 10) / 2 : (2 - Math.pow(2, -20 * u + 10)) / 2),
  outBack: (u, s = 1.70158) => 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2),
};

// Spring step response from 0 to 1, starting at rest: x'' = w²(1 − x) − 2·damp·w·x', w = 2π·freq.
// Exact closed form for every damping ratio:
//   damp < 1  underdamped — overshoots and rings
//   damp = 1  critically damped — fastest return with no overshoot
//   damp > 1  overdamped — slower, no overshoot
// 0 for dt <= 0, continuous with zero velocity at dt = 0, settles at 1.
export function spring(dt, freq = 2.2, damp = 0.8) {
  if (dt <= 0) return 0;
  const w = 2 * Math.PI * freq;
  if (Math.abs(damp - 1) < 1e-6) return 1 - Math.exp(-w * dt) * (1 + w * dt);
  if (damp < 1) {
    const wd = w * Math.sqrt(1 - damp * damp);
    return 1 - Math.exp(-damp * w * dt) * (Math.cos(wd * dt) + ((damp * w) / wd) * Math.sin(wd * dt));
  }
  const s = w * Math.sqrt(damp * damp - 1);
  const r1 = -damp * w + s, r2 = -damp * w - s;   // r1 is the slow root
  return 1 + (r2 * Math.exp(r1 * dt) - r1 * Math.exp(r2 * dt)) / (r1 - r2);
}

// Slowest exponential decay rate of a spring's response (1/s).
export function springDecay(freq = 2.2, damp = 0.8) {
  const w = 2 * Math.PI * freq;
  return damp < 1 ? damp * w : w * (damp - Math.sqrt(Math.max(0, damp * damp - 1)));
}

// Presets: { freq (Hz), damp (ratio) }. Overshoot / 2 % settle times are printed by tools/test_motion.mjs.
export const SNAPPY = { freq: 3.5, damp: 0.85 };
export const DEFAULT = { freq: 2.2, damp: 0.8 };
export const HEAVY = { freq: 1.4, damp: 1 };
export const CAMERA = { freq: 1.2, damp: 0.95 };
export const PLAYFUL = { freq: 2.5, damp: 0.5 };

// Damped impulse: 0 at dt<=0, peaks near 1 shortly after, rings out to 0. For hits and wobbles.
export function kick(dt, freq = 4, damp = 0.25) {
  if (dt <= 0) return 0;
  const w = 2 * Math.PI * freq;
  const wd = w * Math.sqrt(1 - damp * damp);
  return Math.exp(-damp * w * dt) * Math.sin(wd * dt);
}

// Sum-of-springs track: a value that springs from target to target. keys = [{ t, v }] in time order.
// Each key adds (v - previous v) × spring(t - key.t), so overlapping moves add up instead of jumping.
// With `period`, keys repeat every period (the first key's step comes from the last key's value), and
// earlier repeats are summed in, so value and velocity at t + period equal those at t. By default enough
// repeats are summed for the slowest decay to fall below 1e-10, so heavy springs on short loops still close.
export function springTrack(keys, { freq = 2.2, damp = 0.8, period = 0, repeats } = {}) {
  const n = keys.length;
  if (period && repeats === undefined) repeats = Math.max(1, Math.ceil(Math.log(1e10) / springDecay(freq, damp) / period) + 1);
  const steps = keys.map((k, i) => ({ t: k.t, dv: k.v - (i ? keys[i - 1].v : period ? keys[n - 1].v : k.v) }));
  const base = period ? keys[n - 1].v : keys[0].v;
  return (t) => {
    if (period) t = ((t % period) + period) % period; // periodic for any t, not just the first pass
    let v = base;
    for (let r = 0; r <= (period ? repeats : 0); r++) {
      for (const s of steps) v += s.dv * spring(t - s.t + r * period, freq, damp);
    }
    return v;
  };
}
