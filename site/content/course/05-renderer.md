# Lesson 5: The render engine

**What `render.mjs` does that the article's version doesn't**
- **Network sandbox:** every request is served from disk under a fake origin, and anything else is blocked and fails the render.
- **Parallel workers:** six pages render interleaved frames. That's only valid because `seek(t)` is pure. Proof: `--workers 1` and `--workers 6` gave **720/720 identical frame hashes**.
- **Consistent Chromium:** forced sRGB, no font hinting, no LCD text, CPU rasterization.
- **Ready signal:** a `window.filmReady` handshake after explicit `document.fonts.load()`. `fonts.ready` alone misses fonts that only a canvas uses.
- **Exclusive end frame:** loop-correct by construction.

**Four bugs found in audit and fixed**
1. `new URL(import.meta.url).pathname` keeps `%20`, which breaks paths with spaces. Fix: `fileURLToPath`.
2. `p.startsWith(ROOT)` lets `motion-studio-secrets/` through. Fix: `ROOT + path.sep`.
3. **Color.** `-colorspace bt709` only *tags* the file; the RGB→YUV math is a separate step. Test: on ffmpeg 6.1, `#10b981` decoded as **(0, 163, 126)**, visibly duller. ffmpeg 9 was fine. Fix: explicit `scale=out_color_matrix=bt709`, plus `setparams` (Claude found PNG frames arrive tagged "unspecified").
4. Page errors kept rendering broken frames. Fix: fail fast with the frame time.

**Fact-check of the article**
- ⚠️ `tmix` with 4 subframes is a 270° shutter, looking forward from each frame time; film convention is 180°.
- ⚠️ The article's spring treats overdamped as critical (see Lesson 6).
- ✅ The Remotion and HyperFrames commands match their docs. HyperFrames uses Puppeteer, not Playwright.
