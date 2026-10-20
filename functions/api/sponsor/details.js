// GET: verify the sponsor session and return the form state. POST: validate and save the Ad Details (one record per session, editable until approved).
import { verifySponsorSession, validateFields, decodeLogo, decodeBanner, rateLimit, recKey, logoKey, bannerKey, prefillFrom, customFields, newKey, MAX_EDITS, detailsUrl } from '../../_lib/sponsor-details.js';
import { notifyDetails } from '../../_lib/sponsor.js';
const H = { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' };
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: H });
const YEAR = 60 * 60 * 24 * 400;
const meta = (m) => (m ? { type: m.type, w: m.w, h: m.h, size: m.size } : null);
const pub = (r) => r && { status: r.status, fields: r.fields, logo: meta(r.logo), banner: meta(r.banner), updated: r.updated, version: r.v };
const MAX_BODY = 1000 * 1024; // logo (300 KB) + banner (400 KB) as base64, plus text

export async function onRequestGet({ request, env }, deps = {}) {
  if (!(await rateLimit(request, 'sd-get', 60, 600, deps.cache))) return json({ ok: false, error: 'Too many requests. Wait a few minutes and try again.' }, 429);
  const sid = new URL(request.url).searchParams.get('session_id');
  const v = await verifySponsorSession(env, sid, deps.fetch, deps.now);
  if (v.error) return json({ ok: false, error: v.error }, v.status);
  const rec = JSON.parse((await env.SIGNUPS.get(recKey(sid))) || 'null');
  const s = v.session;
  return json({ ok: true, product: v.sponsor.title, mode: v.sponsor.mode, amount: s.amount_total, currency: s.currency, banner: v.sponsor.slug === 'sitewide-sponsor', prefill: prefillFrom(s), checkout: customFields(s), record: pub(rec), locked: rec?.status === 'approved' });
}

export async function onRequestPost({ request, env }, deps = {}) {
  if (!(await rateLimit(request, 'sd-post', 12, 600, deps.cache))) return json({ ok: false, error: 'Too many submissions. Wait a few minutes and try again.' }, 429);
  const len = Number(request.headers.get('content-length') || 0);
  if (len > MAX_BODY) return json({ ok: false, error: 'The request is too large. The logo must be 300 KB or smaller and the banner 400 KB or smaller.' }, 413);
  if (!(request.headers.get('content-type') || '').includes('application/json')) return json({ ok: false, error: 'Unsupported request.' }, 415);
  let body; try { const txt = await request.text(); if (txt.length > MAX_BODY) throw 0; body = JSON.parse(txt); } catch { return json({ ok: false, error: 'The request could not be read.' }, 400); }
  const sid = body?.session_id;
  const v = await verifySponsorSession(env, sid, deps.fetch, deps.now);
  if (v.error) return json({ ok: false, error: v.error }, v.status);
  const prev = JSON.parse((await env.SIGNUPS.get(recKey(sid))) || 'null');
  if (prev?.status === 'approved') return json({ ok: false, locked: true, error: 'This ad has been approved and is locked. To change it, email support@swarmnest.ai.' }, 409);
  if ((prev?.edits || 0) >= MAX_EDITS) return json({ ok: false, error: 'This order has reached the edit limit. Email support@swarmnest.ai to change it.' }, 429);
  const { fields, errors, ok } = validateFields(body);
  const logo = decodeLogo(body.logo);
  if (logo.error) errors.logo = logo.error;
  const sitewide = v.sponsor.slug === 'sitewide-sponsor';
  const banner = sitewide ? decodeBanner(body.banner) : body.banner ? { error: 'Banners are only available for Sitewide Sponsor orders.' } : { none: true };
  if (banner.error) errors.banner = banner.error;
  if (!ok || logo.error || banner.error) return json({ ok: false, error: 'Please fix the highlighted fields.', errors }, 422);
  const s = v.session, now = new Date(deps.now || Date.now()).toISOString();
  let logoMeta = prev?.logo || null;
  if (!logo.none) {
    logoMeta = { type: logo.type, ext: logo.ext, w: logo.w, h: logo.h, size: logo.size, at: now };
    await env.SIGNUPS.put(logoKey(sid), logo.bytes, { expirationTtl: YEAR, metadata: { type: logo.type } });
  } else if (body.remove_logo) logoMeta = null;
  let bannerMeta = sitewide ? prev?.banner || null : null;
  if (!banner.none) {
    bannerMeta = { type: banner.type, ext: banner.ext, w: banner.w, h: banner.h, size: banner.size, at: now };
    await env.SIGNUPS.put(bannerKey(sid), banner.bytes, { expirationTtl: YEAR, metadata: { type: banner.type } });
  } else if (body.remove_banner) bannerMeta = null;
  const rec = { v: (prev?.v || 0) + 1, status: 'submitted', session: sid, product: v.sponsor.slug, title: v.sponsor.title, mode: v.sponsor.mode, amount: s.amount_total, currency: s.currency,
    subscription: s.subscription || null, customer: s.customer || null, checkout: customFields(s), country: s.customer_details?.address?.country || null, fields, logo: logoMeta, banner: bannerMeta,
    adminKey: prev?.adminKey || newKey(), created: prev?.created || now, updated: now, edits: (prev?.edits || 0) + 1 };
  await env.SIGNUPS.put(recKey(sid), JSON.stringify(rec), { expirationTtl: YEAR });
  const mail = await notifyDetails(env, rec, logo.none ? null : logo, deps.fetch, undefined, banner.none ? null : banner);
  return json({ ok: true, saved: true, record: pub(rec), emailed: mail, link: detailsUrl(sid) });
}
