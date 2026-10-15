import { PRICE_TO_SLUG, FILE_VERSION } from './prices.js';
export const TTL_SECONDS = 72 * 3600;
export const MAX_DOWNLOADS = 10;
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
export function newToken() { return hex(crypto.getRandomValues(new Uint8Array(32))); }

export async function stripeGet(env, path, fetchImpl) {
  const r = await (fetchImpl || ((u,o)=>fetch(u,o)))('https://api.stripe.com/v1/' + path, { headers: { Authorization: 'Bearer ' + env.STRIPE_API_KEY } });
  if (!r.ok) throw new Error('stripe ' + r.status);
  return r.json();
}
// Returns {slug} if session is paid and for one of our products, else null.
export function sessionToSlug(session) {
  if (!session || session.object !== 'checkout.session' || session.payment_status !== 'paid') return null;
  const items = session.line_items?.data || [];
  for (const li of items) { const s = PRICE_TO_SLUG[li.price?.id]; if (s) return s; }
  return null;
}
// Idempotent: one grant per session; issues a fresh time-limited token on each call.
export async function grantForSession(env, sessionId, fetchImpl) {
  if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(sessionId || '')) return null;
  const session = await stripeGet(env, `checkout/sessions/${sessionId}?expand[]=line_items`, fetchImpl);
  const slug = sessionToSlug(session);
  if (!slug) return null;
  const token = newToken();
  const rec = { slug, session: sessionId, created: Date.now(), expires: Date.now() + TTL_SECONDS * 1000, count: 0 };
  await env.SIGNUPS.put('dl:' + token, JSON.stringify(rec), { expirationTtl: TTL_SECONDS });
  return { token, slug, expires: rec.expires };
}
export const fileKey = (slug) => `${slug}-${FILE_VERSION}.zip`;

export async function verifyStripeSignature(payload, header, secret, toleranceSec = 300, now = Date.now()) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=')).filter((p) => p.length === 2));
  const t = header.split(',').find((p) => p.startsWith('t='))?.slice(2);
  const sigs = header.split(',').filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  if (!t || !sigs.length) return false;
  if (Math.abs(now / 1000 - Number(t)) > toleranceSec) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${payload}`)));
  return sigs.some((s) => s.length === mac.length && s === mac);
}
