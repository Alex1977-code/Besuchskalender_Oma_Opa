// Kleiner Server ohne Abhängigkeiten: liefert die App aus und gleicht Besuche pro Familien-Code ab.
// Start: node server.js   (Port über PORT, Datenordner über DATA_DIR)
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const ROOT = __dirname;
const STATIC = new Set(['/index.html', '/manifest.webmanifest', '/sw.js']);
const TYPES = { '.html': 'text/html; charset=utf-8', '.webmanifest': 'application/manifest+json', '.js': 'text/javascript' };
const MAX_BODY = 1024 * 1024;
const TOMBSTONE_TTL = 90 * 24 * 3600 * 1000;

fs.mkdirSync(DATA_DIR, { recursive: true });

const fileFor = code => path.join(DATA_DIR, crypto.createHash('sha256').update(code).digest('hex') + '.json');
const readStore = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return []; } };

function clean(v) {
  if (!v || typeof v.id !== 'string' || v.id.length > 64 || !Number.isFinite(v.updatedAt)) return null;
  if (v.deleted) return { id: v.id, deleted: true, updatedAt: v.updatedAt };
  if (typeof v.who !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v.date || '')) return null;
  const s = (x, n) => String(x ?? '').slice(0, n);
  return { id: v.id, who: s(v.who, 80), date: v.date, from: s(v.from, 5), to: s(v.to, 5), note: s(v.note, 500), updatedAt: v.updatedAt };
}

// Last-write-wins pro Besuch; Löschungen bleiben als Markierung erhalten.
function merge(a, b) {
  const map = new Map();
  for (const v of [...a, ...b]) {
    const c = clean(v);
    if (c && (!map.has(c.id) || map.get(c.id).updatedAt < c.updatedAt)) map.set(c.id, c);
  }
  const now = Date.now();
  return [...map.values()].filter(v => !v.deleted || now - v.updatedAt < TOMBSTONE_TTL);
}

const queues = new Map(); // serialisiert Schreibzugriffe je Datei
function withLock(f, fn) {
  const next = (queues.get(f) || Promise.resolve()).then(fn, fn);
  queues.set(f, next.catch(() => {}));
  return next;
}

function handleSync(req, res) {
  const code = String(req.headers['x-family-code'] || '').trim();
  if (code.length < 6 || code.length > 100) return send(res, 400, { error: 'invalid code' });
  let body = '', size = 0, aborted = false;
  req.on('data', c => {
    size += c.length;
    if (size > MAX_BODY) { aborted = true; send(res, 413, { error: 'too large' }); req.destroy(); }
    else body += c;
  });
  req.on('end', () => {
    if (aborted) return;
    let incoming;
    try { incoming = JSON.parse(body).visits; if (!Array.isArray(incoming)) throw 0; }
    catch { return send(res, 400, { error: 'bad body' }); }
    const f = fileFor(code);
    withLock(f, async () => {
      const merged = merge(readStore(f), incoming);
      const tmp = f + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(merged));
      fs.renameSync(tmp, f);
      send(res, 200, { visits: merged });
    }).catch(() => send(res, 500, { error: 'server error' }));
  });
}

function send(res, status, obj) {
  if (res.headersSent) return;
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/sync' && req.method === 'POST') return handleSync(req, res);
  let p = url.pathname === '/' ? '/index.html' : url.pathname;
  if (req.method !== 'GET' || !STATIC.has(p)) { res.writeHead(404); return res.end('Not found'); }
  fs.readFile(path.join(ROOT, p), (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(buf);
  });
});

if (require.main === module) server.listen(PORT, () => console.log(`Besuchskalender läuft auf http://localhost:${PORT}`));
module.exports = { server, merge };
