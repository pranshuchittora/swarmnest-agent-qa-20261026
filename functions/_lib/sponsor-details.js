// Sponsor Ad Details: session verification, validation, logo checks, rate limiting. No new services: Stripe (existing key), KV (SIGNUPS), Cache API, Resend.
import { SPONSOR_LINKS } from './prices.js';
import { stripeGet } from './fulfil.js';
export const MAX_AGE_DAYS = 60;
export const MAX_LOGO = 300 * 1024;
export const MAX_EDITS = 25;
export const LIMITS = { name: 40, headline: 40, sentence: 160, url: 300, email: 254, notes: 1000 };
export const SID_RE = /^cs_(live|test)_[A-Za-z0-9]{10,200}$/;
export const recKey = (sid) => 'sponsor-details:' + sid;
export const bannerKey = (sid) => `sponsor-banner:${sid}`;
export const logoKey = (sid) => 'sponsor-logo:' + sid;
export const detailsUrl = (sid, origin = 'https://swarmnest.ai') => `${origin}/advertise/details/?session_id=${encodeURIComponent(sid)}`;
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
export const newKey = () => hex(crypto.getRandomValues(new Uint8Array(24)));

// Paid, from one of the 6 sponsor payment links, created within MAX_AGE_DAYS. Returns {session, sponsor} or {error, status}.
export async function verifySponsorSession(env, sid, fetchImpl, now = Date.now()) {
  if (!SID_RE.test(sid || '')) return { error: 'This link is not valid. Open the link from your receipt email.', status: 400 };
  let s;
  try { s = await stripeGet(env, `checkout/sessions/${sid}`, fetchImpl); } catch (e) { return { error: 'We could not find this order. Check the link in your receipt email.', status: 404 }; }
  const sp = SPONSOR_LINKS[s?.payment_link];
  if (!sp) return { error: 'This order is not a sponsorship.', status: 403 };
  if (s.payment_status !== 'paid' || (s.status && s.status !== 'complete')) return { error: 'Payment for this order is not complete yet. Try again in a few minutes.', status: 402 };
  if (!s.created || now - s.created * 1000 > MAX_AGE_DAYS * 86400e3) return { error: `This details link has expired (orders older than ${MAX_AGE_DAYS} days). Email support@swarmnest.ai and we will help.`, status: 410 };
  return { session: s, sponsor: sp };
}
export const customFields = (s) => Object.fromEntries((s.custom_fields || []).map((f) => [f.key, (f.text?.value ?? f.dropdown?.value ?? '').toString()]));
export function prefillFrom(s) {
  const c = customFields(s);
  return { name: '', headline: (c.headline || '').slice(0, LIMITS.headline), sentence: '', url: /^https:\/\//i.test(c.website || '') ? c.website : /^https:\/\//i.test(c.listing || '') ? c.listing : '', email: s.customer_details?.email || '', notes: '' };
}
const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028-\u202e\u2066-\u2069]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max + 1);
export function validateFields(b) {
  const f = { name: clean(b.name, LIMITS.name), headline: clean(b.headline, LIMITS.headline), sentence: clean(b.sentence, LIMITS.sentence), url: clean(b.url, LIMITS.url), email: clean(b.email, LIMITS.email), notes: String(b.notes ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, LIMITS.notes + 1) };
  const errors = {};
  for (const k of ['name', 'headline', 'sentence']) {
    if (!f[k]) errors[k] = 'Required.'; else if (f[k].length > LIMITS[k]) errors[k] = `Up to ${LIMITS[k]} characters.`;
    else if (/[<>]/.test(f[k])) errors[k] = 'Please remove < and > characters.';
  }
  let u = null; try { u = new URL(f.url); } catch {}
  if (!f.url) errors.url = 'Required.';
  else if (!u || u.protocol !== 'https:' || u.username || u.password || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(u.hostname) || f.url.length > LIMITS.url) errors.url = 'Use a full address that starts with https://.';
  else f.url = u.toString();
  if (!/^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$/.test(f.email) || f.email.length > LIMITS.email) errors.email = 'Enter a valid email address.';
  if (f.notes.length > LIMITS.notes) errors.notes = `Up to ${LIMITS.notes} characters.`;
  return { fields: f, errors, ok: Object.keys(errors).length === 0 };
}
// Image sniffing: PNG, JPEG, WebP only (never SVG). Returns {type, ext, w, h} or {error}.
export function sniffImage(bytes) {
  const b = bytes, n = b.length;
  const u32 = (i) => (b[i] << 24 | b[i + 1] << 16 | b[i + 2] << 8 | b[i + 3]) >>> 0, u16 = (i) => b[i] << 8 | b[i + 1], le16 = (i) => b[i] | b[i + 1] << 8, le24 = (i) => b[i] | b[i + 1] << 8 | b[i + 2] << 16;
  if (n > 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[12] === 0x49 && b[13] === 0x48) return { type: 'image/png', ext: 'png', w: u32(16), h: u32(20) };
  if (n > 4 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    let i = 2;
    while (i + 9 < n) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
      const len = u16(i + 2);
      if ((m >= 0xc0 && m <= 0xcf) && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { type: 'image/jpeg', ext: 'jpg', w: u16(i + 7), h: u16(i + 5) };
      i += 2 + len;
    }
    return { error: 'Could not read the JPEG size.' };
  }
  if (n > 30 && String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP') {
    const c = String.fromCharCode(...b.slice(12, 16));
    if (c === 'VP8X') return { type: 'image/webp', ext: 'webp', w: le24(24) + 1, h: le24(27) + 1 };
    if (c === 'VP8L') { const x = b[21] | b[22] << 8 | b[23] << 16 | b[24] << 24; return { type: 'image/webp', ext: 'webp', w: (x & 0x3fff) + 1, h: ((x >> 14) & 0x3fff) + 1 }; }
    if (c === 'VP8 ') return { type: 'image/webp', ext: 'webp', w: le16(26) & 0x3fff, h: le16(28) & 0x3fff };
    return { error: 'Unsupported WebP file.' };
  }
  return { error: 'Use a PNG, JPEG or WebP image. SVG and other formats are not accepted.' };
}
// True for animated PNG (acTL chunk) or animated WebP (VP8X animation flag / ANIM chunk).
export function isAnimated(b) {
  if (b[0] === 0x89 && b[1] === 0x50) { let i = 8; while (i + 8 <= b.length) { const len = (b[i] << 24 | b[i + 1] << 16 | b[i + 2] << 8 | b[i + 3]) >>> 0; const ty = String.fromCharCode(b[i + 4], b[i + 5], b[i + 6], b[i + 7]); if (ty === 'acTL') return true; if (ty === 'IDAT' || ty === 'IEND') return false; i += 12 + len; } return false; }
  if (String.fromCharCode(b[8], b[9], b[10], b[11]) === 'WEBP' && String.fromCharCode(b[12], b[13], b[14], b[15]) === 'VP8X') return (b[20] & 0x02) !== 0;
  return false;
}
export const MAX_BANNER = 400 * 1024;
// Sitewide-only homepage banner: about 3:1, at least 900 x 300, up to 400 KB, PNG/JPEG/WebP, not animated.
export function decodeBanner(dataUrl) {
  if (!dataUrl) return { none: true };
  const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(String(dataUrl));
  if (!m) return { error: 'Use a PNG, JPEG or WebP banner. GIF, SVG and other formats are not accepted.' };
  if (m[2].length > Math.ceil(MAX_BANNER / 3) * 4 + 8) return { error: 'The banner must be 400 KB or smaller.' };
  let bin; try { bin = atob(m[2].replace(/\s/g, '')); } catch { return { error: 'The banner file could not be read.' }; }
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  if (bytes.length > MAX_BANNER) return { error: 'The banner must be 400 KB or smaller.' };
  const im = sniffImage(bytes);
  if (im.error) return { error: im.error.replace('logo', 'banner') };
  if (im.type !== m[1]) return { error: 'The file type does not match its contents.' };
  if (isAnimated(bytes)) return { error: 'Animated banners are not accepted. Use a still image.' };
  if (!(im.w >= 900 && im.h >= 300)) return { error: `The banner must be at least 900 × 300 pixels (it is ${im.w} × ${im.h}). We recommend 1200 × 400.` };
  if (im.w > 4096 || im.h > 4096) return { error: 'The banner must be at most 4096 pixels on each side.' };
  const r = im.w / im.h; if (r < 2.8 || r > 3.2) return { error: `The banner should be about 3:1, for example 1200 × 400 (it is ${im.w} × ${im.h}).` };
  return { bytes, ...im, size: bytes.length };
}
export function decodeLogo(dataUrl) {
  if (!dataUrl) return { none: true };
  const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(String(dataUrl));
  if (!m) return { error: 'Use a PNG, JPEG or WebP image. SVG and other formats are not accepted.' };
  if (m[2].length > Math.ceil(MAX_LOGO / 3) * 4 + 8) return { error: 'The logo must be 300 KB or smaller.' };
  let bin; try { bin = atob(m[2].replace(/\s/g, '')); } catch { return { error: 'The logo file could not be read.' }; }
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  if (bytes.length > MAX_LOGO) return { error: 'The logo must be 300 KB or smaller.' };
  const im = sniffImage(bytes);
  if (im.error) return im;
  if (im.type !== m[1]) return { error: 'The file type does not match its contents.' };
  if (isAnimated(bytes)) return { error: 'Animated logos are not accepted. Use a still image.' };
  if (!(im.w >= 64 && im.h >= 64)) return { error: 'The logo must be at least 64 × 64 pixels.' };
  if (im.w > 4096 || im.h > 4096) return { error: 'The logo must be at most 4096 pixels on each side.' };
  const r = im.w / im.h; if (r < 0.8 || r > 1.25) return { error: `The logo should be roughly square (it is ${im.w} × ${im.h}).` };
  return { bytes, ...im, size: bytes.length };
}
// Best-effort per-IP limiter on the Cloudflare Cache API (free, no KV writes). Returns true if allowed.
export async function rateLimit(request, bucket, limit, windowSec = 600, cache = globalThis.caches?.default) {
  if (!cache) return true;
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
  const key = new Request(`https://rl.swarmnest.ai/${bucket}/${encodeURIComponent(ip)}/${Math.floor(Date.now() / 1000 / windowSec)}`);
  try {
    const hit = await cache.match(key); const n = hit ? Number(await hit.text()) || 0 : 0;
    if (n >= limit) return false;
    await cache.put(key, new Response(String(n + 1), { headers: { 'cache-control': `public, max-age=${windowSec}` } }));
  } catch {}
  return true;
}
