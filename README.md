# motion-studio

**Motion graphics made as programs: every frame is a pure function of time, rendered by a headless browser, scored in code and checked by numbers, not by eye alone.**

[![safarios-v2: one honeymoon booking, from a website request to fully paid (16:9, 32 s, with sound). Click to play.](media/safarios-v2-poster.jpg)](media/safarios-v2.mp4)

*safarios-v2, 32 s. One honeymoon booking goes from a website request to fully paid in [Safari OS](https://safari-os-website.vercel.app), a back office for safari tour operators. Click the frame to play it (sound on).*

---

## The story

Claude-made motion videos were everywhere on my X feed: launch films, product reels and UI morphs, all rendered from code. I decided to learn how to make them properly.

I learned from [one X article](https://x.com/0xMovez/status/2104216919033192746) about building a motion design studio with Claude, and used it as a guide, not as gospel:
- I checked every claim against primary sources: Anthropic's docs, the tools' own repos, and the posts the article cites.
- Where I could, I tested the claim by running code.
- Anything wrong or unverifiable got corrected or flagged. For example, Claude can't watch video or hear audio, CLAUDE.md is context rather than enforcement, and the article's "default" spring has 0 % overshoot, not "a hair".

This repo is what got built over eight lessons, one piece per lesson. Each lesson, with its fact-check, is in **[docs/course/README.md](docs/course/README.md)**.

The recurring lesson: **a check only proves what it measures.** Several bugs passed every automated check until a person looked, or until a new check was written.

---

## What's inside

```
render.mjs                 frame-accurate renderer (Playwright Chromium → ffmpeg)
lib/motion.js              easing, closed-form springs, spring tracks
lib/color.js               sRGB ↔ OKLab, for perceptual colour mixes
lib/rng.js                 seeded PRNG (mulberry32)
lib/synth.py               synthesis + mastering for scores (numpy/scipy, 48 kHz)
tools/check.py             objective checks for a rendered film
tools/test_motion.mjs      spring maths vs the ODE
tools/sheet.py             contact sheets
CLAUDE.md                  studio rules: render contract, house style, sound targets, review loop
.claude/hooks/             the determinism hook
.claude/skills/motion-film the /motion-film skill
films/<name>/              one folder per film: index.html (+ film.js), timeline.json, score.py, beats.json
docs/                      briefs, shot lists, style guide, the course
```

### `render.mjs`, the renderer

- **How a frame is made:** the film is a web page that exposes `window.seek(t)`. The renderer opens it in Playwright's Chromium, calls `seek(frameIndex / fps)` for every frame across parallel workers, takes a screenshot, and streams the PNGs in order into ffmpeg.
- **Encoding:** H.264 `yuv420p` at CRF 16, `+faststart`, with BT.709 colour set explicitly.
- **No network:** every request is served from disk, and anything off-origin is aborted.
- **Flags:**
  - `--format 9x16` picks a viewport from `timeline.json`'s `formats`.
  - `--from/--to` render a range.
  - `--stills 1.5,3.0` render single frames.
  - `--serve` starts a live preview.
  - `--cue-boxes` and `--text-audit` export measurements for `check.py`.

### `lib/`

| File | What it gives a film |
|---|---|
| `motion.js` | `clamp`, `lerp`, `prog`, the `ease` set; `spring(dt, freq, damp)` in closed form (no per-frame integration, so no state carried between frames); presets `SNAPPY`, `DEFAULT`, `HEAVY`, `CAMERA`, `PLAYFUL`; `springTrack(keys)`, which retargets a spring through keyframes, with optional looping |
| `color.js` | `hexToOklab` / `oklabToCss`, so fills blend perceptually, not through muddy RGB midpoints |
| `rng.js` | `rng(seed)`, mulberry32. Create it inside the draw call, so the same `t` always gives the same frame |
| `synth.py` | Oscillators, envelopes, filters, `marimba`, `bell`, `whoosh`, a `Mixer` with a reverb send, and `master()`, which glues, limits to a true-peak ceiling and normalises to −14 LUFS, measured with ffmpeg's `ebur128` |

### `tools/check.py`: what each check proves, and what it doesn't

Run it as `.venv/bin/python tools/check.py films/<name> [--format 9x16]`. It renders the film and writes `out/<name>-check.txt`, plus a contact sheet, a spectrogram and a waveform. It exits non-zero when any line says `FAIL`, `OFF` or `JUMP`.

| Check | Proves | Doesn't prove |
|---|---|---|
| **determinism** | Two renders of 0–2 s give identical frame hashes (`ffmpeg -f framemd5`) | Anything after 2 s; the same result on another machine, GPU or Chromium version; that the live preview matches the render |
| **loop seam** (looping films) | The last frame is no bigger a jump from the first than the film's 95th-percentile frame-to-frame change | That motion *continues* across the seam (speed can still jump); the loop-state probe covers that for morph films |
| **contact sheet** | Nothing by itself: it's one frame per beat for a person, or a model, to *look at* | Motion quality. Stills can't show easing, judder or timing |
| **loudness** | Integrated loudness within ±1 LU of −14 LUFS, and true peak ≤ −1 dBTP, measured on the final mp4 | That the mix sounds good, is balanced or suits the film |
| **cue sync** | For every cue in `timeline.json`, the first visible pixel change in that cue's element lands within one frame of its time | That the right sound plays there, or is audible; anything not listed as a cue. The film reports its own element boxes, so a wrong box gives a wrong answer |
| **states, loop state** (morph films) | Each state's container is within ±2 px of its spec table (size and corner radius); every animated track's value and velocity match at the loop point | Anything inside the container |
| **text visible** | At each scene's settle time, the frame is pixel-identical with the text masks off, and with the container clip off (within 8 levels): no text at rest is clipped | Text mid-motion; text overlapping other elements; contrast |
| **text size** | The smallest readable string on screen is at least the format's `minTextPx` | Strings the film doesn't register as readable; contrast, or legibility at real phone size |
| **audio onsets** | Report only: how close the mix's onsets sit to the 16th-note grid | Pass or fail; sync to the picture |
| **sfx placement** | `score.py` put every sound effect exactly at its cue's time (internal consistency) | Measured audio–visual sync. Cue sync measures the picture side |
| **clipping, astats** | No decoded sample at or beyond full scale; reports DC offset and crest factor | Distortion added before the limiter |
| **small speaker** | Report only: the loudness drop after two 150 Hz high-passes (a phone-speaker proxy) | How it really sounds on a phone. It isn't gated; the briefs set their own target |

`tools/test_motion.mjs` integrates the spring ODE at dt = 1e-5 and checks that every closed form in `motion.js` matches it to within 1e-3. CI (`.github/workflows/films.yml`) runs the hook, the spring tests and a compile pass on every PR, plus the full `check.py` for `safarios`, `florios-morph` and `reel`.

### The determinism hook

`.claude/hooks/check-determinism.mjs` runs after every Write or Edit in Claude Code (configured in `.claude/settings.json`).
- **What it rejects:** lines in render code that use `Math.random()`, timers, `requestAnimationFrame`, `Date.now()` / `performance.now()` or CSS `transition`.
- **What happens:** exit code 2 sends the violation back to Claude, which rewrites the line.
- **Why it exists:** CLAUDE.md is context, not enforcement. The hook is the enforcement.
- **Limits:**
  - It's a line-by-line pattern match. It can't see state carried between frames or values read back from layout.
  - The `// preview-only` exemption works on trust.
  - The determinism check in `check.py` is the backstop.

### The `/motion-film` skill

`.claude/skills/motion-film/` is the whole pipeline as a Claude Code skill:
1. Collect a brief in one round of questions (`brief.md`).
2. Plan a shot list and wait for approval.
3. Build the score and the film.
4. Run `check.py` and look at the stills.
5. Have a **fresh reviewer subagent** score it against `critique.md`, for at most 3 rounds, stopping when every score is 8 or higher.
6. Deliver, along with what's still weak.

It also has an unattended mode that logs its choices to `decisions.md`.

---

## Quick start

**Requirements:** macOS or Linux, Node 22+, ffmpeg with libx264 (on your PATH), Python 3.14 (the version CI uses), and git. Playwright's Chromium is installed below.

```bash
git clone https://github.com/youneedgreg/motion-studio.git
cd motion-studio
npm ci
npx playwright install chromium
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

Render and check an example film (a 12 s morph loop):

```bash
.venv/bin/python films/florios-morph/score.py
node render.mjs films/florios-morph
.venv/bin/python tools/check.py films/florios-morph
```

- **Outputs:** `out/florios-morph.mp4`, `out/florios-morph-check.txt` and `out/florios-morph-contact.png`.
- **Score first:** `score.wav` isn't committed, so each film's `score.py` runs before its first render.
- **Order:** `check.py` re-renders the film itself, so you can skip the `node render.mjs` step when you only want the checks.

Other formats, a live preview and the spring tests:

```bash
node render.mjs films/safarios-v2 --format 9x16
node render.mjs films/florios-morph --serve
node tools/test_motion.mjs
```

`--serve` prints a localhost URL; open it to watch the film loop in real time. A new frame is painted every display refresh, so the preview is not frame-exact.

### Make a film with `/motion-film`

Open the repo in [Claude Code](https://code.claude.com/docs/en/skills) and type:

```
/motion-film a 15 s launch reel for <your product>, 9:16, for an X feed
```

The skill asks for whatever the brief is missing, then plans, builds, checks and critiques the film.

---

## Films

The videos are in [`media/`](media/). Click one to play it on GitHub. The check results come from `tools/check.py` with the current code.

| Film | Video | Format | Checks |
|---|---|---|---|
| **safarios-v2**: one honeymoon booking, request → paid; circle-wipe run; end card | [16:9](media/safarios-v2.mp4) · [9:16](media/safarios-v2-9x16.mp4) · [1:1](media/safarios-v2-1x1.mp4) | 1920×1080, 1080×1920, 1080×1080 · 60 fps · 32 s | All pass in all three formats. 51/51 cues within 1 frame; −14.1 LUFS / −1.2 dBTP; smallest text 56 / 48 / 40 px; 1.6 LU small-speaker drop |
| **safarios** (v1): Safari OS module tour | [16:9](media/safarios.mp4) | 1920×1080 · 60 fps · 20 s | All pass. 48/48 cues within 1 frame; −14.0 LUFS / −4.0 dBTP. No text checks: v1 has no settle times or text audit. **4.7 LU** small-speaker drop; v1's lessons are listed in the v2 brief |
| **florios-morph**: one container morphs through eight UI states, looping | [9:16](media/florios-morph.mp4) | 1080×1920 · 60 fps · 12 s loop | All pass. 15/15 cues within 1 frame; 8/8 states within ±2 px; loop value and velocity match exactly; −14.1 LUFS / −1.6 dBTP; 1.7 LU small-speaker drop |
| **reel**: the studio's first film, a 96 BPM showreel in six match-cut bars (type, shape, weight, depth, curves, name) | [9:16](media/reel.mp4) | 1080×1920 · 60 fps · 15 s loop | All pass. 28/28 cues within 1 frame; −13.9 LUFS / −4.0 dBTP; loop seam 0.64 vs 95th pct 12.2. **4.0 LU** small-speaker drop (made before the phone-proof mix) |

The SafariOS films show fictional demo data only. The briefs and shot lists are in [`docs/`](docs/).

---

## Honest limits

- **Claude can't hear, and can't watch video.** Claude reads text, images and PDFs. Everything it knows about a film comes from stills, contact sheets, spectrograms and numbers. Sync is measured, not listened to, and the mix has never been heard by the model that made it.
- **Checks only prove what they measure.** A film can pass every line of `check.py` and still be dull, badly paced or off-brand. The table above lists what each check leaves out. Several real bugs got through all of them until someone looked.
- **Human review is required.** The skill's fresh-reviewer critique is better than self-grading (models grade their own work leniently), but it is still a model looking at stills. Watch every film with sound on, on a phone, before it ships.

---

## Credits

- **The article this started from:** [0xMovez on X](https://x.com/0xMovez/status/2104216919033192746). Its claims are checked lesson by lesson in [docs/course](docs/course/README.md).
- **Anthropic's Claude Code docs:** [memory and CLAUDE.md](https://code.claude.com/docs/en/memory), [hooks](https://code.claude.com/docs/en/hooks) and [skills](https://code.claude.com/docs/en/skills).
- **Alternatives** if you'd rather use a framework than a bare `seek(t)`:
  - [Remotion](https://www.remotion.dev): React components rendered to video.
  - [HyperFrames](https://github.com/heygen-com/hyperframes): HTML compositions rendered with Puppeteer.
- **Fonts:** Inter, Fraunces and Geist, each under the SIL Open Font License 1.1. See [NOTICE.md](NOTICE.md).
- **Reference videos:** used for analysis only and not included. See [NOTICE.md](NOTICE.md).

## License

[MIT](LICENSE) for the code. The fonts in `assets/fonts/` keep their own OFL licences ([NOTICE.md](NOTICE.md)).
