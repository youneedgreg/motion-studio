# launch.mp4 — beats

1920×1080, 60 fps, 15.125 s. Read from the 2 fps frames in `refs/launch/frames/`, 10 fps samples around each
boundary, and per-frame pixel change for the transitions at 1.8, 3.75, 5.40 and 13.133 s.
`~` = estimated (±0.1 s unless noted); unmarked times are frame-exact or match a `cuts.txt` (scene > 0.15) detection.

Note: `refs/launch/frames/f_N.png` is the source frame at exactly **(N − 1) × 0.5 s** (every 30th frame). The first pass used `fps=2`, which sampled at (N − 1) × 0.5 + 0.233 s
(matched against the source frame by frame). All times below come from direct seeks into the video.

| # | Start | End | On screen | In via |
|---|---|---|---|---|
| 1 | 0.00 | ~1.80 | Orange folder mascot with eyes, centred on a blush→lavender gradient; scales up from small ~0.0–0.2. Label "your-app" with a filename that cycles about every 0.2 s. Chips pop in around it roughly every 0.2 s: README.md ~0.4, mtioon ~0.6, Sunghyun Sans ~0.8 (flies in), small chip into the folder ~1.0, hero.png ~1.2, #FF5A1F ~1.4, #F5C518 ~1.6 | — (opens on the folder) |
| 2 | ~1.85 | ~3.60 | "Say it." (heavy black display type) settled by ~2.0, then "Watch" ~2.2 and "it moove." ~2.4, each word rising from pale grey to black, settled ~2.6. Feedback chips pop one about every 0.2 s from ~2.2 to ~2.9 ("make the hook more aggressive", "adapt this to portrait", "orange, please", "slam it in"). Prompt bar appears ~2.95 with a placeholder, types "make our launch video" ~3.1–3.4; send button turns blue ~3.5 | zoom — folder blurs and scales up while a huge grey "Say it." scales down into place (blur-zoom crossfade, dip ~1.85) |
| 3 | 3.77 | 5.40 | White rounded card: "Your repo is the brief." reveals word by word (blurred → sharp ~3.8–4.1), subtitle "Claude reads your README, colours, fonts, logo and screenshots." Chips ride a tilted tray toward the folder (bottom left) and reshuffle one at a time ~4.4–5.3 | zoom — accelerating push-in on the prompt bar from ~3.60 (change/frame climbs 10→47) that flies straight through into the card; no hard-cut spike |
| 4 | 5.40 | 7.28 | Editor UI: black preview, timeline with orange/purple/blue clip rows, Claude panel. Preview shows "Say it." from ~5.8; Claude panel slides in ~6.0 with "make our launch video", then one step ticks in about every 0.2 s ~6.2–7.2 (Read project, Add layers · 23, Apply motion · slam, rise, Set camera · push-in, Look at frames · 6, "Done. The hook lands on beat 1.") | push — editor slides up from below over the card with a slight 3D tilt, 5.40–5.52 |
| 5 | 7.28 | 9.15 | Close on the timeline: track chips "you type / Claude edits / you tweak", callouts pop with leader lines: "Sections" ~7.9, "Every layer is a clip" ~8.2, "Scrub to any frame" ~8.7, "Cut on the beat" ~9.0; camera drifts right | zoom — camera push-in and tilt from the full editor down onto the timeline, ~7.25–7.40 |
| 6 | 9.15 | ~10.25 | Close on the inspector (Text panel: Instrument Serif, weight 400, size/tracking/line-height sliders). Callouts ~9.8: "Any font, self-hosted", "Every value, a slider", "Tweak anything" | push — pan up/right from the timeline to the inspector |
| 7 | ~10.25 | 11.28 | Full editor, dimmed and blurred behind three 3D pills: "You talk." (blue, ~10.3), "Claude builds." (orange, ~10.5), "You tweak." (green, ~10.75, overshoots and settles ~10.9) | zoom — pull-back from the inspector to the whole editor; a big "You talk." pill scales down into place (~10.0–10.3) |
| 8 | 11.28 | 11.73 | Full-bleed orange field of tilted asset chips (render_frames, README.md, #FF5A1F…); white "Your copy." | wipe — circle (iris) expands from the centre. Not one of hard cut / push / zoom / morph; closest is morph |
| 9 | 11.73 | 12.20 | Same chip field in purple; white "Your fonts." | wipe — circle; outgoing title scales up and blurs as the new circle grows |
| 10 | 12.20 | 12.67 | Same chip field in blue; white "Your colours." | wipe — circle (same move) |
| 11 | 12.67 | 13.133 | Same chip field in yellow; black "Your assets." | wipe — circle (same move) |
| 12 | 13.133 | 15.125 | End card on the blush gradient: "mtioon" logo; "AN MCP FOR CLAUDE CODE" above, "Say it. Watch it move." below (~13.4), orange pill CTA "mtioon Try it at mtioon.com" (~13.5); holds to the end | hard cut — single-frame spike at 13.133; the logo then scales down from oversized, translucent letters, settling ~13.3 |

**Rhythm:** after the first two beats (~1.8 s each), beats run 1.4–1.9 s through the product section,
then the four colour cards change every 0.45, 0.467, 0.467, 0.467 s (11.28 → 11.73 → 12.20 → 12.67 → 13.13),
i.e. 27–28 frames, ≈128 BPM; then a ~2 s hold on the end card.

**Scene filter vs. beats:** `cuts.txt` (0.15) catches 5.42, 7.28, 9.15, 11.28, 11.73, 12.20, 12.67, 13.13
(13.15 is a duplicate of the hard cut). It misses the blur-zoom at ~1.85, the fly-through at ~3.77
and the pull-back at ~10.25.

**Sound (measured):**
- librosa reports 129.2 BPM (median inter-beat 464 ms), which matches the colour-card interval (0.45–0.467 s), so those cards are on the beat.
- Each of the four card wipes (11.28, 11.73, 12.20, 12.67) and the hard cut (13.13) lands **102–109 ms before** its nearest detected onset. The offset is consistent, so the visuals lead the hits by about 6 frames, every time. librosa onsets can lag a sharp attack by a few tens of ms, so part of that gap may be the detector.
- The earlier transitions sit 85–800 ms away from any onset; the slow section isn't cut to the music.
- Overall −16.3 LUFS.

**Palette** (`refs/launch/palette.json`, from the exact-time frames):
- **Ground:** white `#fafafa`, blush `#f4e4e2`, lavender `#ebe6f4`.
- **Accents:** purple (`#944fe3`, `#8040ce`), mustard `#b89b19`, blue `#4181cf`. These are the colour cards' fills plus the mascot's orange in small areas.
