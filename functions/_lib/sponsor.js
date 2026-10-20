// Sponsor orders: log them and email the team for approval. Never throws; never creates download grants.
import { SPONSOR_LINKS, SPONSOR_PRICES } from './prices.js';
import { FROM } from './email.js';
import { detailsUrl } from './sponsor-details.js';
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
    order: 'Nothing is live yet. Wait for the buyer to send Ad Details (you will get a second email), then approve with: node scripts/approve-sponsor.mjs <session id> && ./ship.sh "Sponsor". Or decline and refund it in Stripe (full refund).',
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
        if (paid) {
          await notify(env, 'order', { ...d, 'Ad Details form': detailsUrl(o.id) }, 'sponsor-order-' + o.id, fetchImpl);
          await sendBuyer(env, d.Email, buyerOrderEmail(sp, o.id), 'sponsor-buyer-' + o.id, fetchImpl);
        }
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

// ---- Buyer emails (from hello@, reply-to support@) ----
const productName = (sp) => sp.title || sp.slug;
export function buyerOrderEmail(sp, sid) {
  const link = detailsUrl(sid);
  return { subject: `Next step: send your ad details (${productName(sp)})`,
    text: `Thanks for sponsoring Swarmnest (${productName(sp)}, ${sp.mode === 'monthly' ? 'monthly' : 'one-time, 30 days'}).\n\nPlease send your ad details here: brand name, headline, one sentence, destination URL and a square logo${sp.slug === 'sitewide-sponsor' ? ', plus an optional homepage banner' : ''}.\n${link}\n\nYou can come back to this link and edit your details until we approve them. Nothing goes live until we review it, usually within 2 business days. If we decline your order, you get a full refund.\n\nSponsorship Terms: https://swarmnest.ai/sponsorship-terms/\nManage or cancel: https://swarmnest.ai/advertise/#manage\nQuestions: reply to this email or write support@swarmnest.ai\n` };
}
export function buyerDetailsEmail(rec) {
  const link = detailsUrl(rec.session); const f = rec.fields;
  return { subject: `We received your ad details (${rec.title})`,
    text: `Thanks. We received your ad details for ${rec.title}:\n\nBrand: ${f.name}\nHeadline: ${f.headline}\nSentence: ${f.sentence}\nLink: ${f.url}\nLogo: ${rec.logo ? `${rec.logo.w} x ${rec.logo.h} ${rec.logo.ext.toUpperCase()}` : 'none'}${rec.product === 'sitewide-sponsor' ? `\nHomepage banner: ${rec.banner ? `${rec.banner.w} x ${rec.banner.h} ${rec.banner.ext.toUpperCase()}` : 'none'}` : ''}\n\nYou can edit these until we approve them:\n${link}\n\nWe review every ad before it goes live, usually within 2 business days, and we may ask for changes. If we decline your order, you get a full refund.\nQuestions: reply to this email or write support@swarmnest.ai\n` };
}
async function resend(env, payload, idem, fetchImpl) {
  if (!env.RESEND_API_KEY) return { skipped: true, reason: 'no-key' };
  try {
    const r = await (fetchImpl || ((u, o) => fetch(u, o)))('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json', 'Idempotency-Key': idem }, body: JSON.stringify({ from: FROM, ...payload }) });
    return { sent: r.ok, status: r.status };
  } catch { return { sent: false, error: 'exception' }; }
}
export async function sendBuyer(env, to, m, idem, fetchImpl) {
  if (!to || !/^[^@\s]+@[^@\s]+$/.test(to)) return { skipped: true, reason: 'no-recipient' };
  return resend(env, { to: [to], reply_to: 'support@swarmnest.ai', subject: m.subject, text: m.text }, idem, fetchImpl);
}
const b64 = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); };
// On every Ad Details save: one email to the team (logo attached + admin link) and one confirmation to the buyer.
export async function notifyDetails(env, rec, logo, fetchImpl, origin = 'https://swarmnest.ai', banner = null) {
  const f = rec.fields, sid = rec.session;
  const bannerAdmin = rec.banner ? `${origin}/api/sponsor/logo?session_id=${encodeURIComponent(sid)}&kind=banner&key=${rec.adminKey}` : 'no banner';
  const admin = rec.logo ? `${origin}/api/sponsor/logo?session_id=${encodeURIComponent(sid)}&key=${rec.adminKey}` : 'no logo';
  const text = `${rec.v > 1 ? 'Updated' : 'New'} Ad Details (version ${rec.v}). Nothing is live yet.\n\nProduct: ${rec.title} (${rec.mode === 'monthly' ? 'monthly subscription' : 'one-time, 30 days'})\nAmount: ${money(rec.amount, rec.currency)}\nSession: ${sid}\nSubscription: ${rec.subscription || '-'}\nCountry: ${rec.country || '?'}${rec.country && rec.country !== 'US' ? ' (NOT US: decline and refund)' : ''}\nCheckout answers: ${JSON.stringify(rec.checkout)}\n\nBrand: ${f.name}\nHeadline: ${f.headline}\nSentence: ${f.sentence}\nDestination: ${f.url}\nContact: ${f.email}\nNotes: ${f.notes || '-'}\nLogo: ${rec.logo ? `${rec.logo.w}x${rec.logo.h} ${rec.logo.type}, ${rec.logo.size} bytes` : 'none'}\nLogo (private admin link): ${admin}\n${rec.product === 'sitewide-sponsor' ? `Homepage banner: ${rec.banner ? `${rec.banner.w}x${rec.banner.h} ${rec.banner.type}, ${rec.banner.size} bytes` : 'none (card uses logo and text)'}\nBanner (private admin link): ${bannerAdmin}\n` : ''}\nApprove: node scripts/approve-sponsor.mjs ${sid}   then ./ship.sh "Sponsor: ${f.name.replace(/"/g, '')}"\nDecline: refund in Stripe and reply to the buyer.\n`;
  const att = [...(logo && !logo.none ? [{ filename: `logo-${sid.slice(-8)}.${logo.ext}`, content: b64(logo.bytes) }] : []), ...(banner && !banner.none ? [{ filename: `banner-${sid.slice(-8)}.${banner.ext}`, content: b64(banner.bytes) }] : [])];
  const team = await resend(env, { to: [SPONSOR_NOTIFY], reply_to: /^[^@\s]+@[^@\s]+$/.test(f.email) ? f.email : undefined, subject: `Ad Details ${rec.v > 1 ? 'updated' : 'received'}: ${f.name} (${rec.title})`, text, ...(att.length ? { attachments: att } : {}) }, `sponsor-details-${sid}-v${rec.v}`, fetchImpl);
  const buyer = await sendBuyer(env, f.email, buyerDetailsEmail(rec), `sponsor-details-buyer-${sid}-v${rec.v}`, fetchImpl);
  return { team: !!team.sent, buyer: !!buyer.sent };
}
