# launch2.mp4: beats

Snatch, a macOS app that copies text from anything on screen. Source: 1920×1080, 30 fps, 57.32 s, −15.8 LUFS.

**Evidence:**
- **Frames:** 2 fps frames in `refs/launch2/frames/`, where `f_N` is exactly (N − 1) × 0.5 s.
- **Transition strips:** 10 fps strips around every transition.
- **Transition timing:** the per-frame pixel change at full rate. A single-frame spike is a hard cut; a run of frames is a move or a dissolve. Times are the first changed frame.
- `~` marks a time read by eye (±0.1 s).
- On-screen copy is paraphrased, not transcribed.

**Palette** (`palette.json`):
- **Ground:** near-white `#fafafa` (52 %) alternating with near-black `#0d0d0d` (29 %).
- **Accent:** one blue family only (`#3e68e5`, `#3051dc`, `#699ff5`), used in the app icon, the macOS wallpaper and selection highlights.

| # | Start | End | On screen | In via |
|---|---|---|---|---|
| 1 | 0.00 | ~2.25 | A desktop-like collage of ~20 small app cards (photos, notes, chat, receipts) on white, drifting. A small word appears in the centre ~1.5 s. | Opens on the collage |
| 2 | ~2.25 | ~5.5 | **Typed headline.** A small typed line (2.5) jumps to giant scale (2.83–2.97). Letters then land one keystroke at a time; each is a single-frame spike, at 3.20, 3.53, 3.90, 4.27 and 4.60 (every 0.33–0.37 s). The line overflows the frame, which pans to keep the caret in view (4.5–5.0). The app icon arrives as the last "character" before the product name (~4.9–5.3). | **Reveal:** the cards slide outward off all four edges (1.50–2.23, 23 frames); the word stays |
| 3 | 6.37 | 9.10 | Product name gone. A small one-line statement is typed word by word at the centre (6.5–7.5) and holds. | Hard cut (6.37) |
| 4 | 9.10 | 12.70 | A blue macOS desktop. The cursor travels to the menu bar (9.1–9.9) and the app's popover drops (9.9–10.0). The caption arrives left, sans then serif italic (~11.0, ~11.5). | Hard cut (9.10, change 78) |
| 5 | 12.70 | 16.90 | A video call with a sprint board. Shortcut keycaps appear (13.0), a selection box is drawn, a "Link copied" toast drops (14.5–15.0). The screen dims under a two-line caption (14.97–15.13). | **Zoom:** a dimmed, scaled crossfade over 9 frames (12.70–12.97) |
| 6 | 16.90 | 22.20 | **Use-case montage**, 8 shots, each with a white 1–2 word caption centred and a "Copied" toast dropping at the top: a paused coding video, a slide in a call, a scanned invoice, a parcel label, a terminal error, a station departure board, a sticky note on a monitor. | Hard cuts at a fixed interval: 16.90, 17.63, 18.40, 19.17, 19.90, 20.67, 21.43, 22.20 (0.733–0.767 s, mean 0.757 s) |
| 7 | 22.20 | 22.93 | **Flicker recap:** earlier shots return mirrored, one under a single "any of it" caption, 0.17–0.20 s each | Hard cuts at 22.37, 22.57, 22.77, 22.93 |
| 8 | 22.93 | ~25.3 | White. A small sentence is typed (23.0–24.5); one word gets a text-selection highlight (24.5) | Hard cut (22.93, change 102) |
| 9 | ~25.3 | ~29.0 | **Giant typed headline, faster:** about one keystroke per 0.1 s (spikes 25.3–26.7, rising 3 → 11 as the letters get bigger). The frame pans right to follow the caret, so only the tail of the line is ever visible. | Scale jump to giant (~25.3) |
| 10 | 29.00 | 33.53 | A small line is typed at the centre. App cards slide in from every edge around it (29.83–30.20), and a dark "Copied" pill sits under the line; its content changes at 32.0 | Hard cut (29.00) |
| 11 | 33.53 | 36.33 | Cards gone; white. A feature list is built as one sentence, a word at a time: ~34.0, ~35.0, ~35.5 | Clear (33.53): the cards leave in one frame |
| 12 | 36.33 | 44.83 | **Indexed feature tour.** A persistent left-hand index of five features; the active one turns black. Centre: a circle in which a translated phrase changes every 0.5 s (36.4–39.4), with a leader-line label naming the detected language. Then a QR card (39.4), a link card (40.6–41.0), a history popover (42.0–42.2) and a search typed into it (43–44) | Cut on white (36.33, change only 3.7: both frames are white) |
| 13 | 44.83 | 47.87 | "Works offline" circle; the tick-ring dial rotates; a "Copied" toast drops (46.5) | Hard cut (44.83) |
| 14 | 47.87 | 50.93 | The closing line is built in three phrases (48.0, 49.0, 49.5) and holds | Hard cut (47.87) |
| 15 | 50.93 | ~54.5 | Hundreds of captured cards burst out from a point to fill the frame (50.9–51.1), swirl in 3D, then collapse back to a point (54.4) | Burst from the centre (84-frame event, 50.93–53.70) |
| 16 | ~54.6 | 57.32 | End card: app icon, name, domain line, price/terms line; holds | Appears on white after the collapse (~54.6–55.0) |

**Rhythm:**
- **Opening:** about 3 s per idea (beats 1–5).
- **Montage:** 8 shots on a locked 0.757 s interval.
- **Recap:** a flicker at 0.17–0.20 s.
- **Feature tour:** 2–3 s per idea, with in-place updates every 0.5 s.
- **End card:** a 3 s hold.

**Sound:**
- librosa reports 136 BPM, with a median inter-beat of 441 ms. The montage interval (757 ms) is not a whole number of those beats.
- The cuts' nearest audio onsets are −112 to +69 ms away, so frame-tight cutting to the music is **not shown**.
- Onset density rises from 2.7/s (first typing section) to 5.2/s (montage) and 5.8/s (feature tour).
