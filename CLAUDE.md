# Motion studio rules

## Render contract
- Every film is a pure function of time: `window.seek(t)` paints frame t. The renderer passes t = frameIndex / FPS.
- No CSS transitions, setTimeout/setInterval, requestAnimationFrame, Date.now() or performance.now() in render code.
  The live-preview loop is the only exception and every such line is marked `// preview-only`.
- No state carried between frames. Randomness only from `rng(seed)` in lib/rng.js, created inside the draw call.
- Before frame 0: await document.fonts.ready and decode every image. No network requests during render; assets live in ./assets.
- Width and height must be even numbers. Default 1080x1920 at 60 fps.
- Render with `node render.mjs`. Encode H.264, yuv420p, CRF 16, -movflags +faststart.

## Look (house style)
- Banned defaults: centered title on gradient, everything fading in, corner labels and frame borders,
  glow on UI chrome, generic particle bursts, near-black ground with a single orange accent,
  condensed all-caps display type, monospace parameter readouts, technique-demo tiles
  (easing graphs, bounce trails), coloured-dot full stops.
- One display face, one UI face. One accent color unless the brief says otherwise.
- Something new happens on screen every 2 to 4 seconds.

## Sound
- Score and SFX are synthesized in code unless a track is supplied.
- You cannot hear audio. Verify sync numerically: compare cue times against beats.json,
  and measure loudness with ffmpeg's ebur128 filter.
- Target about -14 LUFS integrated, true peak at or below -1 dBTP.

## Before showing me anything
1. Objective checks: render 2 s twice and compare frame hashes (ffmpeg -f framemd5);
   check the loop seam if the film loops.
2. Render a contact sheet (one frame per beat) and look at it.
3. Score 1-10: hook in first 2 s, readability at phone size, motion quality, variety, brand accuracy, sound sync.
   List the 3 worst problems with timestamps. A score without a named problem doesn't count.
4. Fix and repeat until every score is 8+, at most 3 rounds. Then show me, listing what's still weak.

## Environment
- Python lives in ./.venv. Always run `.venv/bin/python` and `.venv/bin/pip` (never bare python/pip), since the venv may not be activated.
- Node project uses ES modules ("type": "module"). Seeded RNG is in lib/rng.js.
