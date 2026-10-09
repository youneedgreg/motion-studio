# Lesson 2: Studio setup

**Stack.** Claude Code (desktop Code tab), Node 22+, Playwright's pinned Chromium, ffmpeg with libx264, and Python in a `.venv` with numpy, scipy, librosa and soundfile.

**Rules vs enforcement.** `CLAUDE.md` holds the house rules (render contract, look, sound, review loop). Anthropic's docs describe CLAUDE.md as *context, not enforced configuration*, so `.claude/hooks/check-determinism.mjs` runs after every Write/Edit. It flags banned calls, and exit code 2 sends the violation back to Claude. In testing, Claude wrote `Math.random()`, the hook flagged it, and Claude rewrote it with the seeded RNG on its own. Lines marked `// preview-only` are exempt.

**Fact-check of the article**
- ❌ "Claude Code can *listen* to the render." Opus has no audio input. Sync is checked numerically.
- ❌ `pip install librosa` fails on Homebrew Python (externally managed). Use a venv.
- ✅ Opus 5.5 defaults to **medium** effort. Use xhigh for new films and medium for small fixes. Run your own comparisons; don't treat these as rules.
- ⚠️ "Only Claude Code can render." Chat sandboxes can run code too, but network allowlists blocked the Chromium download. Local is the practical choice.

**Encoding rules and why**
- Even width and height, because `yuv420p` stores color at half resolution.
- CRF 16 for high quality, and `+faststart` so web players start immediately.
- About −14 LUFS integrated and a true peak of −1 dBTP or lower, measured on the *final* file.

**A real-world snag.** There were two Claude Code installs (an old Homebrew cask and the new native one), and the old one was first on PATH. Fix: put `~/.local/bin` on PATH and uninstall the cask.
