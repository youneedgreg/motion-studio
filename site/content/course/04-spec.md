# Lesson 4: Spec prompting, the state list

**Core idea.** Describe the film as a table of states with numbers (w×h, radius, fill, content and time) rather than adjectives. "Grows into a card" can mean anything; "880 × 600, radius 48, at 1.5 s" can't, and you can check it.

**Morph rules**
- One spring track per property.
- Content enters after a morph starts and leaves before the next one starts.
- Fills are interpolated in OKLab (`lib/color.js`), not RGB, which goes muddy at the midpoint.

**Loops, correctly.** For duration D at F fps, render frames `0 … N−1`. The state at `t = D` equals the state at `t = 0`, but **`t = D` is never rendered**, because a duplicated frame causes a hitch. Velocity must match at the seam too.

**Testable specs.** `check.py` renders each state's time, measures the container, and fails if it's off by more than 2 px. Florios morph: 8/8 states OK, and the loop value and velocity differences were exactly 0.

**A check only proves what it measures.** Every check passed, but text inside the shapes was clipped at its baseline. The geometry check looked at boxes, not text. Fix: masks cover the font's full descent, plus a new check that re-renders each state with masks off and requires identical pixels.

**Fact-check of the article**
- ❌ "@verbove's film used an XML spec." His own post says he showed Opus one viral post and wrote a one-line prompt.
- ❌ "The last frame must equal the first": see the loop rule above.
- ⚠️ The `will-change` gotcha is real for DOM layers but irrelevant to canvas rendering.
- ✅ XML tags help structure mixed prompts (Anthropic's docs). Markdown works too.
