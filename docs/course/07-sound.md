# Lesson 7: Sound

**Two paths.** A supplied track must be *analyzed*, with beat and onset detection that can be wrong. A synthesized score *knows* its grid, so `beats.json` is ground truth, written from the timeline's BPM and meter. Every score here is synthesized in `lib/synth.py`, with oscillators, filters, a reverb send, a 4× oversampled true-peak limiter, and mastering that measures the result with ffmpeg's EBU R128 meter.

**Why the −1 dBTP margin exists.** The limiter ceiling is −1.6 dBFS, and the WAV peaked at −1.61. After AAC encoding, the MP4 measured −1.5 dBTP: the codec added overshoot. Always measure the final file.

**The phone test.** The bass roots sit at 41–65 Hz, which phone speakers can't reproduce. A 150 Hz high-pass dropped the mix **2.9 LU**. Muting sources one at a time showed **the kick**, not the bass, held most of that energy. Fixes:
- harmonics on the bass
- a shorter, higher-ending kick with a click
- a slightly louder pad

The drop became **1.7 LU**, and it sounded better on a real phone.

**Claude can't hear, but it can see.** `check.py` now writes a spectrogram and a waveform image for Claude to read, plus clipping count, DC offset, crest factor and the small-speaker drop. The final judge is still a human listening on a phone and headphones.

**Fact-check of the article**
- ❌ `downbeats = beats[::4]` assumes 4/4 and a correct phase; `beat_track` doesn't find downbeats. Florios is in 3/4.
- ❌ `sin(2π(600 + 900t)t)` sweeps at 600 + **1800**t Hz. Build the phase with a cumulative sum, as `synth.py` does.
- ⚠️ `peak_pick(delta=0.5)` on an unnormalized onset envelope is an arbitrary threshold.
- ⚠️ `sfx.mjs` hard-clips overlapping sounds, with no limiter or loudness target.

**A tautology I removed.** "sfx ↔ cues 0.00 ms" compared the cue list against itself. It's now labeled *internal consistency*. The real sync test measures visual changes in rendered pixels against cue times.
