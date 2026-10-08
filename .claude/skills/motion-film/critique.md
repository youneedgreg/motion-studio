# Critique rubric

Give this to a **fresh** reviewer subagent, together with:
- the brief
- `out/<film>-contact.png` (one frame per beat)
- `out/<film>-phone.png` (one frame per second at 360 px wide)
- `out/<film>-spectrum.png`
- `out/<film>-wave.png`
- `out/<film>-check.txt`

The reviewer gets no code and no notes from the builder.

---

You did not build this film. Your job is to find what's wrong with it, not to encourage the builder.
Every score under 8 cites a timestamp and an image.

Open every image before you score. You can't watch or hear the film: judge motion from frame-to-frame
differences in the sheets, and sound from the spectrum, the waveform and the numbers in the check report.

**One-line goal (from the brief):** <paste>
**Does the film achieve it?** Answer yes or no, then give one sentence of why.

| # | Criterion | What 8+ looks like | Score 1–10 | Evidence (timestamp + image) |
|---|---|---|---|---|
| 1 | **Hook (first 2 s)** | Something specific and readable by 1 s. No slow fade-up, no logo-on-gradient opener. | | |
| 2 | **Readability at phone size** | In `-phone.png`, every line of text is legible at 360 px. Nothing is clipped, no near-empty frames, and copy stays up long enough to read. | | |
| 3 | **Motion quality** | Moves have weight and settle. Nothing jumps between adjacent beats, overshoot is small, the loop seam is invisible, and there's no "everything fades in". | | |
| 4 | **Variety** | Something new every 2–4 s. Transitions and layouts aren't the same move repeated. | | |
| 5 | **Brand accuracy** | Colours, type and product UI match the brand source. One display face, one UI face, one accent. None of `CLAUDE.md`'s banned defaults. | | |
| 6 | **Sound** | The check report shows cue sync OK, about −14 LUFS, a true peak at or below −1 dBTP, 0 clipped samples and a small-speaker drop under 2 LU. The spectrum has energy above 150 Hz on the hits, and the waveform's density follows the visual pacing. | | |

Rules:
- A score without a named problem doesn't count. "Feels a bit flat" is not a problem; "2.5–4.0 s: three beats show the same card at the same size (contact sheet row 1)" is.
- Use the image names exactly as given: contact sheet row/column, phone sheet second, spectrum, waveform.
- If a check line in `-check.txt` is not `OK`, the film fails. Say so first.
- Don't suggest fixes that break the studio rules (timers, unseeded randomness, banned defaults).

**Output format**

```
Goal met: yes/no — <sentence>

Scores: hook N · phone N · motion N · variety N · brand N · sound N

Worst 3 problems (most damaging first):
1. <t–t s> <problem> — <image> — <suggested direction, not code>
2. …
3. …

Needs a human: <things you can't judge from images and numbers, e.g. how the score sounds, whether a joke lands>
```
