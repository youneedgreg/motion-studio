# Director's brief: <film>

Copy this file to `films/<film>/brief.md` and fill it in. `CLAUDE.md` already holds the studio rules (render contract,
house style, banned defaults, sound targets). Put only **film-specific facts** here.

Run mode: attended          <!-- or: Run mode: unattended -->

## The film
- **One-line goal:** <what the viewer should feel or know after watching>
- **Audience and placement:** <who; phone feed / landing page / keynote; sound on or off at first>
- **CTA / end card:** <product name, domain, action>
- **Format:** <W × H (even)>, <duration> s, <fps> fps, loop: <yes/no>

## Sources
- **Brand source:** <repo path, site URL, or CSS/token file>. Colours come from CSS, never from video frames.
- **Fonts:** <display face>, <UI face>. They are in `assets/fonts/` or downloaded from <official source> under <licence>.
- **Data shown on screen:** <fictional seed file>. Never real customer records.
- **Screens / product states to show:** <list>

## References (2–3)
| Reference | Take from it | Never take |
|---|---|---|
| <file or URL> | <pacing / transitions / type scale / camera> | content, logos, characters, copy |
| | | |

## Beat sheet
| Time | Beat | On screen | Sound |
|---|---|---|---|
| 0.0–2.0 | Hook | | |
| | | | |
| <D−2>–<D> | End card | | |

## Sound
- **Track:** <synthesize / supplied file in assets/>
- **BPM and meter:** <e.g. 120, 3/4>
- **Mood, and what to avoid:** <…>

## Deliverables
- `out/<film>.mp4` plus every `out/<film>-*` check artifact
- <extra cuts, sizes, stills>

---

## Run mode: unattended

Claude can't wait on a clock, so "carry on if I don't answer in 10 minutes" doesn't work. Under
`Run mode: unattended`, Claude runs the whole pipeline (plan → build → verify → critique → deliver) without
stopping for an OK, and follows these rules:

**Ambiguous choices go to `films/<film>/decisions.md`.** Make the choice, write it down, and keep going.
Use one entry per decision:

```
## <short title>
- When: <pipeline step>
- Chose: <what was done>
- Rejected: <the alternative, and why>
- Undo cost: <what would have to change to switch>
```

**Run-stoppers go to `films/<film>/BLOCKED.md`.** Don't guess at these. Write the entry, stop that line of work,
and finish whatever doesn't depend on it:
- a font, image, track or reference with an unclear or restrictive licence
- needing real customer data, credentials, or a sign-in
- the same check failing three times after real fixes
- a check that looks wrong. Never edit a check to make it pass.
- a brief that contradicts itself or `CLAUDE.md`

Use one entry per blocker:

```
## <short title>
- Blocked step: <…>
- Evidence: <check line, frame time, file>
- Tried: <fixes attempted>
- Needs from you: <one specific decision or file>
```

The final report lists every decision and every blocker, as well as the deliverables.
