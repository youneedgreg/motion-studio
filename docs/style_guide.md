# Style guide — from `refs/launch.mp4`

The grammar of the reference, written so it can be reused for other content. Source: 1920×1080, 60 fps, 15.125 s.
Evidence: `refs/launch/frames/` (frame `f_N` = (N − 1) × 0.5 s), full-resolution crops of the type,
direct seeks around every transition, per-frame pixel change, `refs/launch/beats.md`, `docs/palette.json`.

**Marked `GUESS`:** anything read by eye rather than measured. Hex values are sampled from frames unless marked.

---

## 1. Palette

### Backgrounds (from `palette.json` → `dominant`)
| Role | Hex | Evidence |
|---|---|---|
| Card / UI surface (white cards, editor) | `#fafafa` | dominant #1, 26%; sampled card `#fcfcfc`, editor `#ffffff` |
| Gradient, warm corner (top/bottom-left) | `#f4e4e2` | dominant #2, 17%; sampled `#f5ece8` |
| Gradient, cool corner (centre-bottom/right) | `#ebe6f4` | dominant #3, 12%; sampled `#ece2f8` |
| Gradient mid / neutral | `#e9e6e8` | dominant #4, 9% |
| Gradient, pale lavender | `#f0eef4` | dominant #5, 4% |

The title and end-card backgrounds are a soft two-corner gradient: blush top-left → lavender lower-centre → near-white right.
It's never a flat colour and never dark, apart from the black video preview inside the editor UI.

### Text
| Role | Hex |
|---|---|
| Headline ink | `#171717` (sampled in letter strokes; `#0c0c0c` in `dominant` is mostly the black preview panel) |
| Caption / secondary line | ≈ `#595055` warm mid-grey (GUESS: sampled through anti-aliasing) |
| Text on saturated pills and fields | white `#ffffff`; on yellow, ink `#171717` |

### Accents (from `palette.json` → `accents`)
Measured values come out darker and duller than the real colours because of shading, shadows and chip edges. Where the video labels its own colours on screen, those labels are given as the likely true values.

| Role | Measured | Likely true | Used for |
|---|---|---|---|
| Hero accent (orange-red) | `#dd6145` / sampled pill `#f3502a` | `#FF5A1F` (labelled in video) | Mascot, CTA pill, "builds" pill, first colour field |
| Yellow | `#b79b1a` | `#F5C518` (labelled in video) | Chips, last colour field (with ink text) |
| Blue | `#3c89e8` / `#548cdc` / `#569cf4` | ≈ `#2A8CFF` (GUESS from a partly hidden label) | Send button, playhead, "talk" pill, third colour field |
| Purple | `#7f40c9` | — | Chips, timeline clips, second colour field |
| Green | sampled pill `#62db83` (not in the top 10) | — | "tweak" pill, "Scrub to any frame" callout |
| *(not an accent)* | `#d18481` | — | Edge of the blush background gradient; just clears the 0.35 saturation cutoff |

**Rule the reference follows:** neutrals carry the frame, and accents only appear on small objects (chips, pills, buttons) until the colour-field run (11.28–13.13 s). That run is the only time an accent fills the screen.

---

## 2. Type

| Use | Family | Weight | Case | Tracking | Notes |
|---|---|---|---|---|---|
| Headlines ("Say it.", card titles, field words) | Neo-grotesk; looks like **Inter Display** (GUESS: double-storey `a`, straight `y` tail, slanted `t` top) | ExtraBold–Black, ~800–900 (GUESS) | Sentence case, **always ends with a period** | Tight, about −2 to −4 % (GUESS) | Centred. Very large: the title is ~25 % of frame height, and field words run edge to edge and get cropped |
| Pill / chip labels | Same family | Bold–ExtraBold (GUESS) | Sentence case for phrases; lowercase filenames; quoted user requests in curly quotes | Normal | White on colour, ink on yellow and white |
| Subtitle under a card title | Same family | Medium (GUESS) | Sentence case | Normal | Mid-grey, ~⅓ of the title size |
| Caption on end card | Same family | Semibold (GUESS) | Sentence case | Normal | Warm grey |
| Eyebrow above the logo | Same family | Semibold (GUESS) | ALL CAPS | Wide, about +15–20 % (GUESS) | Small, grey |
| Product UI text | The product's own UI font, small | — | — | — | Never enlarged, always read through callouts |

Two families at most: one grotesk for everything, plus the product's own UI type inside screen captures.
The wordmark is a custom rounded geometric face, the brand's own logo. It isn't part of the transferable grammar.

---

## 3. Pacing

From `refs/launch/beats.md`:

| Beats | Length | Notes |
|---|---|---|
| 1–6 (setup and product) | 1.63–1.92 s, typically ~1.85 s | One idea per beat |
| 7 | ~1.0 s | Short pill payoff |
| 8–11 (list) | 0.45, 0.467, 0.467, 0.467 s | One word per field, beat-locked (≈ 128 BPM if those are beats; unverified against the audio) |
| 12 (end card) | 1.99 s | Held to the end |

- **Inside every beat, something new lands about every 0.2 s** (~12 frames): a chip, a word, a UI step ticking in. Beats feel busy, but each beat has only one subject.
- **Transitions (11):**
  - 4 zooms: a blur-zoom at ~1.85, a fly-through at 3.77, a camera push-in at 7.28 and a pull-back at ~10.25.
  - 2 pushes: a slide-up at 5.40 and a pan at 9.15.
  - 4 circle wipes: 11.28, 11.73, 12.20 and 12.67.
  - **Exactly one hard cut**, at 13.133, into the end card. The hard cut is saved for the sign-off.
- **No morphs** in the strict sense. The closest are the circle wipes, where the outgoing title scales up and blurs as the new colour circle grows from the centre.
- **Structure:** hook object (1 beat) → promise headline + input (1) → "here's what it reads" card (1) → product UI, three camera stops (3) → three-pill summary (1) → four-word rapid list (4 × 0.47 s) → hard cut to logo end card.

---

## 4. Camera, texture, text in and out

### Camera
- **One continuous virtual camera** moves over large canvases, especially the product UI. Beats 4–7 are camera stops on a single editor canvas, joined by a push-in, a pan and a pull-back rather than cuts.
- **Within a beat the camera never stops:** slow drift or creep-in, e.g. drifting right along the timeline from 7.5 to 9.0.
- **Fast camera moves get motion blur:** the blur-zoom at 1.85, and the accelerating push-in from 3.60 to 3.75 that flies straight through into the next shot.
- **UI is shown in 3D perspective:** a tilted tray in beat 3, and the editor tilting as it rises in at 5.40.
- **Depth of field:** foreground pills sit sharp over a dimmed, blurred UI (10.3–11.2).

### Texture
- **Dot grid** on the gradient backgrounds: faint darker dots, spacing about 30 px (GUESS: read by eye, not measured).
- **No film grain:** the high-frequency residual in flat areas is about 1 level of 255, which is compression noise.
- **Pills and chips are 3D-extruded:** a darker side band, a light top-edge highlight and a soft long drop shadow, never a glow. They sit at slight random rotations of about ±3–8° (GUESS).
- **Colour fields:** a wallpaper of tilted (~−12°, GUESS) tone-on-tone chips carrying product vocabulary (filenames, hex codes, tool names) behind the big word.

### How text enters
- **Headlines build word by word, about 0.2 s apart.** Each word rises a little and goes from pale grey to full ink, which is an opacity/blur fade combined with a rise.
- **Card titles reveal left to right from blur** ("brief" at 3.8–4.1).
- **Chips and pills pop in** with scale overshoot, landing tilted. Some fly in along an arc.
- **Inputs type character by character**, and the send button changes colour when the line is complete.
- **UI step lists tick in one row at a time**, each with a status dot.

### How text exits
- **Text almost never animates out on its own.** It leaves with the camera: zoomed through, pushed off, or covered by the next circle wipe.
- **In wipes, the outgoing word scales up and blurs** as the new field expands.
- **End card:** the logo scales down from oversized and translucent into place, then the caption and CTA pill land.

---

## 5. Conflicts with this repo's house style (CLAUDE.md)

The reference breaks several house rules. Anything built from this guide has to choose, so these are listed openly rather than resolved silently:

| House rule | Reference does |
|---|---|
| Banned: centred title on gradient | Beats 2 and 12 are exactly that |
| Banned: everything fading in | Headline words and card titles fade from grey/blur to ink |
| One accent colour unless the brief says otherwise | Five accents (orange, yellow, blue, purple, green) |
| Default 1080 × 1920 | 1920 × 1080 |
| Something new every 2–4 s | Something new every ~0.2 s (stricter than required, no conflict) |

`docs/shotlist.md` gives a proposed resolution for each conflict, for you to approve.
