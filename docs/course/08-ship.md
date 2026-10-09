# Lesson 8: Brief, critique, ship

**The director's brief** is for long or unattended films. CLAUDE.md holds studio rules; the brief holds only film-specific facts: one-line goal, audience, CTA, brand source, fictional data source, references (and what to take from each), beat sheet, deliverables.

**Unattended runs.** Claude can't wait on a clock for you, so "continue if I don't answer in 10 minutes" doesn't work. Instead:
- Ambiguous choices go into `decisions.md`, with the rejected alternative.
- Run-stoppers go into `BLOCKED.md` instead of being guessed: unclear licences, a need for real customer data, or a check failing three times.

**The critique loop, done properly**
1. **Objective checks first.** `check.py` must pass before any critique. It covers determinism, sync, state geometry, text visibility, loudness, clipping and the small-speaker test.
2. **A fresh reviewer.** Research finds AI evaluators recognize and favor their own outputs (self-preference bias). The reviewer is a separate subagent that sees only the brief, the contact, phone and spectrum images, and the check report.
3. **Evidence-backed scores.** Any score under 8 must cite a timestamp and an image. Maximum 3 rounds.
4. **A human last.** Taste, humor and music are judged by a person.

**Packaging.** The whole pipeline is a project skill at `.claude/skills/motion-film/`, containing `SKILL.md` plus brief, critique and spec templates. One rule in it matters most: **never edit a check to make it pass.**

**Fact-check of the article**
- ✅ PDoom: Opus wrote `ANIMATION_GUIDE.md` for parallel subagents and `STORYBOARD.md`, with nine chapters (confirmed in the repo).
- ⚠️ Self-scoring alone is lenient; use a separate reviewer.
- ⚠️ "$1,000 per video, delivered in an afternoon" is one anecdote, not market pricing.
