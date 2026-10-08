"""Shared synthesis + mastering helpers for film scores (numpy/scipy, 48 kHz stereo).

A score builds into a Mixer (dry bus + reverb send), then master() glues, limits to a
true-peak ceiling and normalises to a loudness target measured with ffmpeg's ebur128.
"""
import re, subprocess, zlib
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy import signal
from scipy.ndimage import minimum_filter1d, uniform_filter1d

SR = 48000
_rng = np.random.default_rng(11)


def tt(d):
    return np.arange(int(d * SR)) / SR


def env(d, a=0.002, decay=0.2):
    t = tt(d)
    return np.minimum(1, t / a) * np.exp(-t / decay)


def seed_for(*parts):
    """A stable 32-bit seed from a sound's identity, e.g. seed_for('florios', 'click', 'kpi')."""
    return zlib.crc32('/'.join(map(str, parts)).encode())


def noise(d, seed=None):
    """White noise. With `seed` the sound gets its own stream, so adding or removing another sound
    never changes it; without one it draws from the shared module stream (order-dependent)."""
    rng = _rng if seed is None else np.random.default_rng(seed)
    return rng.standard_normal(int(d * SR))


def sweep_sine(d, f0, f1, curve=0.04):
    t = tt(d)
    f = f1 + (f0 - f1) * np.exp(-t / curve)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def glide(d, f0, f1, shape=1.0):
    """Sine gliding f0 → f1 over d seconds (shape > 1 = slow start)."""
    u = tt(d) / d
    f = f0 * (f1 / f0) ** (u ** shape)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def _sos(kind, f, order=2):
    return signal.butter(order, f, kind, fs=SR, output='sos')


def bp(x, lo, hi, order=2):
    return signal.sosfilt(_sos('bandpass', [lo, min(hi, SR / 2 - 100)], order), x)


def hp(x, f, order=2):
    return signal.sosfilt(_sos('highpass', f, order), x)


def lp(x, f, order=2):
    return signal.sosfilt(_sos('lowpass', f, order), x)


def mtof(m):
    return 440 * 2 ** ((m - 69) / 12)


def marimba(m, d=0.6, bright=1.0, seed=None):
    """Struck bar: fundamental + 4th partial, fast decay; woody click on the attack."""
    f = mtof(m)
    t = tt(d)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.28) + 0.35 * bright * np.sin(2 * np.pi * 3.93 * f * t) * np.exp(-t / 0.05)
    x[:240] += hp(noise(240 / SR, seed), 2500) * 0.15 * bright
    return x * np.minimum(1, t / 0.0015)


def bell(m, d=1.6):
    f = mtof(m)
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t / 0.3)
            + 0.25 * np.sin(2 * np.pi * 5.4 * f * t) * np.exp(-t / 0.12)) * np.exp(-t / 0.6) * np.minimum(1, t / 0.002)


def whoosh(d, lo=300, hi=6000, up=True, seed=None):
    """Filtered noise whose band sweeps; amplitude swells to the middle."""
    x = noise(d, seed)
    out = np.zeros_like(x)
    seg = int(0.01 * SR)
    for i in range(0, len(x), seg):
        u = i / len(x)
        fc = lo * (hi / lo) ** (u if up else 1 - u)
        blk = bp(x[max(0, i - 1500):i + seg], fc * 0.6, fc * 1.6)[-len(x[i:i + seg]):]
        out[i:i + seg] = blk
    u = tt(d) / d
    return out * np.sin(np.pi * u) ** 1.5


class Mixer:
    def __init__(self, dur, tail=3.0):
        self.n = int(dur * SR)
        self.dry = np.zeros((self.n + int(tail * SR), 2))
        self.wet = np.zeros_like(self.dry)

    def add(self, t, x, gain=1.0, pan=0.0, send=0.0):
        i = int(round(t * SR))
        x = np.asarray(x) * gain
        if i < 0:
            x, i = x[-i:], 0
        L, R = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
        n = len(self.dry[i:i + len(x)])
        self.dry[i:i + n, 0] += x[:n] * L
        self.dry[i:i + n, 1] += x[:n] * R
        if send:
            self.wet[i:i + n, 0] += x[:n] * L * send
            self.wet[i:i + n, 1] += x[:n] * R * send

    def render(self, rev_time=0.35, rev_gain=0.06, seed=None):
        ir_t = tt(1.6)
        ir = np.stack([lp(noise(1.6, None if seed is None else seed + c), 6000) * np.exp(-ir_t / rev_time) for c in range(2)], 1)
        ir[:int(0.012 * SR)] = 0
        rev = np.stack([signal.fftconvolve(self.wet[:, c], ir[:, c])[:len(self.wet)] for c in range(2)], 1) * rev_gain
        mix = self.dry + rev
        return np.stack([hp(mix[:, c], 25) for c in range(2)], 1)


def _release(g, coef):
    y = np.empty_like(g)
    cur = 1.0
    for i in range(len(g)):
        cur = g[i] if g[i] < cur else cur + (g[i] - cur) * coef
        y[i] = cur
    return y


try:
    from numba import njit
    _release_fast = njit(_release)
except ImportError:  # plain Python fallback is slower but identical
    _release_fast = _release


def limit(x, ceiling_db=-1.6):
    ceil = 10 ** (ceiling_db / 20)
    up = signal.resample_poly(x, 4, 1, axis=0)
    pk = np.abs(up).max(1).reshape(-1, 4).max(1)[:len(x)]
    g = np.minimum(1, ceil / np.maximum(pk, 1e-9))
    w = int(0.003 * SR)
    g = minimum_filter1d(g, w, origin=-(w // 2))
    g = uniform_filter1d(g, w, origin=(w - 1) // 2)
    g = _release_fast(g, 1 - np.exp(-1 / (0.08 * SR)))
    return x * g[:, None]


def measure(path):
    r = subprocess.run(['ffmpeg', '-nostats', '-i', str(path), '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    summ = r[r.rfind('Summary:'):]
    I = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1))
    tp = float(re.search(r'Peak:\s+(-?[\d.inf]+) dBFS', summ).group(1))
    return I, tp


def master(mix, path, target=-14.0, fade_out=0.0, tol=0.15, ceiling=-1.0):
    """Glue, limit and normalise to `target` LUFS with true peak <= `ceiling` dBTP. Returns (LUFS, dBTP).
    Raises RuntimeError, writing nothing to `path`, if the gain loop doesn't converge within ±tol LU."""
    path = Path(path)
    src = np.tanh(mix * 1.2) / 1.2
    if fade_out:
        n = int(fade_out * SR)
        src[-n:] *= np.linspace(1, 0, n)[:, None] ** 2
    tmp = path.with_name(path.stem + '.mastering.wav')   # measured here; `path` only gets a passing master
    gain_db, ok = 0.0, False
    try:
        for it in range(6):
            y = limit(src * 10 ** (gain_db / 20))
            sf.write(tmp, y.astype(np.float32), SR, subtype='FLOAT')
            I, tp = measure(tmp)
            print(f'pass {it}: gain {gain_db:+.2f} dB → {I:.2f} LUFS, true peak {tp:.2f} dBTP')
            if abs(I - target) < tol and tp <= ceiling:
                ok = True
                break
            gain_db += target - I
    finally:
        tmp.unlink(missing_ok=True)
    if not ok:
        raise RuntimeError(f'mastering did not converge: {I:.2f} LUFS (target {target} ± {tol}), '
                           f'true peak {tp:.2f} dBTP (ceiling {ceiling}) after 6 passes; {path.name} not written')
    sf.write(path, y, SR, subtype='PCM_24')
    return I, tp
