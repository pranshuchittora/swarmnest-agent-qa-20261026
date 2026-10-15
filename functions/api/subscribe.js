// POST /api/subscribe  (form or JSON). Stores signups in KV binding SIGNUPS.
// Record is double-opt-in ready: status "pending" with a confirm token; no email is sent yet.
const RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
const LISTS = ['newsletter', 'waitlist'];
export async function onRequestPost({ request, env }) {
  let data = {};
  const ct = request.headers.get('content-type') || '';
  try {
    if (ct.includes('json')) data = await request.json();
    else data = Object.fromEntries(await request.formData());
  } catch { return reply(request, 400, 'Invalid request.'); }
  if (data.website) return reply(request, 200, 'Thanks!'); // honeypot
  const email = String(data.email || '').trim().toLowerCase();
  if (!RE.test(email) || email.length > 254) return reply(request, 400, 'Please enter a valid email address.');
  const list = LISTS.includes(data.list) ? data.list : 'newsletter';
  const interest = String(data.interest || '').slice(0, 80);
  const key = 'sub:' + email;
  const existing = await env.SIGNUPS.get(key, 'json');
  const rec = existing || {
    email, status: 'pending', created_at: new Date().toISOString(),
    confirm_token: crypto.randomUUID(), unsubscribe_token: crypto.randomUUID(),
    confirmed_at: null, unsubscribed_at: null, lists: [], interests: [],
    consent_text: 'Agreed to receive Swarmnest emails (newsletter/launch updates); unsubscribe any time.',
    source: String(data.source || '').slice(0, 120),
    country: request.headers.get('cf-ipcountry') || null,
  };
  if (!rec.lists.includes(list)) rec.lists.push(list);
  if (interest && !rec.interests.includes(interest)) rec.interests.push(interest);
  await env.SIGNUPS.put(key, JSON.stringify(rec));
  return reply(request, 200, "Thanks! You're on the list. We'll email you a confirmation link before sending anything else.");
}
function reply(request, status, message) {
  const accept = request.headers.get('accept') || '';
  if (accept.includes('application/json')) return Response.json({ ok: status < 400, message }, { status });
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Swarmnest</title><body style="font-family:system-ui;max-width:32rem;margin:4rem auto;padding:0 1rem"><p>${message}</p><p><a href="/">Back to Swarmnest</a></p></body>`;
  return new Response(html, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}
