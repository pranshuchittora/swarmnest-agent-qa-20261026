import { fileKey, MAX_DOWNLOADS } from '../_lib/fulfil.js';
export async function onRequestGet({ params, env }) {
  const t = String(params.token || '');
  if (!/^[0-9a-f]{64}$/.test(t)) return new Response('Not found', { status: 404 });
  const raw = await env.SIGNUPS.get('dl:' + t);
  const rec = raw && JSON.parse(raw);
  if (!rec || rec.expires < Date.now()) return new Response('This download link has expired. Use your purchase confirmation page or contact hello@swarmnest.ai.', { status: 410 });
  if (rec.count >= MAX_DOWNLOADS) return new Response('Download limit reached. Contact hello@swarmnest.ai.', { status: 429 });
  const f = await env.FILES.get('file:' + fileKey(rec.slug), 'arrayBuffer');
  if (!f) return new Response('File unavailable', { status: 500 });
  rec.count++;
  await env.SIGNUPS.put('dl:' + t, raw && JSON.stringify(rec), { expirationTtl: Math.max(60, Math.floor((rec.expires - Date.now()) / 1000)) });
  return new Response(f, { headers: { 'content-type': 'application/zip', 'content-disposition': `attachment; filename="swarmnest-${fileKey(rec.slug)}"`, 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
}
