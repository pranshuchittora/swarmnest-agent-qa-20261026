import { fileKey, MAX_DOWNLOADS } from '../_lib/fulfil.js';
import { PRODUCT_TITLES, canonicalSlug, BUNDLE_MEMBERS } from '../_lib/prices.js';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const base = { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' };
const txt = (body, status) => new Response(body, { status, headers: { ...base, 'content-type': 'text/plain; charset=utf-8' } });
const safePath = (p) => p && !p.split('/').some((s) => !s || s === '.' || s === '..') && p.length < 200;
const enc = (f) => f.split('/').map(encodeURIComponent).join('/');

// Routes: /download/<token> (HTML list) | /download/<token>/zip | /download/<token>/f/<path> (view; ?dl=1 to save)
export async function onRequestGet(ctx) {
  const { params, env } = ctx;
  const parts = [].concat(params.path || []).map(String);
  const t = parts[0] || '';
  if (!/^[0-9a-f]{64}$/.test(t)) return txt('Not found', 404);
  const raw = await env.SIGNUPS.get('dl:' + t);
  const rec = raw && JSON.parse(raw);
  if (!rec || rec.expires < Date.now()) return txt('This download link has expired. Open your purchase confirmation page again for a fresh link, or contact support@swarmnest.ai.', 410);
  const slug = canonicalSlug(rec.slug);
  const sub = parts[1];

  if (!sub) {
    const man = await env.FILES.get('pm:' + slug);
    const files = man ? JSON.parse(man) : [];
    const items = files.map((f) => `<li><a href="/download/${t}/f/${enc(f)}">${esc(f)}</a> <a class="s" href="/download/${t}/f/${enc(f)}?dl=1">save</a></li>`).join('');
    const title = PRODUCT_TITLES[slug] || slug;
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}: your files | Swarmnest</title><style>body{font:16px/1.5 -apple-system,system-ui,sans-serif;max-width:42rem;margin:0 auto;padding:1rem}li{margin:.5rem 0;word-break:break-all}.s{font-size:.8rem;margin-left:.5rem}.btn{display:inline-block;background:#111;color:#fff;padding:.7rem 1.1rem;border-radius:8px;text-decoration:none}</style></head><body><h1>${esc(title)}</h1><p>Tap a file to read it in your browser, or download the whole pack as a zip.</p><p><a class="btn" href="/download/${t}/zip">Download zip</a></p><p>On iPhone, tap a file to read it, or use "save" to keep a copy. The zip opens from the Files app (tap it to unzip).</p><h2>Files</h2><ul>${items || '<li>File list unavailable. Use the zip.</li>'}</ul><p>Link valid until ${new Date(rec.expires).toUTCString()}. License: <a href="/license/">terms</a>. Need help: support@swarmnest.ai</p></body></html>`;
    return new Response(html, { headers: { ...base, 'content-type': 'text/html; charset=utf-8' } });
  }

  if (sub === 'zip' && parts.length === 2) {
    if (rec.count >= MAX_DOWNLOADS) return txt('Download limit reached. Contact support@swarmnest.ai.', 429);
    const f = await env.FILES.get('file:' + fileKey(slug), 'arrayBuffer');
    if (!f) return txt('File unavailable', 500);
    rec.count++;
    await env.SIGNUPS.put('dl:' + t, JSON.stringify(rec), { expirationTtl: Math.max(60, Math.floor((rec.expires - Date.now()) / 1000)) });
    return new Response(f, { headers: { ...base, 'content-type': 'application/zip', 'content-disposition': `attachment; filename="swarmnest-${fileKey(slug)}"` } });
  }

  if (sub === 'f' && parts.length > 2) {
    const rel = parts.slice(2).map((s) => { try { return decodeURIComponent(s); } catch { return ''; } }).join('/');
    if (!safePath(rel)) return txt('Not found', 404);
    let body = await env.FILES.get(`pf:${slug}:${rel}`);
    if (body === null && BUNDLE_MEMBERS[slug]) { const [m, ...rest] = rel.split('/'); if (rest.length && BUNDLE_MEMBERS[slug].includes(m)) body = await env.FILES.get(`pf:${m}:${rest.join('/')}`); }
    if (body === null) return txt('Not found', 404);
    const dl = new URL(ctx.request.url).searchParams.get('dl') === '1';
    const name = rel.split('/').pop().replace(/[^\w.\-]+/g, '_');
    // text/plain (utf-8) renders inline in iOS Safari for every text type, including .md/.json/.py
    return new Response(body, { headers: { ...base, 'content-type': 'text/plain; charset=utf-8', 'content-disposition': `${dl ? 'attachment' : 'inline'}; filename="${name}"`, 'x-content-type-options': 'nosniff' } });
  }
  return txt('Not found', 404);
}
