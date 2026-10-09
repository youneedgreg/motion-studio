// Copies the studio's content into the site: node scripts/sync.mjs (from site/ or anywhere)
//   content/course/*.md        the course (docs/course)
//   content/checks/*.txt       the latest tools/check.py report per film and format (out/<name>-check.txt)
//   content/test_motion.txt    a fresh run of tools/test_motion.mjs
//   content/films.json         every film, its formats and which assets exist
//   content/story.json         one milestone per merged pull request, from the git history
//   public/videos/<name>.mp4   web versions: H.264 CRF 23, at most 1920 wide, +faststart, AAC 128k
//   public/videos/<name>.jpg   a poster frame
//   public/films/<name>-{contact,spectrum}.jpg, -wave.png
//   public/fonts/*.woff2       the two faces the site uses
// out/ is gitignored and Vercel never sees it, so everything written here is committed.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.resolve(SITE, '..');
const OUT = path.join(ROOT, 'out');
const C = path.join(SITE, 'content');
const P = path.join(SITE, 'public');
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20, ...opts });
const fresh = (src, dst) => existsSync(dst) && statSync(dst).size > 0 && statSync(dst).mtimeMs >= statSync(src).mtimeMs;   // skip work already done
// ffmpeg writes to a temporary name and the result is renamed into place, so an interrupted run never leaves a stub that looks done
function ffmpegTo(dst, args) {
  const tmp = dst.replace(/(\.\w+)$/, '.partial$1');
  run('ffmpeg', ['-v', 'error', '-y', ...args, tmp]);
  renameSync(tmp, dst);
}
for (const d of [C, path.join(C, 'course'), path.join(C, 'checks'), path.join(P, 'videos'), path.join(P, 'films'), path.join(P, 'fonts')]) mkdirSync(d, { recursive: true });

// ---------- course
const courseDir = path.join(ROOT, 'docs/course');
rmSync(path.join(C, 'course'), { recursive: true, force: true });
mkdirSync(path.join(C, 'course'));
for (const f of readdirSync(courseDir).filter((f) => f.endsWith('.md'))) copyFileSync(path.join(courseDir, f), path.join(C, 'course', f));

// ---------- fonts
copyFileSync(path.join(ROOT, 'assets/fonts/inter/InterVariable.woff2'), path.join(P, 'fonts/InterVariable.woff2'));
copyFileSync(path.join(ROOT, 'assets/fonts/fraunces/fraunces-latin-full-italic.woff2'), path.join(P, 'fonts/fraunces-italic.woff2'));

// ---------- films: every films/<name>/timeline.json, every format it renders
const POSTER_AT = { 'safarios-v2': 13.75, safarios: 9.5, 'florios-morph': 1.9, reel: 2.4 };   // a frame that reads on its own
const films = [];
for (const name of readdirSync(path.join(ROOT, 'films')).sort()) {
  const tl = path.join(ROOT, 'films', name, 'timeline.json');
  if (!existsSync(tl)) continue;
  const T = JSON.parse(readFileSync(tl, 'utf8'));
  const fmts = T.formats?.length ? T.formats : [{ name: null, width: T.width, height: T.height }];
  const outputs = [];
  fmts.forEach((f, i) => {
    const out = name + (f.name && i > 0 ? `-${f.name}` : '');
    const o = { format: f.name ?? `${T.width}x${T.height}`, width: f.width, height: f.height, name: out };
    const src = path.join(OUT, `${out}.mp4`);
    if (existsSync(src)) {
      const dst = path.join(P, 'videos', `${out}.mp4`);
      if (!fresh(src, dst)) {
        console.log(`encoding ${out}.mp4`);
        ffmpegTo(dst, ['-i', src, '-vf', "scale='min(1920,iw)':-2", '-c:v', 'libx264', '-preset', 'slow', '-crf', '23',
          '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart']);
      }
      const poster = path.join(P, 'videos', `${out}.jpg`);
      if (!fresh(src, poster)) ffmpegTo(poster, ['-ss', String(POSTER_AT[name] ?? T.duration * 0.4), '-i', src, '-frames:v', '1',
        '-vf', "scale='min(1920,iw)':-2", '-q:v', '3']);
      o.video = `/videos/${out}.mp4`;
      o.poster = `/videos/${out}.jpg`;
      o.videoBytes = statSync(dst).size;
    }
    const check = path.join(OUT, `${out}-check.txt`);
    if (existsSync(check)) {
      copyFileSync(check, path.join(C, 'checks', `${out}.txt`));
      o.check = `${out}.txt`;
      o.checkedAt = statSync(check).mtime.toISOString();
    }
    for (const [kind, ext] of [['contact', 'jpg'], ['spectrum', 'jpg'], ['wave', 'png']]) {
      const s = path.join(OUT, `${out}-${kind}.png`);
      if (!existsSync(s)) continue;
      const d = path.join(P, 'films', `${out}-${kind}.${ext}`);
      if (ext === 'png') copyFileSync(s, d);
      else if (!fresh(s, d)) ffmpegTo(d, ['-i', s, '-q:v', '3']);
      o[kind] = `/films/${out}-${kind}.${ext}`;
    }
    outputs.push(o);
  });
  films.push({ name, fps: T.fps, duration: T.duration, bpm: T.bpm, beatsPerBar: T.beatsPerBar, loop: !!T.loop, cues: T.cues?.length ?? 0, outputs });
}
writeFileSync(path.join(C, 'films.json'), JSON.stringify(films, null, 1));

// ---------- tests: a fresh run of the spring tests
const tm = run('node', ['tools/test_motion.mjs']);
writeFileSync(path.join(C, 'test_motion.txt'), tm);

// ---------- story: one milestone per merged pull request on main (first-parent merges), oldest first
const base = ['origin/main', 'main'].find((r) => { try { run('git', ['rev-parse', '--verify', '-q', r]); return true; } catch { return false; } });
const merges = run('git', ['log', '--first-parent', '--merges', '--reverse', '--format=%H%x1f%aI%x1f%s%x1f%b%x1e', base])
  .split('\x1e').map((r) => r.trim()).filter(Boolean).map((r) => r.split('\x1f'));
const story = [];
const first = run('git', ['rev-list', '--max-parents=0', base]).trim().split('\n')[0];
story.push({ pr: null, date: run('git', ['log', '-1', '--format=%aI', first]).trim(), title: 'Initial commit', branch: null, commits: [], files: 0, insertions: 0, deletions: 0, areas: [] });
for (const [sha, date, subject, body] of merges) {
  const m = subject.match(/^Merge pull request #(\d+) from [^/]+\/(.+)$/);
  if (!m) continue;
  const commits = run('git', ['log', '--no-merges', '--reverse', '--format=%s', `${sha}^1..${sha}^2`]).trim().split('\n').filter(Boolean);
  let title = (body || '').split('\n').map((l) => l.trim()).find(Boolean) || commits[0] || subject;
  if (/^Merge pull request/.test(title)) title = commits[0] || title;   // a PR merged from main carries the inner merge's title
  const stat = run('git', ['diff', '--shortstat', `${sha}^1`, sha]);
  const num = (re) => Number((stat.match(re) || [0, 0])[1]);
  const names = run('git', ['diff', '--name-only', `${sha}^1`, sha]).trim().split('\n').filter(Boolean);
  const areas = Object.entries(names.reduce((a, f) => {
    const k = f.includes('/') ? f.split('/').slice(0, f.startsWith('films/') || f.startsWith('docs/') || f.startsWith('.claude/') ? 2 : 1).join('/') : f;
    a[k] = (a[k] || 0) + 1;
    return a;
  }, {})).sort((x, y) => y[1] - x[1]).map(([k, n]) => ({ path: k, files: n }));
  if (!names.length) continue;   // a PR that only merged main back into its branch changed nothing on main
  story.push({ pr: Number(m[1]), branch: m[2], date, title, commits, files: num(/(\d+) files? changed/), insertions: num(/(\d+) insertions?/), deletions: num(/(\d+) deletions?/), areas });
}
writeFileSync(path.join(C, 'story.json'), JSON.stringify(story, null, 1));

console.log(`synced: ${readdirSync(path.join(C, 'course')).length} course files, ${films.length} films (${films.reduce((n, f) => n + f.outputs.length, 0)} outputs), ${story.length} milestones from ${base}`);
