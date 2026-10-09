# Lesson 6: Springs

**Why springs and not easing.** Both are pure functions of time. Springs win when a target changes mid-motion, because velocity carries over without a kink. Easing wins when something must end exactly on a beat.

**Physics.** `acceleration = ω₀²(target − x) − 2ζω₀·velocity`. The damping ratio ζ decides the character: below 1 overshoots, exactly 1 is the fastest approach with no overshoot, above 1 is slower. Overshoot = `exp(−πζ/√(1−ζ²))`.

**Bugs found**
- The old `spring()` returned **NaN for ζ ≥ 1** (divide by zero, square root of a negative). It now has exact closed forms for all three regimes.
- The article's default (k=170, d=26) has **ζ = 0.997 and 0% overshoot**, despite promising "a hair".
- The article's overdamped shortcut settles in **0.45 s** when the real spring takes **0.84 s**.

**`springTrack`.** Adds one spring per target change. Because the spring equation is linear, this exactly equals retargeting a real spring; a numerical simulation matched to within 0.00005. For loops, each pass's jumps sum to zero, so settled passes contribute nothing. The number of past passes kept is now computed from the decay rate, so slow springs on short loops still close.

**Presets (measured)**

| Preset | f | ζ | Overshoot | Settles (2%) |
|---|---|---|---|---|
| SNAPPY | 3.5 Hz | 0.85 | 0.6% | 0.19 s |
| DEFAULT | 2.2 Hz | 0.8 | 1.5% | 0.27 s |
| HEAVY | 1.4 Hz | 1.0 | 0% | 0.66 s |
| CAMERA | 1.2 Hz | 0.95 | ~0% | 0.70 s |
| PLAYFUL | 2.5 Hz | 0.5 | 16.3% | 0.51 s |

**ζ in pixels** (a 400 px grow): 0.5 overshoots by 64 px and is still bouncing at the next beat. 0.8 lands first, 6 px over, and settles by 2.05 s. 1.0 trails by 32 px at 1.80 s. Florios uses 0.8.

Tests live in `tools/test_motion.mjs`, which compares the closed form against an ODE simulation and runs in CI.
