// End-to-end test of the Ad Details flow with mocked Stripe sessions, KV, Cache API and Resend.
import { readFileSync } from 'fs';
import { onRequestGet, onRequestPost } from '../functions/api/sponsor/details.js';
import { onRequestGet as logoGet } from '../functions/api/sponsor/logo.js';
import { sniffImage, decodeLogo, decodeBanner, isAnimated, validateFields, verifySponsorSession, rateLimit } from '../functions/_lib/sponsor-details.js';
import { SPONSOR_LINKS } from '../functions/_lib/prices.js';
import { planApproval, placementKey } from './approve-sponsor.mjs';
const ok = (c, n) => { console.log(c ? 'PASS' : 'FAIL', n); if (!c) process.exitCode = 1; };
const root = new URL('..', import.meta.url).pathname;
const dataUrl = (p, t) => `data:${t};base64,` + readFileSync(root + p).toString('base64');
const PNG = dataUrl('public/favicon-96.png', 'image/png'), JPG = dataUrl('scripts/fixtures/logo.jpg', 'image/jpeg'), WEBP = dataUrl('scripts/fixtures/logo.webp', 'image/webp'), WIDE = dataUrl('public/og-v2.png', 'image/png');
const linkOf = (slug, mode) => Object.entries(SPONSOR_LINKS).find(([, v]) => v.slug === slug && v.mode === mode)[0];
const NOW = Date.parse('2026-10-20T04:00:00Z');
const sessions = {
  cs_test_category0001: { object: 'checkout.session', id: 'cs_test_category0001', payment_link: linkOf('category-sponsor', 'monthly'), payment_status: 'paid', status: 'complete', created: NOW / 1000 - 3600, amount_total: 4900, currency: 'usd', subscription: 'sub_9', customer: 'cus_9',
    customer_details: { email: 'ada@acme.dev', name: 'Ada', address: { country: 'US' } }, custom_fields: [{ key: 'category', text: { value: 'https://swarmnest.ai/directory/vector-databases/' } }, { key: 'website', text: { value: 'https://acme.dev/' } }] },
  cs_test_featured00001: { object: 'checkout.session', id: 'cs_test_featured00001', payment_link: linkOf('featured-listing', 'once'), payment_status: 'paid', status: 'complete', created: NOW / 1000 - 60, amount_total: 2900, currency: 'usd', customer_details: { email: 'b@acme.dev', address: { country: 'US' } }, custom_fields: [{ key: 'listing', text: { value: 'https://swarmnest.ai/agent-skills/category/apple-macos-skills/' } }] },
  cs_test_sitewide00001: { object: 'checkout.session', id: 'cs_test_sitewide00001', payment_link: linkOf('sitewide-sponsor', 'monthly'), payment_status: 'paid', status: 'complete', created: NOW / 1000 - 60, amount_total: 9900, currency: 'usd', subscription: 'sub_sw', customer_details: { email: 'c@acme.dev', address: { country: 'US' } }, custom_fields: [{ key: 'website', text: { value: 'https://launch.dev/' } }, { key: 'headline', text: { value: 'Launch week' } }] },
  cs_test_unpaid0000001: { object: 'checkout.session', payment_link: linkOf('sitewide-sponsor', 'monthly'), payment_status: 'unpaid', status: 'open', created: NOW / 1000 },
  cs_test_product000001: { object: 'checkout.session', payment_link: 'plink_1UST9z6aC1E09RZYFhMVWOJF', payment_status: 'paid', status: 'complete', created: NOW / 1000 },
  cs_test_old0000000001: { object: 'checkout.session', payment_link: linkOf('sitewide-sponsor', 'once'), payment_status: 'paid', status: 'complete', created: NOW / 1000 - 61 * 86400 },
};
const mails = [], stripeCalls = [];
const fetchMock = async (u, o = {}) => {
  u = String(u);
  if (u.startsWith('https://api.stripe.com/')) { stripeCalls.push({ u, auth: o.headers?.Authorization }); const id = u.split('/').pop().split('?')[0]; const s = sessions[id]; return s ? { ok: true, json: async () => s } : { ok: false, status: 404, json: async () => ({}) }; }
  if (u.startsWith('https://api.resend.com/')) { mails.push(JSON.parse(o.body)); return { ok: true, status: 200 }; }
  throw new Error('unexpected fetch ' + u);
};
const store = new Map();
const kv = { get: async (k, t) => { const v = store.get(k); if (v == null) return null; return t === 'arrayBuffer' ? v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength) : v; }, put: async (k, v) => store.set(k, v) };
const env = { STRIPE_API_KEY: 'rk_test_mock', SIGNUPS: kv, RESEND_API_KEY: 're_mock' };
const mkCache = () => { const m = new Map(); return { match: async (r) => (m.has(r.url) ? new Response(m.get(r.url)) : undefined), put: async (r, res) => m.set(r.url, await res.text()) }; };
const deps = { fetch: fetchMock, now: NOW, cache: mkCache() };
const req = (method, q, body, ip = '1.2.3.4') => new Request('https://swarmnest.ai/api/sponsor/details' + (q || ''), { method, headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip }, body: body ? JSON.stringify(body) : undefined });
const J = async (r) => ({ status: r.status, ...(await r.json()) });

// image sniffing
const b = (d) => Uint8Array.from(Buffer.from(d.split(',')[1], 'base64'));
ok(JSON.stringify(sniffImage(b(PNG))) === JSON.stringify({ type: 'image/png', ext: 'png', w: 96, h: 96 }), 'PNG size read');
ok(sniffImage(b(JPG)).w === 100 && sniffImage(b(JPG)).type === 'image/jpeg', 'JPEG size read');
const wp = sniffImage(b(WEBP)); ok(wp.type === 'image/webp' && wp.w === 120 && wp.h === 110, 'WebP size read');
ok(decodeLogo('data:image/svg+xml;base64,' + Buffer.from('<svg onload=alert(1)>').toString('base64')).error?.includes('SVG'), 'SVG rejected');
ok(decodeLogo('data:image/png;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>').toString('base64')).error, 'SVG disguised as PNG rejected');
ok(decodeLogo(JPG.replace('image/jpeg', 'image/png')).error?.includes('does not match'), 'type mismatch rejected');
ok(/square/.test(decodeLogo(WIDE).error || ''), 'non-square rejected');
ok(/300 KB/.test(decodeLogo('data:image/png;base64,' + Buffer.alloc(310 * 1024).toString('base64')).error || ''), 'over 300 KB rejected');
// fields
const v1 = validateFields({ name: 'A'.repeat(41), headline: '', sentence: 'x', url: 'http://acme.dev', email: 'nope' });
ok(v1.errors.name && v1.errors.headline && v1.errors.url && v1.errors.email && !v1.ok, 'field errors');
ok(validateFields({ name: 'Acme', headline: 'Fast vectors', sentence: 'One line.', url: 'javascript:alert(1)', email: 'a@b.co' }).errors.url, 'javascript: URL rejected');
ok(validateFields({ name: 'Acme', headline: 'Fast vectors', sentence: 'One line.', url: 'https://user:pw@acme.dev', email: 'a@b.co' }).errors.url, 'URL with credentials rejected');
ok(validateFields({ name: '<b>Acme</b>', headline: 'h', sentence: 's', url: 'https://acme.dev', email: 'a@b.co' }).errors.name, 'HTML in text rejected');
// session verification
ok((await verifySponsorSession(env, 'cs_test_unpaid0000001', fetchMock, NOW)).status === 402, 'unpaid session rejected');
ok((await verifySponsorSession(env, 'cs_test_product000001', fetchMock, NOW)).status === 403, 'non-sponsor (product) session rejected');
ok((await verifySponsorSession(env, 'cs_test_old0000000001', fetchMock, NOW)).status === 410, 'session older than 60 days rejected');
ok((await verifySponsorSession(env, 'cs_test_missing000001', fetchMock, NOW)).status === 404, 'unknown session rejected');
ok((await verifySponsorSession(env, '../../etc', fetchMock, NOW)).status === 400 && !stripeCalls.some((c) => c.u.includes('etc')), 'malformed id never sent to Stripe');
ok(stripeCalls.every((c) => c.auth === 'Bearer rk_test_mock'), 'uses existing STRIPE_API_KEY binding');
// GET prefill
let g = await J(await onRequestGet({ request: req('GET', '?session_id=cs_test_category0001'), env }, deps));
ok(g.ok && g.product === 'Category Sponsor' && g.mode === 'monthly' && g.prefill.email === 'ada@acme.dev' && g.prefill.url === 'https://acme.dev/' && g.record === null, 'GET verifies and prefills from checkout');
// POST invalid then valid
let p = await J(await onRequestPost({ request: req('POST', '', { session_id: 'cs_test_category0001', name: 'Acme', headline: '', sentence: 'x', url: 'http://x', email: 'a@acme.dev', logo: WIDE }), env }, deps));
ok(p.status === 422 && p.errors.headline && p.errors.url && p.errors.logo && !store.has('sponsor-details:cs_test_category0001'), 'invalid POST rejected, nothing stored');
const good = { session_id: 'cs_test_category0001', name: 'Acme Vectors', headline: 'Vector search in 5 minutes', sentence: 'Hosted vector database with a free tier and an MCP server.', url: 'https://acme.dev/?ref=swarmnest', email: 'ada@acme.dev', notes: 'Logo on white please.', logo: PNG };
p = await J(await onRequestPost({ request: req('POST', '', good), env }, deps));
const rec = JSON.parse(store.get('sponsor-details:cs_test_category0001'));
ok(p.ok && rec.v === 1 && rec.status === 'submitted' && rec.logo.w === 96 && store.get('sponsor-logo:cs_test_category0001').length === b(PNG).length, 'valid POST stores record and logo');
const team = mails.filter((m) => m.to[0] === 'hello@swarmnest.ai'), buyer = mails.filter((m) => m.to[0] === 'ada@acme.dev');
ok(team.length === 1 && team[0].attachments?.[0]?.content === PNG.split(',')[1] && team[0].text.includes('$49.00 USD') && team[0].text.includes('cs_test_category0001') && team[0].text.includes('key=' + rec.adminKey), 'team email: details, amount, session, logo attached, admin link');
ok(buyer.length === 1 && buyer[0].from.includes('hello@swarmnest.ai') && buyer[0].reply_to === 'support@swarmnest.ai' && buyer[0].text.includes('/advertise/details/?session_id=cs_test_category0001'), 'buyer confirmation from hello@, reply-to support@, with edit link');
// re-edit keeps logo, bumps version
p = await J(await onRequestPost({ request: req('POST', '', { ...good, logo: undefined, headline: 'Vector search, fast' }), env }, deps));
const rec2 = JSON.parse(store.get('sponsor-details:cs_test_category0001'));
ok(p.ok && rec2.v === 2 && rec2.logo && rec2.fields.headline === 'Vector search, fast' && rec2.adminKey === rec.adminKey && rec2.created === rec.created, 're-edit allowed, logo kept, version bumped');
g = await J(await onRequestGet({ request: req('GET', '?session_id=cs_test_category0001'), env }, deps));
ok(g.record.version === 2 && !g.locked && !('adminKey' in g.record), 'GET returns saved record without admin key');
// logo endpoint
let lr = await logoGet({ request: new Request('https://swarmnest.ai/api/sponsor/logo?session_id=cs_test_category0001'), env }, deps);
ok(lr.status === 200 && lr.headers.get('content-type') === 'image/png' && /sandbox/.test(lr.headers.get('content-security-policy')) && lr.headers.get('x-content-type-options') === 'nosniff', 'owner can view logo, served with nosniff + sandbox CSP');
lr = await logoGet({ request: new Request('https://swarmnest.ai/api/sponsor/logo?session_id=cs_test_category0001&key=wrong'), env }, deps); ok(lr.status === 404, 'wrong admin key gets 404');
lr = await logoGet({ request: new Request(`https://swarmnest.ai/api/sponsor/logo?session_id=cs_test_category0001&key=${rec.adminKey}`), env }, deps); ok(lr.status === 200, 'admin link works');
// approval plan
const data = { categories: JSON.parse(readFileSync(root + 'data/categories.json')), skills: JSON.parse(readFileSync(root + 'data/skills.json')), sponsors: JSON.parse(readFileSync(root + 'data/sponsors.json')) };
const plan = planApproval(rec2, data, { start: '2026-10-21' });
ok(plan.key === 'directory/vector-databases' && plan.sponsors.categories['directory/vector-databases'].headline === 'Vector search, fast' && plan.entry.logo === '/sponsors/acme-vectors-gory0001.png' && !plan.entry.end && plan.entry.subscription === 'sub_9', 'approval plan: category key, logo path, monthly has no end');
ok(/^\/sponsors\/[a-z0-9_-]+\.(png|jpg|webp)$/.test(plan.entry.logo), 'logo path matches the card allowlist');
let threw = ''; try { planApproval(rec2, { ...data, sponsors: plan.sponsors }, { start: '2026-10-22' }); } catch (e) { threw = e.message; } ok(threw === '', 're-approving the same order replaces its own entry');
threw = ''; try { planApproval({ ...rec2, session: 'cs_test_other', checkout: rec2.checkout }, { ...data, sponsors: plan.sponsors }, { start: '2026-10-22' }); } catch (e) { threw = e.message; } ok(/already has an active category sponsor/.test(threw), 'second sponsor for the same category blocked');
// featured one-time
await onRequestPost({ request: req('POST', '', { session_id: 'cs_test_featured00001', name: 'MacKit', headline: 'Ship Mac apps faster', sentence: 'Templates for notarized Mac apps.', url: 'https://mackit.app/', email: 'b@acme.dev', logo: WEBP }), env }, deps);
const fr = JSON.parse(store.get('sponsor-details:cs_test_featured00001'));
const fp = planApproval(fr, data, { start: '2026-10-21' });
ok(fp.key === 'agent-skills/apple-macos-skills' && fp.entry.end === '2026-11-19' && Array.isArray(fp.sponsors.featured[fp.key]) && fp.entry.logo.endsWith('.webp'), 'featured one-time: skills category, 30-day end date');
threw = ''; try { placementKey({ product: 'category-sponsor', checkout: { category: 'https://swarmnest.ai/directory/not-a-category/' } }, data); } catch (e) { threw = e.message; } ok(/unknown category/.test(threw), 'unknown category rejected');
// lock after approval
store.set('sponsor-details:cs_test_category0001', JSON.stringify({ ...rec2, status: 'approved' }));
p = await J(await onRequestPost({ request: req('POST', '', good), env }, deps)); ok(p.status === 409 && p.locked, 'approved record is locked');
g = await J(await onRequestGet({ request: req('GET', '?session_id=cs_test_category0001'), env }, deps)); ok(g.locked === true, 'GET reports locked');
// rate limits and size guards
const c2 = mkCache(); let last;
for (let i = 0; i < 13; i++) last = await onRequestPost({ request: req('POST', '', { session_id: 'bad' }, '9.9.9.9'), env }, { ...deps, cache: c2 });
ok(last.status === 429, 'POST rate limit (12 per 10 minutes per IP)');
ok(await rateLimit(req('GET', '', null, '8.8.8.8'), 'x', 1, 600, c2) && !(await rateLimit(req('GET', '', null, '8.8.8.8'), 'x', 1, 600, c2)), 'limiter counts per IP');
const huge = new Request('https://swarmnest.ai/api/sponsor/details', { method: 'POST', headers: { 'content-type': 'application/json', 'content-length': String(1100 * 1024) }, body: '{}' });
ok((await onRequestPost({ request: huge, env }, { ...deps, cache: mkCache() })).status === 413, 'oversized body rejected');
const form = new Request('https://swarmnest.ai/api/sponsor/details', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{}' });
ok((await onRequestPost({ request: form, env }, { ...deps, cache: mkCache() })).status === 415, 'non-JSON rejected');

// sitewide banner
const BAN = dataUrl('scripts/fixtures/banner.webp', 'image/webp'), BANJ = dataUrl('scripts/fixtures/banner.jpg', 'image/jpeg');
ok(decodeBanner(BAN).w === 1200 && decodeBanner(BANJ).h === 400, 'banner 1200 x 400 WebP and JPEG accepted');
ok(/900 × 300/.test(decodeBanner(dataUrl('scripts/fixtures/banner-small.jpg', 'image/jpeg')).error || ''), 'banner under 900 x 300 rejected');
ok(/3:1/.test(decodeBanner(PNG).error || '') || /900/.test(decodeBanner(PNG).error || ''), 'square image rejected as banner');
ok(/3:1/.test(decodeBanner(dataUrl('public/og-v2.png', 'image/png')).error || ''), '1200 x 630 rejected (not 3:1)');
ok(/Animated/.test(decodeBanner(dataUrl('scripts/fixtures/banner-anim.webp', 'image/webp')).error || ''), 'animated WebP rejected');
ok(/Animated/.test(decodeBanner(dataUrl('scripts/fixtures/banner-anim.png', 'image/png')).error || ''), 'animated PNG (APNG) rejected');
ok(!isAnimated(b(PNG)) && !isAnimated(b(BAN)), 'still images not flagged as animated');
ok(/GIF/.test(decodeBanner('data:image/gif;base64,R0lGODlhAQABAAAAACw=').error || ''), 'GIF rejected');
ok(/400 KB/.test(decodeBanner('data:image/png;base64,' + Buffer.alloc(410 * 1024).toString('base64')).error || ''), 'banner over 400 KB rejected');
const cBan = mkCache();
g = await J(await onRequestGet({ request: req('GET', '?session_id=cs_test_sitewide00001'), env }, { ...deps, cache: cBan }));
ok(g.banner === true && g.prefill.headline === 'Launch week', 'sitewide GET offers banner and prefills headline');
p = await J(await onRequestPost({ request: req('POST', '', { session_id: 'cs_test_featured00001', name: 'MacKit', headline: 'Ship Mac apps faster', sentence: 'Templates.', url: 'https://mackit.app/', email: 'b@acme.dev', banner: BAN }), env }, { ...deps, cache: cBan }));
ok(p.status === 422 && /Sitewide/.test(p.errors.banner), 'banner refused for non-sitewide orders');
mails.length = 0;
const sw = { session_id: 'cs_test_sitewide00001', name: 'Launch', headline: 'Launch week', sentence: 'Ship your launch.', url: 'https://launch.dev/', email: 'c@acme.dev', logo: JPG, banner: BAN };
p = await J(await onRequestPost({ request: req('POST', '', sw), env }, { ...deps, cache: cBan }));
const swr = JSON.parse(store.get('sponsor-details:cs_test_sitewide00001'));
ok(p.ok && swr.banner.w === 1200 && store.get('sponsor-banner:cs_test_sitewide00001').length === b(BAN).length && p.record.banner.w === 1200, 'sitewide banner stored');
const tm = mails.find((m) => m.to[0] === 'hello@swarmnest.ai');
ok(tm.attachments.length === 2 && tm.attachments.some((a) => a.filename.startsWith('banner-')) && tm.text.includes('kind=banner&key=' + swr.adminKey), 'admin email attaches banner and links it');
lr = await logoGet({ request: new Request(`https://swarmnest.ai/api/sponsor/logo?session_id=cs_test_sitewide00001&kind=banner&key=${swr.adminKey}`), env }, deps);
ok(lr.status === 200 && lr.headers.get('content-type') === 'image/webp', 'banner admin link serves the banner');
const swp = planApproval(swr, data, { start: '2026-10-21' });
ok(swp.key === 'sitewide' && swp.entry.banner === '/sponsors/launch-ewide00001-banner.webp'.replace('ewide00001', swr.session.slice(-8).toLowerCase()) && /^\/sponsors\/[a-z0-9_-]+\.(png|jpg|webp)$/.test(swp.entry.banner) && swp.entry.logo, 'approval saves banner path for sitewide');
p = await J(await onRequestPost({ request: req('POST', '', { ...sw, logo: undefined, banner: undefined, remove_banner: true }), env }, { ...deps, cache: cBan }));
ok(p.ok && p.record.banner === null && p.record.logo, 'banner can be removed, logo kept');
