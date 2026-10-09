# Director's brief: safarios-v2

`CLAUDE.md` holds the studio rules: the render contract, house style and banned defaults, and the sound targets.
This brief holds only facts about this film.

Run mode: attended

## The film
- **One-line goal:** In under 30 s, an operator watches **one honeymoon booking** go from a website request to fully paid, and sees that one system ran every step.
- **Audience and placement:** owners and ops leads at East African safari companies.
  - Placement: LinkedIn and X feeds, the WhatsApp status cut, and the demo site's hero.
  - Viewing: mostly on a phone, with sound off at first. The story has to read without sound; the sound rewards turning it on.
- **CTA / end card:** SafariOS mark and wordmark, then the site's h1 "The operating system *for safari businesses.*", then **Create your workspace →** and **safarios-demo.vercel.app**.
- **Format:** one timeline, three renders.
  - **1920×1080 master**, plus **1080×1920** and **1080×1080**.
  - A layout function places every element per format; timing is identical in all three.
  - All three are 60 fps, **32 s** (was 28 s; the modules list added 4 s on 2026-10-09), and don't loop.

## Sources
- **Brand source:**
  - The live site: `safarios-demo.vercel.app` CSS tokens, as catalogued in `docs/shotlist.md` (v1).
  - The Safari OS repo (private, read with `gh`): UI structure only, from the sidebar, the bookings kanban, the costing advisor, the client portal and the driver page.
- **Fonts:** Inter (display and UI) and Fraunces italic (one emphasis phrase per caption).
  - Both are the live brand's fonts, both are in `assets/fonts/`, and both are OFL.
  - That's one display face and one UI face. Fraunces has no → or ✓ glyphs, so those are set in Inter.
- **Data shown on screen:** fictional only. The film follows **the demo app's own honeymoon booking**, *Honeymoon Under the Stars*. I viewed it signed in, in your session, on 2026-10-08:
  - **Client and party:** Sofia R. (the demo record uses an `example.com` email and a `000` phone number), 2 adults.
  - **Trip:** Maasai Mara, 15–20 Jan 2027, value $7,400.
  - **Status:** source Website, balance $0 (fully paid).
  - The table in `shotlist.md` marks every value that is *derived* rather than shown in the demo.
  - Never `prisma/seed.ts`, `seed-tour-data.ts`, `seed-drivers.ts` or `seed-portals.ts`: these may hold real records.
  - `prisma/seed-demo.ts` isn't in the GitHub repo, so it isn't used.
- **Screens / product states to show,** in the order a booking lives through them:
  1. website request
  2. enquiry scored HOT
  3. costing sheet and AI margin advisor
  4. AI itinerary draft
  5. client portal, counting down
  6. driver portal, on the trip day
  7. invoice fully paid, booking complete

## References (one strength from each; no reference's structure)
| Reference | Take from it | Never take |
|---|---|---|
| `refs/launch4.mp4` | **Structure:** one fictional story through every feature. Here it's one booking, with one client, tour, date, price and driver, from the first frame to the last. | The logo, copy, AI face, launch scenario and names; the third-party brands; its order (caret → logo → claim → AI → plan → board → agents…) |
| `refs/launch.mp4` | **Transitions:** the camera moves *through* an element of one beat into the next, and there are no hard cuts between product beats. **Also (your call, 2026-10-09: "more of launch.mp4, like v1"):** its beat-locked circle-wipe run, as v1 had it. Four wipes, one per beat (24.0–25.5), each a full-bleed brand field (forest, sand, gold-deep, sage) with a tilted tone-on-tone wallpaper of module chips and one huge word, and the outgoing word scales up and blurs as the next circle grows | The mascot, the slogan and the wordmark; its copy (*Your copy. Your fonts…*); its four hues (orange, purple, blue, yellow); the three pills; its order (chips → title → modules → pills → 4-word wipes → end card). v1 copied that order, and v2 drops it. |
| `refs/launch2.mp4` | **Type:** a giant typed line that overflows the frame while the camera follows the caret. Used once, for the hook; a small version is used for the AI prompt | The app name and copy; the macOS desktop; the people; the montage objects; the card explosion; its order |
| `refs/launch3.mp4` | **Camera:** the device stays still and the world behind it changes. The client's phone holds its place while the ground and the countdown change, and the same phone then turns into the driver's. Flat brand grounds, no photography. | All photography; the device models; the dot-matrix type and the all-caps headline (banned here); the counter as content; its order |

## What v1 taught (from `docs/shotlist.md`, `out/safarios-check.txt`, `out/safarios-phone.png`)
1. **The structure was the reference's.** v1 ran chips → title → module tour → three pills → four-word wipes → end card, which is mtioon's order shot for shot. v2's order is the life of one booking.
2. **Too small to read on a phone.** In the 360 px phone sheet, the subtitles, row details, the advisor line, the day-row details and the driver timestamps are unreadable: they were 18–32 px in the 1920 master. The 12.0–14.0 pills beat shrinks the product to a smear.
3. **Continuity breaks.**
   - The hook's enquiry says **March** (`films/safarios/film.js:129`), but the portal says **14–18 Nov** (`:326`).
   - The board shows four different bookings.
   - The hook's "Honeymoon" never comes back.
4. **The sound drops 4.7 LU on a small speaker** (target < 2 LU).
5. **Near-empty frames.** The end card shows only a logo for 16.0–16.75 and the eyebrow alone until 17.0.
6. **Too many accents.** v1 used gold plus four status colours across full-screen fields. v2 uses one accent, gold. Status colours appear only inside the product's own small status chips.
7. **Format:** v1 was 1920×1080 only.

## Beat sheet
120 BPM, 4/4: 1 beat = 0.5 s, 1 bar = 2 s, 16 bars = 32 s. The details are in `shotlist.md` and the cues in `films/safarios-v2/timeline.json`.

| Time | Beat | On screen | Sound |
|---|---|---|---|
| 0.0–3.0 | **Request** | A giant typed message, with the camera following the caret: *Honeymoon safari for two, in January?* It pulls back into a website-request card that lands on the board | Key bursts per word; kick on the land |
| 3.0–5.0 | **Scored** | The card's conversion score counts up to 82 and HOT pops. Caption: **Scored HOT.** The cursor clicks *Build quote* | Rising tick run; hit on HOT; click |
| 5.0–9.0 | **Costed** | Flies through the button into a cost sheet: 4 rows, totals, the margin counts up to **25.0 %** (Healthy), then one advisor line | Tick per row; pitch rises with the count; soft chord |
| 9.0–12.0 | **Drafted** | Flies through the trip title into the itinerary. An AI prompt is typed; three days drop in; *Publish to portal* | Keys; a page sound per day; click |
| 12.0–16.0 | **Countdown** | The itinerary card morphs into the client's phone. The phone stays still while the world behind it changes each second: **30 → 14 → 7 → 1 day to go**, each with a different portal section | A tuned hit per world change, climbing |
| 16.0–20.0 | **Trip day** | The same phone flips to the **driver's** phone: Joseph K., Land Cruiser KDA 123A, with three stops ticking 07:42 · 10:15 · 15:30 (15 Jan). Caption: **No app. No login.** | Flip whoosh; a ping per stop |
| 20.0–23.0 | **Paid** | Pull back to the board. A $7,400 M-Pesa payment lands, the balance goes to $0 (Fully paid), and the card moves to Completed | Payment chime; hit; pluck |
| 23.0–28.0 | **Everything else** | Flies through the gold *Fully paid* chip onto a gold field. Caption: **One login.** *All of it.* From 24.0, a circle-wipe run on the beat (from launch.mp4): **Leads.** (forest) · **Fleet.** (sand) · **Money.** (gold-deep) · **Brand.** (sage). Each field carries a tilted wallpaper of the ten modules the booking didn't pass through (WhatsApp CRM, trip reminders, fleet compliance, ops calendar, supplier payables, content studio, ask your data, anomaly alerts, roles & audit log, your branding; names from the live site). At 26.0 a gold circle opens back onto the caption, and the full ✓ list rises row by row | A drop; a whoosh and tuned hit per wipe, climbing; chord on the list; riser into the logo |
| 28.0–32.0 | **End card** | The gold field contracts into the logo tile, taking the list with it. Mark, h1 and CTA in place by 29.0; a cursor presses the CTA at 30.5, then held | Big hit; the chord resolves (IV → I) and rings out |

## Sound
- **Track:** synthesised in `films/safarios-v2/score.py` with `lib/synth.py`. `beats.json` is ground truth, written from the timeline.
- **BPM and meter:** 120, 4/4.
- **Mood:** warm and confident, mid-tempo. Marimba lead (it doubles as the UI sound, so every cue is a tuned note), a soft pad, kick plus click, shaker on the 16ths, and typing that sits in the groove.
  - **Avoid:** sub-only bass, "safari" pastiche (no drums-of-Africa clichés), confetti or crowd sounds, and any real brand's notification sound (the M-Pesa moment gets a generic two-note chime).
- **Phone-proof:**
  - Every part with energy below 150 Hz also gets a harmonic or octave above 150 Hz.
  - The kick sweep ends at 66 Hz or higher and has a click.
  - **Small-speaker drop < 2 LU**, measured by `tools/check.py`.
- **Levels:** −14 LUFS integrated, true peak ≤ −1 dBTP, measured on each final mp4.

## Deliverables
- `out/safarios-v2.mp4` (1920×1080), `out/safarios-v2-9x16.mp4` (1080×1920) and `out/safarios-v2-1x1.mp4` (1080×1080)
- For each: `-check.txt`, `-contact.png`, `-phone.png`, `-spectrum.png`, `-wave.png`, and the `-critique-*.md` rounds

## Needs your OK (decisions in this plan)
1. **Tooling for the three formats.**
   - `render.mjs` gets a `--format 16x9|9x16|1x1` flag. It sets the viewport from `timeline.json`'s `formats` and exposes `window.filmFormat`.
   - `tools/check.py` gets the same flag and suffixes its outputs.
   - This adds a feature to the checks; no check is loosened.
2. **The end card is cream, not forest.**
   - v1's forest `#0e2a1f` ground with gold sits too close to the banned "near-black ground with a single orange accent".
   - In v2, forest is the colour of the portal's last world (1 day to go) and of the type.
3. **Derived values.** The demo booking has no cost sheet, itinerary or dispatch of its own, so I fill those in to fit its $7,400 price:
   - **Cost lines** summing to a **$5,550** net cost, which gives a **25.0 %** true margin on sell. That's "Healthy" in the engine's own bands and inside the advisor's 25–35 % honeymoon band.
   - **Day rows.**
   - **Driver:** Joseph K. · KDA 123A, with timestamps reused from the live site's dispatch tour.
   - **Countdown:** 30·14·7·1 follows the product's reminder schedule (30·14·7·3·1). The 3-day step is dropped for time.
   - **Conversion score:** 82, inside the HOT band (≥ 65).
   - **Payment:** "Paid in full · M-Pesa".
   - Each derived value is marked in `shotlist.md`.
4. **The product UI is rebuilt in the brand's light site style, not the app's dark theme.**
   - The demo app runs a dark theme with a mint accent. A dark product UI would put most frames on a near-black ground.
   - The rebuild keeps the app's labels, layout logic and status names exactly.
