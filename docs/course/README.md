# The course

Eight lessons on making motion graphics with Claude, where every frame is rendered from code.

**How it worked.** I started from an X article about building a motion design studio with Claude Opus 5.5 and used it as a guide, not as gospel. Every claim was checked against primary sources: Anthropic's docs, the tools' own repos and the posts the article cites. Where possible I also tested claims by running code. Anything wrong or unverifiable was corrected or flagged. Each lesson ended with hands-on work in this repo, which was then reviewed and measured.

| # | Lesson | What got built | Biggest correction to the article |
|---|---|---|---|
| 1 | [Code → frames](01-code-to-frames.md) | `seek(t)`, seeded RNG | Opus reads text, images and PDFs, not video or audio |
| 2 | [Studio setup](02-setup.md) | CLAUDE.md + determinism hook | CLAUDE.md is context, not enforcement; hooks enforce |
| 3 | [The prompt ladder](03-prompt-ladder.md) | Reference analysis tools, SafariOS v1 | "Avoid the AI look" doesn't work; name the specific defaults |
| 4 | [Spec prompting](04-spec.md) | Florios morph loop, state checks | A loop's last frame must *not* equal its first |
| 5 | [The render engine](05-renderer.md) | Hardened `render.mjs` | Color tags alone don't fix RGB→YUV math on older ffmpeg |
| 6 | [Springs](06-springs.md) | Exact springs + ODE tests | The article's default spring has 0% overshoot, not "a hair" |
| 7 | [Sound](07-sound.md) | Audio health checks, phone-proof mix | `beats[::4]` is not a downbeat detector |
| 8 | [Brief, critique, ship](08-ship.md) | `/motion-film` skill | Models grade their own work leniently; use a fresh reviewer |

The recurring lesson: **a check only proves what it measures.** Several bugs passed every automated check until a human looked, or a new check was written.

**[References](REFERENCES.md):** every source the course used, grouped by how it was used: opened and checked, via the article, or standard.
