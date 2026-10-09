// End-of-lesson quizzes and flashcards, written from each lesson's own text (docs/course/0N-*.md).
export type Question = { q: string; options: string[]; answer: number; why: string };
export type Card = { front: string; back: string };
export type Practice = { quiz: Question[]; cards: Card[] };

export const PRACTICE: Record<string, Practice> = {
  '01-code-to-frames': {
    quiz: [
      { q: 'What does a film’s window.seek(t) have to do?', answer: 1,
        options: ['Advance the animation by one frame', 'Paint the exact frame for time t, remembering nothing between calls', 'Start a requestAnimationFrame loop at time t', 'Record the browser clock so frames line up'],
        why: 'A headless browser calls seek(t) for every frame, in any order and across parallel workers, so the frame must depend on t alone.' },
      { q: 'Which inputs does Claude Opus 5.5 accept?', answer: 2,
        options: ['Text, images and video', 'Text and audio', 'Text, images and PDFs', 'Any file type'],
        why: 'It has no video or audio input, so “show it a video” means extracting frames for it to look at.' },
      { q: 'What fixes float accumulation such as t += 1/60?', answer: 0,
        options: ['t = frameIndex / fps', 'Reading Date.now each frame', 'Rounding t to 3 decimals', 'Using performance.now'],
        why: 'Deriving t from the frame index gives the same value every time; summing a fraction drifts.' },
    ],
    cards: [
      { front: 'The six enemies of determinism', back: 'Wall-clock time, carried state, unseeded randomness, float accumulation, assets not loaded, and the environment (GPU, OS, browser).' },
      { front: 'Where is the seeded RNG created?', back: 'Inside the draw call, so no state carries between frames: rng(seed) from lib/rng.js (mulberry32).' },
      { front: 'The second strategy, besides a pure seek(t)', back: 'Seek an animation engine (WAAPI currentTime, GSAP seek) or fake the browser clock. HyperFrames works this way.' },
    ],
  },
  '02-setup': {
    quiz: [
      { q: 'How do Anthropic’s docs describe CLAUDE.md?', answer: 0,
        options: ['As context, not enforced configuration', 'As a permissions file the harness enforces', 'As a hook that runs after every edit', 'As a file only the desktop app reads'],
        why: 'That is why the studio adds a hook: rules in CLAUDE.md are read, not enforced.' },
      { q: 'What does the determinism hook’s exit code 2 do?', answer: 2,
        options: ['Blocks the next git commit', 'Deletes the offending file', 'Sends the violation back to Claude', 'Nothing; only exit code 1 matters'],
        why: 'In testing, Claude wrote Math.random, the hook flagged it, and Claude rewrote it with the seeded RNG.' },
      { q: 'Why must width and height be even?', answer: 3,
        options: ['H.264 needs multiples of 16', 'Browsers round odd sizes', 'Even sizes encode faster', 'yuv420p stores colour at half resolution'],
        why: 'With colour sampled at half resolution in both directions, an odd dimension has no whole chroma sample at its edge.' },
    ],
    cards: [
      { front: 'Why did pip install librosa fail?', back: 'Homebrew Python is “externally managed”. Use a venv (./.venv) and call .venv/bin/pip.' },
      { front: 'The loudness targets', back: 'About −14 LUFS integrated and a true peak at or below −1 dBTP, measured on the final file.' },
      { front: 'What does +faststart do?', back: 'Moves the mp4’s index to the front, so web players can start before the whole file has downloaded.' },
    ],
  },
  '03-prompt-ladder': {
    quiz: [
      { q: 'What works better than “avoid a generic AI look”?', answer: 1,
        options: ['More adjectives about the mood', 'Naming specific patterns to ban, then extending the list', 'A higher effort setting', 'A longer prompt'],
        why: 'Without design direction the model swaps one default for another. Named bans (for example, condensed all-caps type) actually remove them.' },
      { q: 'On a motion-design reference, what does scene detection find?', answer: 0,
        options: ['Only hard cuts', 'Every transition, including pushes and morphs', 'The beat grid', 'The palette'],
        why: 'At 0.15 it found 9 cuts; pushes, zooms and morphs needed a hand-written beats.md.' },
      { q: 'Why do brand colours come from CSS, never from video frames?', answer: 2,
        options: ['Frames are too small', 'CSS is faster to read', 'H.264 shifts colours: #D97757 came back as #d77655', 'Video frames are copyrighted'],
        why: 'Compression and the YUV round trip move colours slightly, so measured frame colours aren’t the brand’s.' },
    ],
    cards: [
      { front: 'The five rungs of the prompt ladder', back: 'One-liner, brand prompt, reference prompt, spec, director’s brief.' },
      { front: 'What went wrong with one reference?', back: 'SafariOS v1 copied its structure shot for shot. Use 2–3 references and say what to take from each.' },
      { front: '“Go all out” is…', back: 'An explicit request for ambition, not an effort setting.' },
    ],
  },
  '04-spec': {
    quiz: [
      { q: 'For a loop of duration D at F fps, which frames are rendered?', answer: 1,
        options: ['0 … N, including t = D', '0 … N−1; t = D is never rendered', 'Only frames on beats', '0 … N, with the last frame equal to the first'],
        why: 'The state at t = D equals t = 0, so rendering it would duplicate a frame and cause a hitch. Velocity must match at the seam too.' },
      { q: 'Which colour space are fills interpolated in?', answer: 3,
        options: ['RGB', 'HSL', 'sRGB with gamma', 'OKLab'],
        why: 'RGB goes muddy at the midpoint; OKLab mixes perceptually (lib/color.js).' },
      { q: 'Every check passed, yet text was clipped at its baseline. Why?', answer: 0,
        options: ['The geometry check measured boxes, not text', 'The renderer skipped fonts', 'The tolerance was too loose', 'The film looped too early'],
        why: 'A check only proves what it measures. The fix: masks cover the font’s full descent, plus a check that re-renders with masks off and requires identical pixels.' },
    ],
    cards: [
      { front: 'A spec line in numbers, not adjectives', back: '“880 × 600, radius 48, at 1.5 s”, which check.py measures to within ±2 px.' },
      { front: 'The morph content rule', back: 'Content enters after a morph starts and leaves before the next one starts.' },
      { front: 'What did Florios measure?', back: '8/8 states within ±2 px, with loop value and velocity differences of exactly 0.' },
    ],
  },
  '05-renderer': {
    quiz: [
      { q: 'How was rendering with parallel workers shown to be safe?', answer: 2,
        options: ['By watching the output', 'By comparing file sizes', '--workers 1 and --workers 6 gave 720/720 identical frame hashes', 'By rendering twice on one worker'],
        why: 'Parallel workers are only valid because seek(t) is pure, and the hashes prove it for that film.' },
      { q: 'What does -colorspace bt709 on its own do?', answer: 0,
        options: ['Only tags the file; the RGB→YUV maths is a separate step', 'Converts the colours to BT.709', 'Fixes colours on every ffmpeg version', 'Changes the pixel format'],
        why: 'On ffmpeg 6.1, #10b981 decoded as (0, 163, 126). The fix is an explicit scale=out_color_matrix=bt709 plus setparams.' },
      { q: 'Why load each font explicitly with document.fonts.load()?', answer: 3,
        options: ['It is faster', 'Chromium requires it for woff2', 'It avoids network requests', 'fonts.ready alone misses fonts that only a canvas uses'],
        why: 'The renderer waits for a window.filmReady handshake after the explicit loads.' },
    ],
    cards: [
      { front: 'The four bugs found in the renderer audit', back: '%20 in paths (use fileURLToPath); root containment (ROOT + path.sep); colour maths vs tags; page errors kept rendering broken frames (fail fast).' },
      { front: 'tmix with 4 subframes is…', back: 'A 270° shutter looking forward from each frame time. Film convention is 180°.' },
      { front: 'How does the renderer stay off the network?', back: 'Every request is served from disk under a fake origin; anything else is blocked and fails the render.' },
    ],
  },
  '06-springs': {
    quiz: [
      { q: 'Which damping ratios overshoot?', answer: 0,
        options: ['ζ below 1', 'Exactly ζ = 1', 'ζ above 1', 'All of them, a little'],
        why: 'ζ = 1 is the fastest approach with no overshoot; above 1 is slower still. Overshoot = exp(−πζ/√(1−ζ²)).' },
      { q: 'The article’s default spring (k = 170, d = 26) overshoots by…', answer: 1,
        options: ['“A hair”, about 2 %', '0 %: its ζ is 0.997', '16 %', 'It returns NaN'],
        why: 'Measured, not assumed: ζ = 0.997 means no visible overshoot.' },
      { q: 'When does easing beat a spring?', answer: 2,
        options: ['When the target changes mid-motion', 'When you need velocity to carry over', 'When something must end exactly on a beat', 'Never'],
        why: 'Springs win on retargeting; easing wins when an exact landing time matters.' },
    ],
    cards: [
      { front: 'The spring equation', back: 'acceleration = ω₀²(target − x) − 2ζω₀ · velocity' },
      { front: 'DEFAULT preset, measured', back: '2.2 Hz, ζ 0.8: 1.5 % overshoot, settles (2 %) in 0.27 s.' },
      { front: 'Why springTrack is exact', back: 'The spring equation is linear, so one spring per target change sums to exactly a retargeted spring (a simulation matched to 0.00005).' },
    ],
  },
  '07-sound': {
    quiz: [
      { q: 'Why measure loudness on the final mp4, not the WAV?', answer: 3,
        options: ['The WAV is mono', 'ffmpeg can’t read WAVs', 'Players normalise WAVs', 'AAC encoding added overshoot: −1.61 in the WAV became −1.5 dBTP in the mp4'],
        why: 'The −1 dBTP margin exists because codecs add peaks.' },
      { q: 'In the phone test, which source held most of the lost low energy?', answer: 1,
        options: ['The bass', 'The kick', 'The pad', 'The reverb'],
        why: 'Muting sources one at a time showed it. Fixes took the drop from 2.9 LU to 1.7 LU.' },
      { q: 'Why is downbeats = beats[::4] wrong?', answer: 0,
        options: ['It assumes 4/4 and a correct phase; Florios is in 3/4', 'It is too slow', 'beat_track returns downbeats already', 'It only works on WAV files'],
        why: 'beat_track doesn’t find downbeats. A synthesised score writes its grid to beats.json as ground truth.' },
    ],
    cards: [
      { front: 'Two paths to sound', back: 'A supplied track must be analysed (and analysis can be wrong); a synthesised score knows its grid, so beats.json is ground truth.' },
      { front: 'The tautology that was removed', back: '“sfx ↔ cues 0.00 ms” compared the cue list with itself. It is now labelled internal consistency; real sync is measured in pixels.' },
      { front: 'Building a frequency sweep', back: 'Build the phase with a cumulative sum. sin(2π(600 + 900t)t) actually sweeps at 600 + 1800t Hz.' },
    ],
  },
  '08-ship': {
    quiz: [
      { q: 'In an unattended run, where does a run-stopper go?', answer: 2,
        options: ['decisions.md', 'A guess, logged afterwards', 'BLOCKED.md', 'The brief'],
        why: 'Unclear licences, a need for real customer data or a check failing three times stop that line of work. Ambiguous choices go to decisions.md.' },
      { q: 'Why is the critic a fresh subagent?', answer: 0,
        options: ['AI evaluators recognise and favour their own outputs', 'It is faster', 'It can hear the audio', 'It has a bigger context window'],
        why: 'Self-preference bias is documented in research; the reviewer sees only the brief, images and check report.' },
      { q: 'Which rule in the skill matters most?', answer: 3,
        options: ['Use xhigh effort', 'Always render 1080p', 'Run three critique rounds', 'Never edit a check to make it pass'],
        why: 'A check that bends to the film proves nothing.' },
    ],
    cards: [
      { front: 'What goes in a director’s brief?', back: 'Only film-specific facts: goal, audience, CTA, brand source, fictional data source, references and what to take from each, beat sheet, deliverables.' },
      { front: 'Critique rules', back: 'Objective checks pass first; any score under 8 cites a timestamp and an image; at most 3 rounds; a human judges last.' },
      { front: 'Why “carry on if I don’t answer in 10 minutes” fails', back: 'Claude can’t wait on a clock. Unattended mode logs choices to decisions.md instead.' },
    ],
  },
};
