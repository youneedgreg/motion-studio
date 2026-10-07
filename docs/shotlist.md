# Shot list — SafariOS, 20 s

The grammar of `refs/launch.mp4` (see `docs/style_guide.md`), applied to SafariOS.
None of the reference's content, logo, mascot, characters or copy is used.

**Status:** v2, with decisions locked from your answers. Waiting for your OK before any code.

**Sources:**
- **Live demo:** `https://safarios-demo.vercel.app`, the public pages and the five "Product tour" mocks, explored and captured on 2026-10-07. This is the current brand, and it supersedes the older `safari-os-website` repo (green `#15803d`, IBM Plex).
- **Product code:** `/Volumes/Gwan/projects/safari-os` (`src/`, `prisma/schema.prisma`, `prisma/seed-demo.ts`, which is fictional data).
- **Real records:** never read for content. `prisma/seed.ts` and `seed-tour-data.ts` are an export of real operational records, so they're off limits.
- **The name "SAWAS"** appears nowhere in the video. That rules out the old screenshots (sidebar says "SAWAS") and the demo invoice number prefix ("SAW-…").

---

## Locked decisions

| # | Decision | Choice | Why |
|---|---|---|---|
| 1 | Format | **1920×1080, 60 fps** | The grammar depends on a wide product canvas the camera travels over, and full-bleed words. SafariOS's UI is desktop-first, so it stays readable. A 1080×1920 cut-down can be made from the same timeline later. |
| 2 | Colour | **Green primary + a five-colour accent system, all from SafariOS itself** | See Palette below. Forest green leads; gold is the brand accent; the other three are the product's own pipeline status colours, which already work like the reference's multi-colour chips. |
| 3 | Type | **Inter (variable, Display optical size) for headlines, chips and UI; Fraunces italic for the one emphasis phrase per title.** Both are the live brand's fonts, open licence, now in `assets/fonts/` | Inter Display at 800 is the same kind of heavy neo-grotesk as the reference. The Fraunces gold italic is SafariOS's signature move ("*for safari businesses.*"). Fraunces has no → or ✓ glyphs, so those are set in Inter. |
| 4 | House rules | **Titles left-aligned on a 120 px margin; words rise out of a baseline mask with no opacity fades.** Motion blur only on camera moves | Satisfies CLAUDE.md (no centred title on gradient, no fade-ins) and keeps the reference's word-by-word rhythm. |
| 5 | Product UI | **Rebuilt in code** from the live demo's product-tour mocks and its fictional demo data. No screenshots | No "SAWAS" anywhere, crisp at 1920, and every row can be animated. |
| 6 | Numbers | **Taken from the demo's own fictional data and the product's real thresholds** | See Data below. Nothing invented. |
| 7 | URL | **safarios-demo.vercel.app** | Your answer. |
| 8 | Sound | **Synthesised in code**, 120 BPM, −14 LUFS, true peak ≤ −1 dBTP | House rule. |

**Demo login: not done.** I can't type a password into a hosted site, even with it supplied. That's a hard limit for me, so I didn't read `.env.demo` either.
- **What I explored instead:** everything public, including clicking through all five product-tour tabs.
- **If you want the inside of the app in the film:** sign in yourself in the browser pane and I'll explore under your session.

---

## Palette (SafariOS tokens from the live site's CSS)

| Role | Token | Hex |
|---|---|---|
| **Primary green.** Shot 8 lead field, end-card ground, CTA text | forest / forest-3 | `#0e2a1f` / `#1b4332` |
| Accent 1, brand. Emphasis italics, CTA pill, logo tile | gold / gold-deep | `#e2a93f` / `#b9811c` (deep on light grounds for contrast) |
| Accent 2, status "enquiry" | sky | ≈ `#0ea5e9` (GUESS: matched to the product's Tailwind sky tints) |
| Accent 3, status "provisional" | violet | ≈ `#8b5cf6` (GUESS, same) |
| Accent 4, status "confirmed / paid / done" | emerald | ≈ `#10b981` (GUESS, same) |
| Light ground, gradient warm corner | sand | `#ecdcbc` |
| Light ground, gradient cool corner | sage | `#dde7d8` |
| Light ground, base | cream | `#f6f1e7` |
| Card surface | — | `#ffffff` |
| Text | ink | `#14211a` |
| Alert (expiry, HOT) | clay ground + red text | `#ecd6c4` + ≈ `#dc2626` (GUESS) |

The reference's rule still applies: neutrals carry the frame, and accents sit on small objects until the list run in shot 8, the only time colour fills the screen.

---

## Data used on screen

All of it is fictional demo data from the live site and `seed-demo.ts`, or real product behaviour from the code:

| What | Value | Source |
|---|---|---|
| Cost sheet, "Classic Maasai Mara", 2 guests | Mara Serena Safari Lodge, 3 nights FB: **$2,520**; Mara park fees, non-resident, 2 pax × 3 days: **$1,200**; Land Cruiser 4×4 + driver-guide, 4 days: **$720**; hot-air balloon, 2 pax: **$900** | Demo tour: Costing |
| Totals | Cost **$5,340**, sell **$6,945**, margin **23.1 %** (checks out: 1,605 / 6,945) | Demo tour: Costing |
| Margin band the AI advisor uses | 20–30 % classic, 25–35 % luxury/honeymoon; low-margin alert below **8 %** | `api/ai/costing-advisor`, `api/cron/anomaly-detection` |
| VAT / deposit / payment | VAT **16 %**; **$1,440** received via M-Pesa (30 % of $4,800) | Demo tour: Invoices; `seed-demo.ts` |
| Pipeline | HOT and WARM enquiries; quoted **$7,400**, provisional **$9,100**, confirmed **$4,800** | Demo tour: Pipeline |
| Conversion tiers | HOT ≥ 65, WARM ≥ 40 | `api/ai/conversion-scores` |
| Driver portal | Joseph K. · Land Cruiser **KDA 123A**: airport pickup complete **07:42**; en route to Maasai Mara **10:15**; arrived at Mara Serena **15:30** | Demo tour: Dispatch |
| Compliance | Expiry alerts default to **30 days** ahead; demo alert: first-aid certificate expires in **21 days** | `schema.prisma` `alertDays @default(30)`; Demo tour: Dispatch |
| Reminders | **30 · 14 · 7 · 3 · 1** days before arrival (the old website said 30·14·7·1; the code and live site say five) | `api/cron/pre-trip-reminders` |
| Platform | 21 modules · USD + KES · M-Pesa · WhatsApp · no app or login for drivers and guests | Live site |
| Parks (wallpaper) | Maasai Mara, Amboseli, Serengeti, Ngorongoro, Tsavo, Samburu, Lake Nakuru, Bwindi, Zanzibar, Murchison Falls, Tarangire, Diani | Live site marquee |

---

## Timing grid

- **Tempo:** 120 BPM. 1 beat = 0.5 s, 1 bar = 2 s, 10 bars = 20 s.
- **Micro-events:** land on 8ths (0.25 s). The reference's ~0.2 s stagger, snapped to the grid.
- **Shot changes:** land on downbeats.
- **Hard cuts:** exactly one, into the end card.

| # | Time (s) | Shot | In via |
|---|---|---|---|
| 1 | 0.00–2.00 | Hook: one enquiry, buried | — (scale-pop) |
| 2 | 2.00–4.00 | Promise + ask bar | zoom (blur-zoom) |
| 3 | 4.00–6.00 | Pipeline card | zoom (fly-through) |
| 4 | 6.00–8.00 | Costing + AI advisor | push (slide up, tilt) |
| 5 | 8.00–10.00 | Itinerary → client portal | zoom (camera push-in) |
| 6 | 10.00–12.00 | Dispatch: driver portal + compliance | push (pan) |
| 7 | 12.00–14.00 | Three-pill summary | zoom (pull-back) |
| 8 | 14.00–16.00 | Four-word list | circle wipes |
| 9 | 16.00–20.00 | End card | **hard cut** |

---

## Shots

### 1 · Hook: one enquiry, buried — 0.00–2.00
- **Frame:**
  - **Ground:** cream → sand (warm, top-left) → sage (cool, lower-right) gradient with a faint dot grid.
  - **Centre:** a 3D-extruded white enquiry card, with a sky "Enquiry" status tag and a HOT tag in red on clay:
    - **New enquiry**
    - **Honeymoon · 2 guests · March**
- **Motion:**
  - The card scale-pops in at 0.00 and lands tilted −4°.
  - Chips pop in on each 8th from 0.25 to 1.75 and bury it. They're the operator's daily failures, from the live site's "daily failures" section, shortened:
    - `Costing_v7_FINAL.xlsx`
    - `USD or KES?`
    - `WhatsApp · 42 unread`
    - `Same Land Cruiser, twice`
    - `PSV licence · expired?`
    - `Invoice nobody chased`
    - `3 days unanswered`
  - Chips are white extruded pills with ink Inter Semibold text, tilted ±3–8°, with long soft shadows.
  - The camera creeps in throughout.
- **Sound:** kick on 0.00; a dry tick per chip, pitch rising; a small dissonance building.

### 2 · Promise + ask bar — 2.00–4.00
- **In:** blur-zoom. The buried card blurs and scales past the camera while the title scales down into place.
- **Title**, left-aligned, words rising out of a baseline mask on 8ths:
  - **Every booking.** — Inter Display 800, ink. Lands 2.00 / 2.25.
  - ***One system.*** — Fraunces italic, gold-deep `#b9811c`. Lands 2.50 / 2.75.
- **Then:**
  - **Module chips** pop on 8ths 3.00–3.50, right side: `Quotes` · `Costing` · `Itineraries` · `Invoices` · `Dispatch`.
  - **Ask bar** slides up at 3.25 and types `How many arrivals this week?` (plain-English questions about your own data, a real feature).
  - **Send dot** turns forest green on 3.75.
- **Sound:** a low hit on 2.00; a key-tick per word; quiet typing.

### 3 · Pipeline card — 4.00–6.00
- **In:** fly-through zoom. The camera accelerates into the ask bar (3.80–4.00, motion-blurred) and comes out in a white card on the gradient.
- **Frame:**
  - **Title**, word by word on 8ths: **A pipeline, *not an inbox.*** ("not an inbox." in Fraunces italic gold-deep; the line is SafariOS's own copy).
  - **Subtitle**, Inter 500, ink at 70 %: **Every enquiry on one board, scored hot, warm or cold.**
  - **Board:** a tilted 3D board with four columns in the product's status tints: Enquiry (sky) · Quoted (amber) · Provisional (violet) · Confirmed (emerald).
- **Motion:** one booking card, **Classic Maasai Mara · 2 guests**, hops column to column on beats (4.50, 5.00, 5.50) and lands in Confirmed with a squash. Its tag changes HOT → $6,945 → Provisional → ✓ Confirmed.
- **Sound:** a pluck per hop, rising each time.

### 4 · Costing + AI advisor — 6.00–8.00
- **In:** push. The product canvas slides up from below with a 3D tilt that flattens as it lands (6.00–6.15).
- **Frame:** a cost-sheet card rebuilt in code, **COST SHEET · CLASSIC MAASAI MARA**. Rows tick in on 8ths 6.25–7.00:
  - Mara Serena Safari Lodge · 3 nights FB · 2 pax — **$2,520**
  - Maasai Mara park fees · non-resident · 2 pax × 3 days — **$1,200**
  - Land Cruiser 4×4 + driver-guide · 4 days — **$720**
  - Hot-air balloon safari · 2 pax — **$900**
- **Totals** roll up on 7.25: Cost **$5,340** · Sell **$6,945** · Margin **23.1 %**. The margin number counts up from 0 and lands in emerald.
- **AI advisor strip** types in on 7.50 in a gold-tinted bar: **AI advisor: margin is healthy for October. KES/USD rate synced this morning.** (the demo's own line)
- **Camera:** slow drift right.
- **Sound:** a tick per row; a rising tone with the counting margin; a soft chord on the advisor line.

### 5 · Itinerary → client portal — 8.00–10.00
- **In:** zoom. The camera pushes in and tilts onto an itinerary card.
- **Frame:**
  - **Itinerary card** with a forest-green header: *Classic Maasai Mara* in Fraunces italic cream, and **4 nights · 2 guests · Full board** under it.
  - **Day rows** tick in on beats:
    - 8.50 — Day 1 · Nairobi → Maasai Mara
    - 9.00 — Day 2 · Dawn drive, river crossing watch
    - 9.50 — Day 3 · Hot-air balloon, bush breakfast
  - **Callout** at 9.25 with a leader line: **Drafted with AI. Published as a client portal.**
  - **Phone mock** slides in at 9.50 showing the portal countdown: **31 DAYS TO GO**.
- **Sound:** a page-turn swish per day; a chime on the countdown.

### 6 · Dispatch: driver portal + compliance — 10.00–12.00
- **In:** push. Pan right onto a **DRIVER PORTAL · LIVE** card.
- **Frame:**
  - **Header:** Joseph K. · Land Cruiser KDA 123A · *Briefed on WhatsApp · no app, no login*.
  - **Timeline** ticks in on beats, each dot turning emerald:
    - 10.50 — Airport pickup complete · 07:42
    - 11.00 — En route to Maasai Mara · 10:15
    - 11.50 — **Arrived at Mara Serena Safari Lodge · 15:30**
  - **Alert strip** slides in at 11.25, red text on clay: **Grace W. · first-aid certificate expires in 21 days**.
  - **Callout** at 10.75: **No login, no app.** (site copy)
- **Camera:** the last 0.25 s dims and blurs the background, heading into the pull-back.
- **Sound:** a status ping per row; a soft warning blip on the alert.

### 7 · Three-pill summary — 12.00–14.00
- **In:** zoom. The camera pulls back over the whole product canvas, dimmed and blurred (depth of field).
- **Frame:** three large extruded pills land on the off-beats with overshoot and slight tilts, staggered:
  - 12.25 — **Enquiry in.** (sky pill, white text)
  - 12.75 — **Trip run.** (violet pill, white text)
  - 13.25 — **Paid in M-Pesa.** (emerald pill, white text)
- **Sound:** three rising hits; a riser into 14.00.

### 8 · Four-word list — 14.00–16.00
- **In:** circle wipes from the centre, one per beat. Each outgoing word scales up and blurs as the next circle grows.
- **Frame:** a full-bleed field per word. Behind each word is a tilted (~−12°) tone-on-tone wallpaper of the park names and product vocabulary (USD · KES · M-Pesa · VAT 16 % · PSV · Land Cruiser 4×4 · HOT · WARM · 30·14·7·3·1).
- **Words** (huge, edge to edge, allowed to crop, Inter Display 800):

  | Time | Word | Field | Text |
  |---|---|---|---|
  | 14.00 | **Quotes.** | forest `#0e2a1f` (primary) | cream |
  | 14.50 | **Itineraries.** | gold `#e2a93f` | forest |
  | 15.00 | **Invoices.** | sky | white |
  | 15.50 | **Drivers.** | violet | white |

- **Sound:** a whoosh and hit per beat.

### 9 · End card — 16.00–20.00
- **In:** the single **hard cut**, on the downbeat at 16.00.
- **Ground:** forest `#0e2a1f` with a faint dot grid. This is the brand's own hero look, and it departs on purpose from the reference's light end card: the strongest brand recall to finish on.
- **Left-aligned block:**
  - 16.00 — the SafariOS mark (gold rounded tile with a forest compass) and **SafariOS** wordmark (Inter Semibold, tight, cream) scale down from oversized into place, settling by 16.25.
  - 16.50 — eyebrow, Inter Semibold caps, tracked +15 %, gold: **BUILT FOR EAST AFRICAN SAFARI OPERATORS**
  - 17.00 — two lines, words rising on 8ths:
    - **The operating system** (Inter Display 800, cream)
    - ***for safari businesses.*** (Fraunces italic, gold), from the live site h1
  - 18.00 — CTA pill drops in, gold with forest text, extruded: **Create your workspace →**, with **safarios-demo.vercel.app** under it in cream at 70 %.
  - 18.00–20.00 — hold with a slow camera creep; nothing else enters.
- **Sound:** a big hit on 16.00; the chord resolves; the tail rings out by 20.00.

---

## Borrowed vs. new

- **Borrowed (grammar only):**
  - Beat structure.
  - ~2 s beats with 0.25 s micro-events.
  - The transition order: zoom, zoom, push, zoom, push, zoom, wipes, one hard cut.
  - Extruded tilted pills and chips; one continuous camera over the product; dot-grid gradient grounds; sentence-case titles ending in a period; circle wipes with the scale-blur exit.
- **New:**
  - All copy, apart from the SafariOS site lines marked above.
  - All objects.
  - SafariOS palette, type, logo and data.
  - **No mascot, no characters**, and nothing from the reference's UI, logo or words.
