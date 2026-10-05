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
