---
name: motion-film
description: "Make a code-rendered motion video in this studio (launch film, product reel, UI morph loop, animated explainer). Use when the user asks for a motion video, launch film, reel, animated ad or explainer."
---

# motion-film

You will make a film as a program. A headless browser paints each frame with `window.seek(t)`, and ffmpeg encodes the frames.
`CLAUDE.md` holds the studio rules: the render contract, the house style and banned defaults, sound targets and the review loop.
Those rules apply in full. This skill is the pipeline that sits on top of them.

Opus reads text, images and PDFs. It cannot watch video or hear audio. Everything you "see" of a film comes from
stills, contact sheets, spectrograms and numbers. Plan the checks around that.

Files used in this skill:
- [brief.md](brief.md): director's brief template, including the unattended run mode
- [spec.md](spec.md): state-list template for morphs and UI loops
- [critique.md](critique.md): the rubric for the fresh reviewer

## 1 · Inputs

If the user has a filled-in brief (from `brief.md`), use it. Otherwise ask for everything missing, all in **one** round
with AskUserQuestion. Don't ask a question a file can answer: check the product repo, site and `assets/` first.

| Input | Why it matters | Default if the user says "you decide" |
|---|---|---|
| One-line goal | The critic scores against it | Propose one and say it back |
| Audience and where it plays | Phone feed, landing page, or talk | Phone feed, sound off at first |
| Product and brand source | Colours come from CSS or design tokens, **never from video frames** (H.264 shifts them) | The live site's CSS |
| Data source | Every name and number shown on screen | A **fictional** demo seed. Never real customer records |
| Format | Width × height (even numbers), duration, fps, loop or not | 1080 × 1920, 60 fps |
| References: 2–3, and what to take from each | With one reference the film copies its structure shot for shot | Ask. Take grammar, never content, logos, characters or copy |
| CTA / end card | What the viewer should do | Product name + domain |
| Sound | A supplied track must be *analysed* and can be wrong; a synthesized score knows its grid | Synthesize |
| Deliverables | Extra cuts, stills, sizes | One mp4 plus the check artifacts |
| Run mode | Attended, or `Run mode: unattended` | Attended |

Some things you never do yourself:
- **Sign-ins:** if a demo needs a login, open the browser pane and let the user sign in.
- **Secrets:** never read `.env*`, and never type a password.
- **Fonts:** if a brand font isn't in `assets/fonts/`, download it only from its official source under a licence that allows embedding (OFL or similar). Keep its licence file next to it.

## 2 · Plan, then wait

1. Create `films/<film>/` and write `films/<film>/timeline.json`, with these fields:
   - `title`, `width`, `height`, `fps`, `duration`, `bpm`, `beatsPerBar`, `loop`
   - `cues`: `[{ "beat": n, "name": "...", "sfx": "..." }]`, one per visible event that has a sound
   - for morph and UI-loop films: `states` (from `spec.md`), `container` `{cx, cy}` and `ground` (hex)
   - for scene films: `scenes`
2. Write `films/<film>/shotlist.md`. List each beat with its time, what's on screen, how it comes in, what it's taken from (reference or product), and the copy.
   - Something new happens every 2–4 s.
   - Check the shotlist against every banned default in `CLAUDE.md`, and name any near misses.
3. Morph or UI loop: fill in `spec.md` as `films/<film>/spec.md`. Numbers, not adjectives.
4. **Show the timeline, the shotlist and the state table, then stop and wait for an OK.** Don't write film code before it.
   - Exception: under `Run mode: unattended`, continue, and log every choice you'd have asked about in `films/<film>/decisions.md`. Rules are in `brief.md`.

## 3 · Build

### Score: `films/<film>/score.py`

- Import from `lib/synth.py`: `Mixer`, `marimba`, `bell`, `whoosh`, `sweep_sine`, the filters, `noise` and `master`.
- **Randomness:** every random draw is seeded per sound with `seed_for('<film>', 'what', index)`. Never seed by draw order.
- **Beats come from ground truth.** `score.py` writes `beats.json` from the timeline's BPM and meter:
  - `beats`, `downbeats`, `kick`, `snare`
  - `sfx` as `{t, name, sfx}`, with `t = cue.beat × 60 / bpm`
  - Never detect beats from your own score. Never use `beats[::4]` as downbeats; meters aren't always 4/4 (Florios is 3/4).
- **Supplied track:** analyse it (librosa beat and onset) and write `beats.json` from that. Mark it as *detected, not ground truth*, and spot-check the onsets against the waveform image.
- **Sweeps:** build the phase as a cumulative sum of frequency. `sin(2π(f0 + k·t)·t)` sweeps at twice the intended rate.
- **Phone speakers:** below about 150 Hz nothing plays. Give bass and kick harmonics and a click so they survive (see `films/florios-morph/score.py`).
- **Loops:** wrap reverb tails around the loop point.
- **Mastering:** `master(mix, path)` measures with ffmpeg EBU R128 and raises if it misses −14 LUFS or the −1 dBTP ceiling. Don't catch that error.
- Run it with `.venv/bin/python films/<film>/score.py`.

### Film: `films/<film>/index.html` (plus a `.js` module if it's large)

- **`window.seek(t)` is pure:**
  - every value is computed from `t`
  - no `x += …`, no caches that change the output, no wall clock
  - randomness only from `rng(seed)` (`lib/rng.js`), created inside the draw call
  - `.claude/hooks/check-determinism.mjs` runs after every edit and flags violations. Fix the code; don't argue with the hook.
- **Ready signal:**
  - `await document.fonts.load('<weight> <size> <Family>')` for every face and weight you use (`fonts.ready` alone misses canvas-only fonts)
  - then `await document.fonts.ready`
  - decode every image
  - `window.seek(0)`
  - then `window.filmReady = true`
- **Preview loop:** the requestAnimationFrame preview goes inside `if (!navigator.webdriver)`, and every line of it is marked `// preview-only`.
- **Motion** (`lib/motion.js`):
  - Springs come from the presets SNAPPY, DEFAULT, HEAVY, CAMERA and PLAYFUL, or `spring(dt, freq, damp)`.
  - Retargeting uses **`springTrack(keys, { freq, damp, period })`**, one track per property. Velocity carries over, so there's no kink.
  - Use easing (`ease.*`, `prog`) only when a move must land exactly on a beat.
  - The PLAYFUL preset (16 % overshoot) is still bouncing at the next beat. Don't use it for UI unless the brief asks for bounce.
  - On a loop, pass `period: duration` so value **and velocity** match at the seam.
- **Colour:** interpolate fills in OKLab (`lib/color.js`). RGB goes muddy at the midpoint.
- **Content timing:** content enters after a morph starts and leaves before the next morph starts.
- **Text masks:** cover the font's full descent (`fontBoundingBoxDescent`) plus a few px, so settled text is never clipped.
- **Hooks for the checks:**
  - `window.cueBox(name)` returns the `[x, y, w, h]` of the element that cue moves. Without it, sync is measured over the whole frame, which is weaker.
  - `window.filmDebug = { noMasks, noClip }` turns masks and clipping off for the text check.
  - On loops, `window.filmProbe()` returns `{ loopValue, loopVelocity }`: the largest `|f(D) − f(0)|` over every track.
- **Assets:** everything loads from `./assets` or the film folder. Any other request fails the render.
- **Loops:** render frames `0 … N−1`. The state at `t = D` equals `t = 0`, but **`t = D` is never rendered**; a duplicated frame hitches.

## 4 · Verify

1. Render and run the objective checks:
   ```
   .venv/bin/python films/<film>/score.py
   .venv/bin/python tools/check.py films/<film>
   ```
   `check.py` renders with `node render.mjs` and writes `out/<film>.mp4`, `out/<film>-check.txt`, `-contact.png`, `-spectrum.png` and `-wave.png`. It checks:
   - **Video:** determinism (two 2 s renders, framemd5), the loop seam, per-cue visual sync against each sound, state geometry (±2 px), and text visibility with masks off.
   - **Audio:** loudness, clipping, DC offset and crest factor, and the small-speaker drop.
   It exits 1 on any FAIL, OFF or JUMP.
2. Make the phone sheet: one frame per second at phone size. Pick the tile grid so it covers the whole duration.
   ```
   ffmpeg -y -i out/<film>.mp4 -vf "fps=1,scale=360:-2,tile=6x2" -frames:v 1 out/<film>-phone.png
   ```
3. **Open and look at** the contact, phone, spectrum and wave images with Read. Look for:
   - near-empty frames
   - text too small at 360 px wide
   - clipped glyphs
   - banned defaults
   - a hook that isn't readable in the first 2 s
4. Everything must read `OK`. If the small-speaker drop is over 2 LU, fix the mix.

**Never edit a check to make it pass.** If a check is wrong:
- Show the evidence: a frame, a number, or a minimal case.
- Fix the check in its own commit with that evidence, and tell the user.
- Under `Run mode: unattended`, write it to `BLOCKED.md` instead.

Remember that **a check only proves what it measures.** Geometry checks saw boxes, not clipped text. A self-comparison once reported 0 ms "sync". When you find a failure no check caught, add a check for it.

## 5 · Critique: a fresh reviewer, at most 3 rounds

Models grade their own work leniently, so you don't score your own film. Each round:

1. **Spawn a fresh subagent** (Agent tool, general-purpose). Give it only:
   - the brief (or the inputs table from step 1) and the one-line goal
   - the paths to `out/<film>-contact.png`, `-phone.png`, `-spectrum.png`, `-wave.png` and `-check.txt`
   - the rubric in `critique.md`, pasted into the prompt
   Don't give it your code, your reasoning or your own opinion of the film.
2. Save its answer to `out/<film>-critique-<round>.md`.
3. Fix the top three problems. Then repeat step 4 (Verify): **all checks OK again** before the next round.
4. Stop when every score is 8 or higher, or after round 3, whichever comes first. Start each round with a *new* subagent, not a resumed one.

## 6 · Deliver

Show the user:
- **The film:** `out/<film>.mp4`.
- **Every `out/<film>-*` artifact:** `-check.txt`, `-contact.png`, `-phone.png`, `-spectrum.png`, `-wave.png`, and `-critique-*.md`.
- **The check summary:** one line per check, with its numbers.
- **The final scores from the last critique round**, each with its problem and timestamp.
- **Ranked weaknesses**, worst first, each with a timestamp. Include what **only a human can judge**:
  - how the music actually sounds on a phone and on headphones
  - taste, humour and brand feel
  - whether the copy is true for the product
- **Under unattended mode:** `decisions.md` and any `BLOCKED.md`.

Commit only when the user asks. Don't add attribution lines unless the user's settings ask for them.
