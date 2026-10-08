# launch3.mp4: beats

Swivel, a browser tool for device-mockup videos. Source: 1920×1080, 30 fps, 42.72 s, −13.5 LUFS.

**Evidence:**
- **Frames:** 2 fps frames in `refs/launch3/frames/`, where `f_N` is exactly (N − 1) × 0.5 s.
- **Transition strips:** 10 fps strips around every transition.
- **Transition timing:** the per-frame pixel change at full rate. This video's median change is high (1.8) because the backgrounds are live footage, so the event threshold is 7.4.
- `~` marks a time read by eye (±0.1 s).
- On-screen copy is paraphrased, not transcribed.

**Palette** (`palette.json`):
- **Ground:** black `#050505` (18 %) and saturated blues (`#073cca`, `#1f3ce6`, `#0c69e2`).
- **Accent:** blue is the accent. The photographic scenes (pink flowers, ocean, desert dusk, moss) carry the rest of the colour and are not brand colours.

| # | Start | End | On screen | In via |
|---|---|---|---|---|
| 1 | 0.00 | 2.00 | A pixel (dot-matrix) typeface line. Its glyphs scramble through random characters and resolve (0.5–1.5). It sits over a photo of a flower field with a white monolith, which is revealed behind the line by 0.5 | Opens on the line |
| 2 | 2.00 | 3.03 | Flat blue ground. An outlined pill with pixel type is typed (2.1–2.6), and a row of flat app screens rises in from below, staggered (2.1–2.6). The pill text is then backspaced (2.9–3.0) | Hard cut (2.00, change 106) |
| 3 | 3.03 | ~4.1 | The same screens, closer and tilted, drifting | Punch-in: a hard cut to a tighter framing (3.03) |
| 4 | ~4.1 | 5.27 | Pull-back: the screens are now in 3D perspective, and a light streak sweeps across (4.17–5.13) | **Zoom out** (30 frames) |
| 5 | 5.27 | 8.13 | Black. A giant outlined 3D word sits behind a phone that rises through its centre (5.3–5.7). Small labels type on, and a caption cycles through device types (6.5–8.0). The phone rotates (7.43–7.87) | Blur dissolve (5.27–5.67, 13 frames) |
| 6 | 8.13 | 11.03 | **Same device, new world.** The phone holds roughly its place and angle while the world behind it changes: ocean waves (8.2), a flower field (9.3–9.4), a tree branch with falling leaves (10.4–10.6) | Hard cut (8.13, change 163), then two short whips (9.23–9.43, 10.43–10.57) |
| 7 | 11.03 | 13.30 | Black. A pixel-type counter runs from 2 to 28 (11.1–13.2) above a short line, with a row of device names below. Device thumbnails left and right swap with each count | Hard cut (11.03) |
| 8 | 13.30 | 16.30 | A laptop floating over a flower field. The camera dollies in (13.77–15.60) and the lid closes (15.5–16.2) | Hard cut (13.30) |
| 9 | 16.30 | 19.30 | A foldable phone in a desert at dusk unfolds (16.4–17.0). A control panel sits bottom-left, and the cursor changes a setting (17.5–19.0) | Hard cut (16.30) |
| 10 | 19.30 | 21.93 | Flat blue. Three lines of pixel type are typed, with the glyphs scrambling (19.4–21.5). A frame counter ticks in the top-right corner | Hard cut (19.30) |
| 11 | 21.93 | 24.93 | A tablet on a mossy hill against the sky. A side panel with the cursor changes a preset (22.5–24.5) | Hard cut (21.93) |
| 12 | 24.93 | 29.23 | A desktop app on a monitor over a blurred warm photo. The camera dollies left (24.93–26.17). A bold condensed caption is typed with letter scramble across the bottom (25.4–27.0). Two re-framings follow (27.03–27.27, 28.13–28.37) | Hard cut into a dolly (38 frames) |
| 13 | 29.23 | ~32.4 | Blue. A huge blurred wordmark sits behind a phone that rotates up into view (29.8–31.7). Stat chips float on both sides | **Dip to black** (29.23–29.43, 7 frames) |
| 14 | ~32.4 | 35.07 | Blue. A three-line all-caps pixel headline is built by scramble (32.5–34.0). Two pill tags appear at the bottom (33.5) | Cut (32.07) |
| 15 | 35.07 | 39.57 | A laptop on blue. The camera pulls back to show that the laptop is **inside the product's own editor** (35.5–36.5). It then pushes in to the timeline (37.0) and the inspector panel (38.0–38.8), and back out (39.0) | Hard cut (35.07), then a zoom-out reveal (screen within screen) |
| 16 | 39.57 | 42.72 | End card on glossy, inflated blue ribs: the app icon pops (39.7–39.8), the wordmark letters rise in (40.0–40.5), then the tagline (40.5) and a typed CTA line (41.5–42.0) | Hard cut (39.57) |

**Rhythm:** product shots run 2.6–3.0 s each (8.13, 11.03, 13.30, 16.30, 19.30, 21.93, 24.93: a steady ~3 s grid). Type-only beats are inserted between them as rests.

**Sound:**
- librosa reports 107.7 BPM, with a median inter-beat of 557 ms. The 3.0 s product grid is about 5.4 of those beats, so the grid doesn't land on the detected beat.
- The cuts' nearest onsets are −107 to +210 ms away. Sync to the music is **not shown**.
- Onsets run at 4.8/s overall and 5.6/s during the typing sections, which suggests typing SFX. This is unverified, because nobody has listened to it.
