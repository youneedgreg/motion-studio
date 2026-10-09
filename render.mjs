// Frame-accurate renderer: node render.mjs <filmDir> [--from s] [--to s] [--out file.mp4]
//   [--workers n] [--no-audio] [--frames-only] [--serve] [--format name]
// --format picks one of timeline.json's `formats` (viewport size); the film reads window.filmFormat.
// Each frame is painted by window.seek(frameIndex / fps) and screenshotted. A full render streams the PNGs, in order,
// straight into ffmpeg (nothing is written per frame); --frames dir, --frames-only and --stills write PNGs to disk instead.
// Every request is answered from disk; anything off-origin is aborted, so a render never touches the network.
import { chromium } from 'playwright';
import { readFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'http://film.test';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (!k.startsWith('--')) { a._.push(k); continue; }
    const key = k.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) a[key] = true;
    else { a[key] = next; i++; }
  }
  return a;
}

function fileFor(urlPath) {
  const p = path.normalize(path.join(ROOT, decodeURIComponent(urlPath)));
  if (!(p === ROOT || p.startsWith(ROOT + path.sep))) return null;
  return existsSync(p) ? p : null;
}

const args = parseArgs(process.argv.slice(2));
const filmDir = args._[0] || 'films/reel';
const T = JSON.parse(readFileSync(path.join(ROOT, filmDir, 'timeline.json'), 'utf8'));
// --format 9x16: one of timeline.json's formats. The first format is the master and keeps the plain file name.
const FMT = args.format ? (T.formats || []).find((f) => f.name === args.format) : (T.formats || [])[0] || null;
if (args.format && !FMT) throw new Error(`no format "${args.format}" in timeline.json (have: ${(T.formats || []).map((f) => f.name).join(', ')})`);
const W = FMT ? FMT.width : T.width, H = FMT ? FMT.height : T.height;
if (W % 2 || H % 2) throw new Error('width and height must be even');
const SUFFIX = FMT && T.formats && FMT.name !== T.formats[0].name ? `-${FMT.name}` : '';
const pageUrl = `${ORIGIN}/${filmDir}/index.html`;

if (args.serve) {
  const port = Number(args.serve === true ? 5173 : args.serve);
  createServer((req, res) => {
    const f = fileFor(new URL(req.url, 'http://x').pathname);
    if (!f) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
    res.end(readFileSync(f));
  }).listen(port, () => console.log(`preview: http://localhost:${port}/${filmDir}/index.html`));
} else {
  await render();
}

async function render() {
  const fps = T.fps;
  const from = Number(args.from ?? 0);
  const to = Number(args.to ?? T.duration);
  const first = Math.round(from * fps);
  const last = Math.round(to * fps); // exclusive
  const workers = Number(args.workers ?? 6);
  const name = path.basename(filmDir);
  const out = path.resolve(args.out ?? path.join(ROOT, 'out', `${name}${SUFFIX}.mp4`));
  const stills = typeof args.stills === "string" ? args.stills.split(",").map((s) => Math.round(Number(s) * fps)) : null;
  const toDisk = !!(stills || args['frames-only'] || args.frames);
  const framesDir = path.resolve(args.frames ?? path.join(path.dirname(out), `${path.basename(out, '.mp4')}-frames`));
  if (toDisk && !args['cue-boxes'] && !args['text-audit']) {
    rmSync(framesDir, { recursive: true, force: true });
    mkdirSync(framesDir, { recursive: true });
  }

  const browser = await chromium.launch({
    args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text', '--hide-scrollbars',
      '--disable-gpu-rasterization'],
  });
  const blocked = [];
  const t0 = process.hrtime.bigint();
  let failed = false;
  // after a page error the browser is closing: in-flight seeks/screenshots reject, so park them
  // (never settle) and let fail() finish its exit instead of crashing with a second trace
  const unlessFailed = (e) => { if (failed) return new Promise(() => {}); throw e; };
  async function fail(e, at) {
    if (failed) return;
    failed = true;
    console.error(`page error ${at === null ? 'while loading the film' : `while rendering t=${at.toFixed(4)} s (frame ${Math.round(at * fps)})`}: ${e.message}`);
    await browser.close().catch(() => {});
    process.exit(1);
  }
  // --stills 0.5,1.25 renders just those times (as frame indices) for quick inspection
  const indices = [];
  if (stills) indices.push(...stills);
  else for (let i = first; i < last; i++) indices.push(i);
  const slices = Array.from({ length: workers }, (_, w) => indices.filter((_, j) => j % workers === w));

  async function openPage() {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    if (FMT) await ctx.addInitScript(`window.filmFormat = ${JSON.stringify(FMT)};`);
    // --debug '{"noMasks":true}' sets window.filmDebug before the film's script runs (used by tools/check.py)
    if (typeof args.debug === 'string') await ctx.addInitScript(`window.filmDebug = ${JSON.stringify(JSON.parse(args.debug))};`);
    await ctx.route('**/*', (route) => {
      const u = new URL(route.request().url());
      const f = u.origin === ORIGIN ? fileFor(u.pathname) : null;
      if (!f) { blocked.push(u.href); return route.abort(); }
      return route.fulfill({ status: 200, contentType: MIME[path.extname(f)] || 'application/octet-stream', body: readFileSync(f) });
    });
    const page = await ctx.newPage();
    const at = { t: null };   // the time this page is currently painting
    page.on('pageerror', (e) => fail(e, at.t));
    await page.goto(pageUrl);
    await page.waitForFunction(() => window.filmReady === true, null, { timeout: 30000 });
    return { ctx, page, at };
  }

  // --cue-boxes file.json: the screen box of the element each cue moves (union of just before and
  // just after the cue), or null when the cue changes the whole frame. Used by tools/check.py.
  if (args['cue-boxes']) {
    const { ctx, page, at: now } = await openPage().catch(unlessFailed);
    const boxes = {};
    for (const c of T.cues) {
      const t = (c.beat * 60) / T.bpm;
      const at = async (tt) => { now.t = tt; return page.evaluate(([name, x]) => { window.seek(x); return window.cueBox ? window.cueBox(name) : null; }, [c.name, tt]); };
      const a = await at(Math.max(0, t - 0.05)).catch(unlessFailed), b = await at(t + 0.45).catch(unlessFailed);
      const bs = [a, b].filter(Boolean);
      if (!bs.length) { boxes[c.name] = null; continue; }
      const x0 = Math.min(...bs.map((r) => r[0])), y0 = Math.min(...bs.map((r) => r[1]));
      const x1 = Math.max(...bs.map((r) => r[0] + r[2])), y1 = Math.max(...bs.map((r) => r[1] + r[3]));
      boxes[c.name] = [x0, y0, x1 - x0, y1 - y0].map((v) => Math.round(v));
    }
    const probe = await page.evaluate(() => (window.filmProbe ? window.filmProbe() : null));
    if (probe) boxes._probe = probe;
    await ctx.close();
    await browser.close();
    writeFileSync(path.resolve(args['cue-boxes']), JSON.stringify(boxes, null, 1));
    console.log(`wrote cue boxes for ${Object.keys(boxes).length} cues`);
    return;
  }

  // --text-audit file.json --at 1.2,3.4: at each time, window.filmTextAudit() lists the readable text on screen
  // with its rendered size in px ({ text, px }). Used by tools/check.py for the minimum text size.
  if (args['text-audit']) {
    const { ctx, page, at: now } = await openPage().catch(unlessFailed);
    const res = [];
    for (const t of String(args.at).split(',').map(Number)) {
      now.t = t;
      res.push({ t, items: await page.evaluate((x) => { window.seek(x); return window.filmTextAudit ? window.filmTextAudit() : null; }, t).catch(unlessFailed) });
    }
    await ctx.close();
    await browser.close();
    writeFileSync(path.resolve(args['text-audit']), JSON.stringify(res, null, 1));
    console.log(`wrote text audit for ${res.length} times`);
    return;
  }

  // the encoder starts first and reads PNGs from stdin; workers hand frames over in frame order
  const wav = path.join(ROOT, filmDir, 'score.wav');
  const withAudio = !args['no-audio'] && existsSync(wav);
  let enc = null, encDone = null;
  if (!toDisk) {
    const ff = ['-y', '-v', 'error', '-f', 'image2pipe', '-c:v', 'png', '-framerate', String(fps), '-i', '-'];
    if (withAudio) ff.push('-ss', String(from), '-t', String(to - from), '-i', wav);
    // RGB→YUV explicitly as bt709 limited range on any ffmpeg version; setparams stamps the frames bt709 too,
    // otherwise the PNG input's "unspecified" primaries/transfer win over the -color_* tags below
    ff.push('-map', '0:v', '-vf', 'scale=out_color_matrix=bt709:out_range=tv,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709');
    if (withAudio) ff.push('-map', '1:a', '-c:a', 'aac', '-b:a', '320k');
    ff.push('-movflags', '+faststart', '-t', String(to - from), out);
    enc = spawn('ffmpeg', ff, { stdio: ['pipe', 'inherit', 'inherit'] });
    encDone = new Promise((res) => enc.on('close', res));
  }
  const pending = new Map();
  let next = first;
  let waiters = [];
  async function emit(i, buf) {
    pending.set(i, buf);
    while (pending.has(next)) {   // synchronous take-and-advance keeps the order across workers
      const b = pending.get(next);
      pending.delete(next);
      next++;
      const ok = enc.stdin.write(b);
      waiters.forEach((w) => w());
      waiters = [];
      if (!ok) await new Promise((r) => enc.stdin.once('drain', r));
    }
  }
  // a worker more than 120 frames ahead of the encoder waits, so memory stays bounded
  const keepUp = async (i) => { while (i - next > 120) await new Promise((r) => waiters.push(r)); };

  await Promise.all(slices.map(async (slice) => {
    const { ctx, page, at } = await openPage().catch(unlessFailed);
    try {
      for (const i of slice) {
        at.t = i / fps;
        if (!toDisk) await keepUp(i);
        await page.evaluate((t) => window.seek(t), i / fps);
        if (toDisk) await page.screenshot({ path: path.join(framesDir, stills ? `t_${(i / fps).toFixed(3)}.png` : `f_${String(i - first).padStart(5, "0")}.png`), type: 'png' });
        else await emit(i, await page.screenshot({ type: 'png' }));
      }
      await ctx.close();
    } catch (e) { return unlessFailed(e); }
  }));
  await browser.close();
  if (blocked.length) { console.error('blocked requests (assets must live on disk):', [...new Set(blocked)]); process.exit(1); }
  const secs = Number(process.hrtime.bigint() - t0) / 1e9;
  console.log(`rendered ${indices.length} frames in ${secs.toFixed(1)}s`);
  if (toDisk) return;
  enc.stdin.end();
  const code = await encDone;
  if (code !== 0) process.exit(code ?? 1);
  writeFileSync(out + '.json', JSON.stringify({ film: filmDir, format: FMT ? FMT.name : null, from, to, frames: last - first, audio: withAudio }, null, 1));
  console.log(`wrote ${path.relative(ROOT, out)}${withAudio ? ' (with score)' : ''}`);
}
