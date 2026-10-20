// Sponsor orders: log them and email the team for approval. Never throws; never creates download grants.
import { SPONSOR_LINKS, SPONSOR_PRICES } from './prices.js';
import { FROM } from './email.js';
export const SPONSOR_NOTIFY = 'hello@swarmnest.ai';
const YEAR = 60 * 60 * 24 * 400;
const money = (c, cur = 'usd') => (c == null ? '?' : `$${(c / 100).toFixed(2)} ${String(cur).toUpperCase()}`);

// Which sponsor product (if any) a checkout session is for. Uses data in the event only (no Stripe API call).
export function sponsorForSession(s) {
  if (!s || s.object !== 'checkout.session') return null;
  if (s.payment_link && SPONSOR_LINKS[s.payment_link]) return SPONSOR_LINKS[s.payment_link];
  if (s.metadata?.kind === 'sponsorship' && s.metadata?.slug) return { slug: s.metadata.slug, title: s.metadata.slug, mode: s.mode === 'subscription' ? 'monthly' : 'once' };
  return null;
}
const linePrice = (li) => li?.price?.id || li?.pricing?.price_details?.price || li?.plan?.id || null;
export function sponsorForInvoice(inv) {
  for (const li of inv?.lines?.data || []) { const p = SPONSOR_PRICES[linePrice(li)]; if (p) return p; }
  const md = inv?.subscription_details?.metadata || inv?.parent?.subscription_details?.metadata;
  return md?.kind === 'sponsorship' ? { slug: md.slug, title: md.slug, mode: 'monthly' } : null;
}
export function sponsorForSubscription(sub) {
  for (const it of sub?.items?.data || []) { const p = SPONSOR_PRICES[it.price?.id]; if (p) return p; }
  return sub?.metadata?.kind === 'sponsorship' ? { slug: sub.metadata.slug, title: sub.metadata.slug, mode: 'monthly' } : null;
}
export const fieldsOf = (s) => (s.custom_fields || []).map((f) => ({ key: f.key, label: f.label?.custom || f.key, value: f.text?.value ?? f.dropdown?.value ?? f.numeric?.value ?? '' }));

export function buildSponsorEmail(kind, d) {
  const lines = Object.entries(d).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => `${k}: ${v}`);
  const subjects = { order: `New sponsor order to review: ${d.Product} (${d.Billing})`, renewal: `Sponsor renewal paid: ${d.Product}`, canceled: `Sponsor subscription ended: ${d.Product}` };
  const notes = {
    order: 'Nothing is live yet. Review the order, then either add it to data/sponsors.json and deploy, or decline and refund it in Stripe (full refund).',
    renewal: 'A monthly renewal was paid. If the placement is live, keep it running (extend "end" in data/sponsors.json if you set one).',
    canceled: 'The subscription has ended. Remove the placement from data/sponsors.json at the end of the paid period.',
  };
  const text = `${notes[kind]}\n\n${lines.join('\n')}\n\nStripe dashboard: https://dashboard.stripe.com/\nSponsorship Terms: https://swarmnest.ai/sponsorship-terms/\n`;
  return { subject: subjects[kind], text };
}
export async function notify(env, kind, d, idem, fetchImpl) {
  if (!env.RESEND_API_KEY) return { skipped: true, reason: 'no-key' };
  try {
    const m = buildSponsorEmail(kind, d);
    const r = await (fetchImpl || ((u, o) => fetch(u, o)))('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json', 'Idempotency-Key': idem },
      body: JSON.stringify({ from: FROM, to: [SPONSOR_NOTIFY], ...(d.Email && /^[^@\s]+@[^@\s]+$/.test(d.Email) ? { reply_to: d.Email } : {}), subject: m.subject, text: m.text }),
    });
    return { sent: r.ok, status: r.status };
  } catch (e) { return { sent: false, error: 'exception' }; }
}
async function once(env, key, rec) {
  if (await env.SIGNUPS.get(key)) return false;
  await env.SIGNUPS.put(key, JSON.stringify(rec), { expirationTtl: YEAR });
  return true;
}
// Returns true if the event was a sponsor event (handled here), false if the caller should handle it.
export async function handleSponsorEvent(env, ev, fetchImpl) {
  const o = ev?.data?.object || {};
  try {
    if (ev.type === 'checkout.session.completed' || ev.type === 'checkout.session.async_payment_succeeded') {
      const sp = sponsorForSession(o); if (!sp) return false;
      const f = fieldsOf(o); const country = o.customer_details?.address?.country || null;
      const d = { Product: sp.title, Billing: sp.mode === 'monthly' ? 'Monthly subscription' : 'One-time, 30 days', Amount: money(o.amount_total, o.currency), 'Payment status': o.payment_status,
        Email: o.customer_details?.email || null, Name: o.customer_details?.name || null, Country: country ? (country === 'US' ? 'US' : `${country} (NOT US: our terms are US-only; decline and refund)`) : null,
        ...Object.fromEntries(f.map((x) => [x.label, x.value])), Session: o.id, Subscription: o.subscription || null, Customer: o.customer || null };
      const paid = o.payment_status === 'paid' || ev.type === 'checkout.session.async_payment_succeeded';
      // Unpaid (delayed payment method) sessions are noted; the approval email goes out once, when payment succeeds.
      if (await once(env, (paid ? 'sponsor:' : 'sponsor-unpaid:') + o.id, { at: new Date().toISOString(), slug: sp.slug, mode: sp.mode, email: d.Email, fields: f, country, subscription: o.subscription || null, status: paid ? 'pending-review' : 'awaiting-payment' })) {
        if (paid) await notify(env, 'order', d, 'sponsor-order-' + o.id, fetchImpl);
      }
      return true;
    }
    if (ev.type === 'invoice.paid') {
      const sp = sponsorForInvoice(o); if (!sp) return false;
      const sub = o.subscription || o.parent?.subscription_details?.subscription || null;
      if (await once(env, 'sponsor-inv:' + o.id, { at: new Date().toISOString(), slug: sp.slug, subscription: sub, amount: o.amount_paid, reason: o.billing_reason || null })) {
        if (o.billing_reason === 'subscription_cycle') await notify(env, 'renewal', { Product: sp.title, Amount: money(o.amount_paid, o.currency), Email: o.customer_email || null, Subscription: sub, Invoice: o.id }, 'sponsor-inv-' + o.id, fetchImpl);
      }
      return true;
    }
    if (ev.type === 'customer.subscription.deleted') {
      const sp = sponsorForSubscription(o); if (!sp) return false;
      const end = o.ended_at || o.current_period_end || o.items?.data?.[0]?.current_period_end || null;
      if (await once(env, 'sponsor-end:' + o.id, { at: new Date().toISOString(), slug: sp.slug, ended: end, reason: o.cancellation_details?.reason || null })) {
        await notify(env, 'canceled', { Product: sp.title, Subscription: o.id, Customer: o.customer || null, Ended: end ? new Date(end * 1000).toISOString() : null, Reason: o.cancellation_details?.reason || null }, 'sponsor-end-' + o.id, fetchImpl);
      }
      return true;
    }
  } catch (e) { return true; } // a sponsor event must never fall through to file delivery or 500 the webhook
  return false;
}
