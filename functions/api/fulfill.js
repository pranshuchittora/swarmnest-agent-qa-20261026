import { grantForSession } from '../_lib/fulfil.js';
export async function onRequestGet({ request, env }) {
  const id = new URL(request.url).searchParams.get('session_id');
  const h = { 'content-type': 'application/json', 'cache-control': 'no-store' };
  try {
    const g = await grantForSession(env, id);
    if (!g) return new Response(JSON.stringify({ ok: false, error: 'Payment not found or not completed.' }), { status: 402, headers: h });
    return new Response(JSON.stringify({ ok: true, slug: g.slug, url: '/download/' + g.token, expires: new Date(g.expires).toISOString() }), { headers: h });
  } catch { return new Response(JSON.stringify({ ok: false, error: 'Could not verify payment.' }), { status: 400, headers: h }); }
}
