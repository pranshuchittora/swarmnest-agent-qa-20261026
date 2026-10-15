import { PRODUCT_TITLES } from './prices.js';
export const FROM = 'Swarmnest <hello@swarmnest.ai>';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function buildDeliveryEmail({ slug, token, sessionId, origin = 'https://swarmnest.ai' }) {
  const title = PRODUCT_TITLES[slug] || slug;
  const link = `${origin}/download/${token}`;
  const again = `${origin}/marketplace/${slug}/?thanks=1&session_id=${encodeURIComponent(sessionId)}`;
  const subject = `Your download: ${title}`;
  const text = `Thanks for buying ${title}.\n\nDownload your files (view each file or get the zip):\n${link}\n\nThis link works for 72 hours and up to 10 zip downloads. If it expires, open this page to get a fresh link:\n${again}\n\nLicense: ${origin}/license/  Refunds: ${origin}/refunds/\nQuestions: reply to this email or write hello@swarmnest.ai\n`;
  const html = `<p>Thanks for buying <strong>${esc(title)}</strong>.</p><p><a href="${esc(link)}">Open your download page</a> (view each file, or get the zip).</p><p>This link works for 72 hours and up to 10 zip downloads. If it expires, <a href="${esc(again)}">open this page for a fresh link</a>.</p><p><a href="${origin}/license/">License</a> · <a href="${origin}/refunds/">Refunds</a><br>Questions: reply to this email or write hello@swarmnest.ai</p>`;
  return { subject, text, html };
}
// No-ops (returns {skipped:true}) when RESEND_API_KEY is absent or no recipient. Never throws.
export async function sendDeliveryEmail(env, { to, slug, token, sessionId }, fetchImpl) {
  if (!env.RESEND_API_KEY) return { skipped: true, reason: 'no-key' };
  if (!to || !/^[^@\s]+@[^@\s]+$/.test(to)) return { skipped: true, reason: 'no-recipient' };
  try {
    const m = buildDeliveryEmail({ slug, token, sessionId });
    const r = await (fetchImpl || ((u, o) => fetch(u, o)))('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json', 'Idempotency-Key': 'delivery-' + sessionId },
      body: JSON.stringify({ from: FROM, to: [to], reply_to: 'hello@swarmnest.ai', subject: m.subject, text: m.text, html: m.html }),
    });
    return { sent: r.ok, status: r.status };
  } catch (e) { return { sent: false, error: 'exception' }; }
}
