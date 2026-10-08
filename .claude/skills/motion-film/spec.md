# State list: <film>

Copy to `films/<film>/spec.md`. Describe the film as states with numbers, not adjectives. "Grows into a card"
can mean anything; "880 × 600, radius 48, at 1.5 s" can't, and `tools/check.py` measures it (±2 px).

Duration D = <D> s · <fps> fps · <bpm> BPM in <meter> · container centre (<cx>, <cy>) · ground `<hex>`

| t (s) | State | w × h (px) | Radius (px) | Fill | Content | Cursor action |
|---|---|---|---|---|---|---|
| 0.00 | <name> | <w> × <h> | <r> | `<hex>` | <text / icon / UI inside> | <what the cursor does to leave this state, e.g. Click "Switch role"> |
| <t1> | | | | | | |
| <t2> | | | | | | |
| … | | | | | | |
| **D** | = row 1 | same as row 1 | same | same | same | (not rendered) |

Rules for the table:
- **The last row is the first state at t = D.** For a loop, the state at `t = D` equals `t = 0`, but frame `t = D` is
  **never rendered**: frames run `0 … N−1`, so the seam has no duplicate frame. Value **and velocity** must match at
  the seam (`springTrack` with `period: D`).
- Put states on bar lines, so each state gets one bar and the loop point is a bar line.
- Every cursor action is a cue in `timeline.json` with an SFX. The container responds on the same frame the cursor clicks.
- Space states far enough apart for the spring to settle. `check.py` measures each state 2 frames before the next action.
  DEFAULT (2.2 Hz, ζ 0.8) settles in 0.27 s; HEAVY 0.66 s; CAMERA 0.70 s.
- Radius ≤ min(w, h) / 2. A full pill is r = h / 2; a circle is w = h = 2r.
- Interpolate fills in OKLab. Two adjacent states with the same fill are fine; give the change to size or content instead.
- Content enters after the morph toward a state starts and leaves before the next morph starts. Text masks must cover the font's full descent.

Copy this table into `timeline.json` as `states`. The keys are `t`, `name`, `w`, `h`, `r`, `fill` and `action`; leave out the D row. Add `container` `{cx, cy}` and `ground` alongside it.
