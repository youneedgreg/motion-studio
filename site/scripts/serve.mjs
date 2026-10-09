// Serves the static export (out/) for a local check: node scripts/serve.mjs [port]
// Directory URLs map to their index.html (trailingSlash export); video requests get byte ranges, as browsers expect.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'out');
const PORT = Number(process.argv[2] || 4321);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain',
  '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.ico': 'image/x-icon' };

createServer((req, res) => {
  let p = path.normalize(path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (!p.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  if (existsSync(p) && statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!existsSync(p)) { p = path.join(ROOT, '404.html'); res.statusCode = 404; }
  const size = statSync(p).size, type = TYPES[path.extname(p)] || 'application/octet-stream';
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
  if (range && res.statusCode !== 404) {
    const a = range[1] ? Number(range[1]) : 0, b = range[2] ? Number(range[2]) : size - 1;
    res.writeHead(206, { 'content-type': type, 'content-range': `bytes ${a}-${b}/${size}`, 'accept-ranges': 'bytes', 'content-length': b - a + 1 });
    createReadStream(p, { start: a, end: b }).pipe(res);
    return;
  }
  res.setHeader('content-type', type);
  res.setHeader('content-length', size);
  res.setHeader('accept-ranges', 'bytes');
  createReadStream(p).pipe(res);
}).listen(PORT, () => console.log(`site: http://localhost:${PORT}/`));
