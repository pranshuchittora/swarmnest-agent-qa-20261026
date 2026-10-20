// Serves a submitted logo (or, with &kind=banner, the sitewide banner). Owner: ?session_id=... (the private checkout id). Admin: ?session_id=...&key=<adminKey from the email>.
import { SID_RE, recKey, logoKey, bannerKey, rateLimit } from '../../_lib/sponsor-details.js';
export async function onRequestGet({ request, env }, deps = {}) {
  if (!(await rateLimit(request, 'sd-logo', 120, 600, deps.cache))) return new Response('Too many requests', { status: 429 });
  const u = new URL(request.url); const sid = u.searchParams.get('session_id') || '';
  if (!SID_RE.test(sid)) return new Response('Not found', { status: 404 });
  const rec = JSON.parse((await env.SIGNUPS.get(recKey(sid))) || 'null');
  const kind = u.searchParams.get('kind') === 'banner' ? 'banner' : 'logo';
  const m = rec?.[kind];
  if (!m) return new Response('Not found', { status: 404 });
  const key = u.searchParams.get('key');
  if (key !== null && key !== rec.adminKey) return new Response('Not found', { status: 404 });
  const buf = await env.SIGNUPS.get((kind === 'banner' ? bannerKey : logoKey)(sid), 'arrayBuffer');
  if (!buf) return new Response('Not found', { status: 404 });
  return new Response(buf, { headers: { 'content-type': m.type, 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; sandbox", 'x-robots-tag': 'noindex' } });
}
