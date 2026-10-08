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

// Damped spring step response: 0 at dt<=0, settles at 1. freq in Hz, damp is the damping ratio (<1).
export function spring(dt, freq = 3, damp = 0.4) {
  if (dt <= 0) return 0;
  const w = 2 * Math.PI * freq;
  const wd = w * Math.sqrt(1 - damp * damp);
  return 1 - Math.exp(-damp * w * dt) * (Math.cos(wd * dt) + ((damp * w) / wd) * Math.sin(wd * dt));
}

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
// earlier repeats are summed in, so value and velocity at t + period equal those at t.
export function springTrack(keys, { freq = 2.2, damp = 0.8, period = 0, repeats = 3 } = {}) {
  const n = keys.length;
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
