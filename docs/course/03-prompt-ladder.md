# Lesson 3: The prompt ladder

**Rungs:**
1. **One-liner:** tests the engine.
2. **Brand prompt:** adds the product and real assets.
3. **Reference prompt:** adds a look.
4. **Spec:** exact states (Lesson 4).
5. **Director's brief:** long unattended runs (Lesson 8).

**What works, per Anthropic's Opus 5.5 guide.** Without design direction, the model falls back to a few default styles, and "avoid a generic AI look" mostly swaps one default for another. What works is **naming specific patterns to ban**, checking what the first result used, and extending the list. I did this with the showreel: dark ground with a single orange accent, condensed all-caps type, monospace parameter readouts, technique-demo tiles and dotted full stops all went onto the banned list.

**Measure, don't eyeball.** Reference analysis uses tools, not guesses:
- Frames are extracted at 2 fps. The contact sheet is sized to the video's duration; a fixed 6×3 grid cut off at 9 s.
- **Scene detection only finds hard cuts.** On a motion-design reference, 0.3 found 3 cuts and 0.15 found 9, but pushes, zooms and morphs needed a hand-written `beats.md`.
- The palette is measured by `palette.py`, with a saturation filter to pull out accent colors. Pure `#D97757` came back as `#d77655` after H.264 encoding, so brand colors come from CSS, never from video frames.

**Fact-check of the article**
- ⚠️ The athemeroy dataset uses the term "brief contagion" only as a one-line caption. It isn't quantified anywhere.
- ⚠️ "Go all out" is an explicit request for ambition (supported), not an effort setting.
- ⚠️ "One session per brand" is fragile. Keep assets and style guides as files instead.

**What I learned the hard way.** With **one** reference, SafariOS v1 copied the reference's structure shot for shot with new content. Use 2–3 references and say what to take from each.
