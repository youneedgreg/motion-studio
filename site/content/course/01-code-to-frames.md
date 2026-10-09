# Lesson 1: Code → frames

**Core idea.** Claude Opus 5.5 can't output video. It writes a program, and a headless browser plus ffmpeg turn that program into frames. The program exposes one function, `window.seek(t)`, which paints the exact frame for time `t` and remembers nothing between calls.

**The six enemies of determinism**

| Enemy | Example | Fix |
|---|---|---|
| Wall-clock time | `requestAnimationFrame`, `setTimeout`, `Date.now()`, CSS transitions | Derive everything from `t` |
| Carried state | `x += 3` every frame | Compute `x` from `t` |
| Unseeded randomness | `Math.random()` | Seeded PRNG (mulberry32) created inside the draw call |
| Float accumulation | `t += 1/60` | `t = frameIndex / fps` |
| Assets not loaded | Fonts still loading at frame 0 | `document.fonts.load()` for each face, then `fonts.ready` |
| Environment | Different GPU, OS or browser | Pinned Chromium and fixed rendering flags |

**Fact-check of the article**
- ✅ Opus 5.5 was released 22 Sep 2026. It accepts **text, images and PDFs** and outputs text, with no video or audio input. "Show it a video" therefore means extracting frames.
- ⚠️ "Every video is a program": not all of them. One featured music video used a video model for base shots and traced over them in code.
- ⚠️ "Called through eval": Playwright's `page.evaluate` runs code over the DevTools protocol, not JavaScript `eval()`.
- ❓ "Opus skips Remotion/HyperFrames even when installed" is one user's observation. If you want a framework, name it.
- 💬 "The prompt is 10%, the harness is 90%" is a heuristic, but directionally right.

**Second strategy (not in the article).** Instead of a pure `seek(t)`, you can seek an animation engine (WAAPI `currentTime`, GSAP `seek`) or fake the browser clock. HyperFrames works this way.
