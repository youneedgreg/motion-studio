# References

Every source the course used, grouped by how it was used. The labels mean:
- **Opened and checked:** I read the source itself and checked the course's claims against it.
- **Via the article:** I know of it only because the article cites it. I didn't open it for this course.
- **Standard:** an established standard or result, used without re-fetching it.

## The guide the course started from

- Movez ([@0xMovez](https://x.com/0xMovez)), *How to build motion design studio with Opus 5.5 (Full-course)*
  - [X article](https://x.com/0xMovez/status/2104216919033192746)
  - [Substack copy](https://movez.substack.com/p/how-to-build-motion-design-studio) (the version I read)

## Anthropic (all opened and checked)

- [Introducing Claude Opus 5.5](https://www.anthropic.com/claude-opus-5-5)
- [Claude Opus 5.5 model specs on Google Cloud](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/partner-models/claude/opus-5-5): inputs, outputs, limits
- [Effort](https://platform.claude.com/docs/en/build-with-claude/effort)
- [Prompting Claude Opus 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5)
- [Claude prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- Claude Code docs:
  - [Setup](https://code.claude.com/docs/en/setup)
  - [CLAUDE.md / memory](https://code.claude.com/docs/en/memory)
  - [Hooks](https://code.claude.com/docs/en/hooks)
  - [Settings](https://code.claude.com/docs/en/settings)
  - [Desktop quickstart](https://code.claude.com/docs/en/desktop-quickstart)
  - [Desktop](https://code.claude.com/docs/en/desktop)
  - [Skills](https://code.claude.com/docs/en/skills)
  - [Plugins](https://code.claude.com/docs/en/plugins)

## Repos and tools (opened and checked)

- [Remotion Agent Skills](https://www.remotion.dev/docs/ai/skills) · [remotion-dev/skills](https://github.com/remotion-dev/skills)
- [HyperFrames by HeyGen](https://github.com/heygen-com/hyperframes)
- [claude-animation-skill by buildwithhanif](https://github.com/buildwithhanif/claude-animation-skill)
- [PDoomVideo by John Heibel](https://github.com/JohnHeibel/PDoomVideo)
- [awesome-opus-5-5-videos by athemeroy](https://github.com/athemeroy/awesome-opus-5-5-videos)
- [What Ships](https://whatships.com), a directory of launch videos
- [MDN: will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)

## Research (opened and checked)

- Panickssery, Bowman and Feng, [LLM Evaluators Recognize and Favor Their Own Generations](https://arxiv.org/abs/2404.13076)
- Wataoka, Takahashi and Ri, [Self-Preference Bias in LLM-as-a-Judge](https://arxiv.org/abs/2410.21819)
- Further reading: Chen et al., [Do LLM Evaluators Prefer Themselves for a Reason?](https://arxiv.org/abs/2504.03846)

## Established standards and results

Standard: I used these without re-fetching them for this course, so they're credited as standards rather than as things I verified.

- **ITU-R BS.1770 / EBU R128:** LUFS loudness and true peak.
- **ITU-R BT.709:** the HD colour matrix (the Lesson 5 colour bug).
- **ITU-R BT.1359:** how far sound and picture can drift before people notice.
- **[OKLab](https://bottosson.github.io/posts/oklab/), by Björn Ottosson:** the perceptual colour space in `lib/color.js`.
- **mulberry32:** the seeded random number generator in `lib/rng.js`. It's commonly attributed to Tommy Ettinger and released into the public domain.
- **The damped harmonic oscillator and the overshoot formula:** from control theory, used in `lib/motion.js`.

## Creators whose posts the article cites (through the article only)

Via the article:

Thariq (@trq212), Tommy D. Rossi (@__morse), Stephan Livera (@stephanlivera), Rob Hallam (@robj3d3), Himanshu (@himanshutwtxs), @twoclipping, Tony Dinh (@tdinh_me), Chain (@achxvi), Rexan Wong (@rexan_wong), Martijn Verbove (@verbove), @NFT_Chen, onur ozcan (@oozn), Vox (@Voxyz_ai), donald (@donaldjewkes), Pleometric (@pleometric), DreW (@devteamdrew), Mable Joseph (@mablesjoseph), @kloss_xyz, @1littlecoder, @sonnylazuardi, @pradeepXkapoor.

## Reference videos (analysed, not redistributed)

- **`refs/launch.mp4`:** mtioon's launch video ([mtioon.com](https://mtioon.com)).
- **`refs/launch2.mp4`, `refs/launch3.mp4`, `refs/launch4.mp4`:** **TODO: name the creators.** Neither the files nor `refs/best-of.md` say whose videos these are. Safari OS v2 takes one technique from each, so each needs a credit here:
  - [ ] `launch2.mp4` (type: the caret is the camera): creator and link
  - [ ] `launch3.mp4` (camera: the device holds still while the world changes): creator and link
  - [ ] `launch4.mp4` (structure: one story through every feature): creator and link

The written analyses (`refs/*/beats.md`, `refs/best-of.md`) are original work. The videos themselves stay local and belong to their owners ([NOTICE.md](../../NOTICE.md)).

## Software and fonts

- **Software:** Claude Code, Playwright and Chromium, FFmpeg, Node.js, Python, NumPy, SciPy, librosa, soundfile, Numba, Pillow.
- **Fonts** (SIL Open Font License):
  - Inter, by Rasmus Andersson
  - Fraunces, by Undercase Type
  - Geist, by Vercel with basement.studio
