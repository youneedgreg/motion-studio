# Shot list: safarios-v2, 28 s

**Status:** plan. Waiting for your OK before any code.

Brief: `docs/safarios-v2/brief.md`. Timing and cues: `films/safarios-v2/timeline.json` (120 BPM, 4/4; 1 beat = 0.5 s, 1 bar = 2 s).

**The structure is the life of one booking:** request → scored → costed → drafted → counted down → driven → paid.
- It isn't mtioon's chips → title → modules → pills → word wipes (v1's order).
- It isn't Notion's caret → logo → claim → AI → board → agents.
- There's no logo until the end card, no three-pill summary and no list of module names.

---

## Layout function (one timeline, three formats)

Product cards are designed once, in **stage units (su)** on a 1000 su wide stage. The layout function places the stage and the captions for each format. All timing, springs and cues are shared.

| Format | Caption block | Stage centre, scale | Caption size | Hook line size | Min readable text |
|---|---|---|---|---|---|
| **16x9** 1920×1080 | Left column, x 120–760, top-aligned at y 300 | (1310, 540), 1.0 | 120 px | 300 px | 56 px |
| **9x16** 1080×1920 | Top band, x 70–1010, y 320–620 | (540, 1190), 1.0 | 124 px | 200 px | 40 px (stage 56 su × 1.0 = 56 px) |
| **1x1** 1080×1080 | Top band, x 80–1000, y 70–300 | (540, 700), 0.80 | 92 px | 190 px | 40 px (56 su × 0.8 = 45 px) |

- **Minimum text size:** every readable string on a product card is **≥ 56 su**. Anything smaller is texture: skeleton bars, never words.
- **Card size:** cards carry at most 4 rows.
- **Captions:**
  - Left-aligned, sentence case, Inter Display 800.
  - At most one Fraunces italic phrase per caption, in gold-deep `#b9811c`.
  - Full stops stay ink, never coloured.
  - Words rise out of a baseline mask that covers the font's full descent. No opacity fades.
- **Camera:** one camera transform over the whole canvas, with springs from `lib/motion.js`.
  - **Moves:** `CAMERA` (1.2 Hz, ζ 0.95). Fly-throughs are eased so they land exactly on the downbeat.
  - **Elements:** `DEFAULT` (2.2 Hz, ζ 0.8). The overshoot is 1.5 %.
  - **Payment chip:** `SNAPPY`, the only snappier element.
  - No PLAYFUL bounces.
- **Grounds:** flat cream `#f6f1e7` with a faint dot grid at 4 % ink. There are no gradients.
  - The portal's "worlds" are flat fills: cream → sand → sage → forest.

---

## Data on screen

Fictional. "Demo" means seen in the demo app (signed in, 2026-10-08) or on the live site. "Derived" means filled in by me to fit the demo booking.

| What | Value | Source |
|---|---|---|
| Booking | *Honeymoon Under the Stars* · Sofia R. · 2 adults · Maasai Mara · 15–20 Jan 2027 · source Website · $7,400 | Demo booking |
| Request message | *Honeymoon safari for two, in January?* | Derived (matches the booking) |
| Conversion score | **82 · HOT** (HOT ≥ 65, WARM ≥ 40) | Derived value; band from `api/ai/conversion-scores` |
| Cost lines | Tented camp · 5 nights FB · 2 pax **$2,150**; Park fees · 2 pax × 5 days **$2,000**; Land Cruiser + guide · 5 days **$900**; Bush dinner under the stars **$500** | Derived. The fee rate is the one v1's demo cost sheet uses. |
| Totals | Net cost **$5,550** · Total sell **$7,400** · ≈ **KES 962,000** · true margin on sell **25.0 % Healthy** | Derived. Checks out: 1,850 / 7,400 = 25.0 %, and 7,400 × 130 = 962,000. The labels, the 130 KES rate and the band names (<10 % Low · 10–18 % Tight · 18–35 % Healthy · >35 % Premium) are from the demo Costing Engine. |
| Advisor line | **Honeymoon pricing sits at 25–35 %. This quote is in range.** | Derived wording; the band is from `api/ai/costing-advisor` |
| Itinerary | Day 1 Nairobi → Maasai Mara · Day 2 Dawn drive, Mara River · Day 3 Dinner under the stars | Derived |
| Portal | **30 / 14 / 7 / 1 days to go**. Sections: booking confirmed · documents (passports ✓) · packing list · tomorrow's pickup | Derived steps. The schedule 30·14·7·3·1 is from `api/cron/pre-trip-reminders`; the sections are from `portal-client.tsx` |
| Driver | Joseph K. · Land Cruiser KDA 123A · pickup 07:42 · en route 10:15 · arrived at camp 15:30 | Live-site dispatch tour, reused for this booking |
| Payment | **$7,400 · M-Pesa** → balance **$0 · Fully paid** | Demo (balance $0); "Fully Paid" is the portal's own status string |

---

## Shots

### 1 · Request: 0.00–3.00 (caret camera, from launch2)
- **0.00:** a forest caret blinks once on cream.
- **0.00–1.50:** *Honeymoon safari for two, in January?* is typed at **300 px** (16x9), **one word per 8th**, each landing whole on its cue (0.25, 0.50, 0.75, 1.00, 1.25, 1.50) with a key burst. Letter-by-letter typing under a moving camera can't be sync-checked: every frame changes.
  - The line is wider than the frame, so the camera (a SNAPPY spring, retargeted a quarter beat early) pans to keep each new word fully on screen as it lands. The caret leads.
  - **"Honeymoon"** is readable from 0.25 s. That's the hook: a real customer asking a real question.
  - "January?" is Fraunces italic gold-deep. It's the one emphasis.
- **2.00–2.50:** the whole line shrinks as one rigid unit onto one line across the card, and a white **website-request card** grows out from around the words. **2.50–2.80:** once small, the words reflow into the card's two lines at 64 su:
  - Header: a `Website` badge (sky)
  - Body: the message (64 su)
  - Sender: `Sofia R.`
- **2.50:** the board arrives around the card: the "Enquiry · 1" column header rises, and the "Quoted" column slides in, peeking at the right edge.
- **Formats:** 9x16 and 1x1 use the same horizontal pan, at 200 and 190 px.
- **Sound:** a kick plus a key click at 0.00; a key burst on each word; a whoosh-out at 2.00; a thud at 2.50.

### 2 · Scored: 3.00–5.00
- **3.00–3.50:** a score ring on the card fills, and its number counts up from 0 to **82**, landing exactly at 3.50.
- **3.50:** a **HOT** tag pops (red on clay; product status colour, small).
- **4.00:** caption rises: **Scored *hot.*** ("hot." is Fraunces gold-deep).
- **4.50:** the cursor arrives and clicks **Build quote →** on the card.
- **Sound:** a rising tick run 3.0–3.5; a hit at 3.5; a pluck at 4.0; a click at 4.5.

### 3 · Costed: 5.00–9.00 (camera through UI, from launch)
- **In (4.55–5.00):** the camera accelerates into the *Build quote* button. Its label fills the frame and then gives way to the cost sheet, with no cut. The scene filter shouldn't see this as a cut.
- **The cost sheet:** a white card. Header: **Honeymoon Under the Stars** · `2 adults · 5 nights`.
  - Four rows land on 8ths (5.50, 5.75, 6.00, 6.25). Each is a label (56 su) and an amount (60 su, tabular figures), with no detail lines.
- **6.75:** totals roll up: **Net $5,550 · Sell $7,400**, with **≈ KES 962,000** under the sell figure.
- **6.75–7.25:** **25.0 %** counts up at 110 su and lands with a **Healthy** chip at 7.25.
- **7.75:** the advisor strip opens under the card: **In the 25–35 % honeymoon band.** It stays on screen until the camera leaves at 8.55.
- **Caption** (from 5.25): **Priced to *margin.***
- **Camera:** a slow drift right.
- **Sound:** a tick per row (rising scale); a rising tone during the count; a chime at 8.0; a soft chord at 8.5.

### 4 · Drafted: 9.00–12.00
- **In (8.55–9.00):** the camera flies through the cost sheet's title. The trip name grows to fill the frame and becomes the forest header of the itinerary card.
- **The itinerary card:**
  - Header: *Honeymoon Under the Stars* in Fraunces cream on forest; `15–20 Jan 2027 · Maasai Mara` underneath.
- **9.50–9.75:** a small AI prompt bar opens and types **5 nights in the Mara**, a word group per 16th. This is a small caret moment, not a pan.
- **Day rows** drop on beats (56–64 su):
  - 10.00 **Day 1 · Nairobi → Maasai Mara**
  - 10.50 **Day 2 · Dawn drive, Mara River**
  - 11.00 **Day 3 · Dinner under the stars**
- **11.50:** the cursor clicks **Publish to portal**.
- **Caption:** **Drafted with *AI.***
- **Sound:** keys at 9.5; a page sound per day; a click at 11.5.

### 5 · Countdown: 12.00–16.00 (device anchor, from launch3)
- **In (12.00–12.40):** the itinerary's content leaves first (11.72–11.95). On the cue, the empty card springs into the phone's shape and radius, and the portal content arrives at 12.30.
- **The phone is fixed.**
  - Position: centre of the stage (16x9), or centre-low (9x16, 1x1).
  - Angle: a fixed 6° tilt.
- **The world changes behind it every second.** Each change is a hard change of the ground fill and the portal content only; the phone itself doesn't move:

  | Time | Ground | Portal shows | Phone headline (≥ 96 su) |
  |---|---|---|---|
  | 12.00 | cream | Booking confirmed ✓ · itinerary | **30 days to go** |
  | 13.00 | sand | Documents: Passport ✓ ✓ | **14 days to go** |
  | 14.00 | sage | Packing list 9 / 12 | **7 days to go** |
  | 15.00 | forest | Tomorrow 07:30 · Joseph K. picks you up | **1 day to go** |

- **Caption:** **Their trip, *in their pocket.*** It stays still while the worlds change.
- **Sound:** a tuned hit per world change, each one up a step of the scale; a reminder "ding" layered on top.

### 6 · Trip day: 16.00–20.00
- **In (16.00–16.40):** the same phone flips around its Y axis. The back passes, and the front is now **the driver's phone**: the same device in the same place. The ground stays forest.
- **The driver portal:**
  - Header: **Joseph K. · KDA 123A** (64 su), then `Sofia R. · 2 adults`.
  - Three stops, each dot turning emerald on its beat:
    - 17.0 **Airport pickup · 07:42**
    - 18.0 **En route to the Mara · 10:15**
    - 19.0 **Arrived at camp · 15:30**
- **Caption (16.50), cream on forest:** **No app. *No login.*** (site copy)
- **Sound:** a flip whoosh at 16.0; a pluck at 16.5; a ping per stop.

### 7 · Paid: 20.00–23.00
- **In (20.00–20.60):** the camera pulls back from the phone. The phone shrinks into the booking card's thumbnail on the board, now in the **Confirmed** column, and the ground returns to cream.
- **20.50:** a payment chip drops onto the card with the `SNAPPY` spring: **$7,400 · M-Pesa**.
- **21.00:** the balance flips **$7,400 → $0** and the status becomes **Fully paid** (gold chip).
- **22.00:** the card moves into **Completed**.
- **Caption:** **Paid in *full.***
- **Sound:** a two-note payment chime at 20.5; a hit at 21.0; a pluck at 22.0.

### 8 · End card: 23.00–28.00
- **In (22.60–23.00):** the camera flies through the gold **Fully paid** chip. Its gold fills the frame and contracts into the logo tile.
- **Ground:** cream with ink and forest type (not v1's forest ground).
- **23.00:** the SafariOS mark (gold tile, forest compass) and the **SafariOS** wordmark settle.
- **23.50 / 24.00:** the h1 rises in two lines:
  - **The operating system** (Inter Display 800, ink)
  - ***for safari businesses.*** (Fraunces italic, gold-deep)
- **25.00:** CTA pill (forest, cream text) **Create your workspace →**, with **safarios-demo.vercel.app** under it.
- **25.00–28.00:** hold, with a slow camera creep and nothing new. That's the only 3 s without a new event.
- **Sound:** a big hit at 23.0; plucks on the two h1 lines; a pluck at 25.0; the chord resolves and rings out by 28.0.

---

## Rhythm check
- **New events:** the longest gap is 1.0 s in shots 1–7, and 3.0 s on the end-card hold.
- **Scenes:** 2–5 s each, 8 in total.
- **Hard cuts between product beats:** none. Every change is a fly-through, a pull-back, a morph or a flip. The only "cuts" are the ground changes behind the fixed phone in shot 5.
- **Sync check:** these transitions are invisible to scene detection, so `check.py` measures them through `window.cueBox`, one box per cue.

## Banned-defaults check (CLAUDE.md)
| Banned | Here | Near miss? |
|---|---|---|
| Centred title on gradient | Captions are left-aligned or top-aligned; grounds are flat | 9x16 and 1x1 captions sit top-left, not centred |
| Everything fading in | Masks, springs and morphs; no opacity ramps | — |
| Corner labels, frame borders | None. Timestamps live inside cards | — |
| Glow on UI chrome | None; soft drop shadows only | — |
| Generic particle burst | None. The payment is a single chip, with no confetti | — |
| Near-black ground with one orange accent | Light grounds. Forest appears only as the last portal world and the driver scene (16.0–20.0) | **Yes:** 15.0–20.0 is forest with a gold accent. Forest is green, not black (L ≈ 16 %), and only 5 of 28 s |
| Condensed all-caps display | None. v1's tracked caps eyebrow is dropped | — |
| Monospace readouts | None; tabular Inter figures | — |
| Technique-demo tiles | None | — |
| Coloured-dot full stops | Full stops stay ink, even after a gold Fraunces word | — |

## Borrowed vs new
- **Borrowed:** four strengths, one from each reference, and none of their orders (see the brief's reference table).
- **New:**
  - the structure, all copy except the site lines marked
  - the booking story and its derived values
  - the format system
  - the device-anchored portal countdown
  - the score
