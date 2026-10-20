// Approve a sponsor's Ad Details: pulls the record, logo and (sitewide) banner from KV, saves them to public/sponsors/,
// writes the data/sponsors.json entry, and locks the record (status "approved"). Then run ./ship.sh to publish.
// Usage: node scripts/approve-sponsor.mjs <session_id> [--start=YYYY-MM-DD] [--key=directory/<slug>|agent-skills/<slug>] [--force] [--dry-run]
import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
const root = new URL('..', import.meta.url).pathname;
const NS = process.env.KV_SIGNUPS_NAMESPACE_ID || '64407d49a3f44bb4a7b024179d9e587f';
const slugify = (s) => s.toLowerCase().replace(/&/g, ' and ').replace(/\./g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const addDays = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
export const todayPT = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date());

// Pure planning step (tested in scripts/test-sponsor-details.mjs).
export function placementKey(rec, data, override) {
  const cats = new Set(data.categories.map((c) => c.slug));
  const skillCats = new Set(data.skills.map((s) => slugify(s.category)));
  const check = (k) => { const [t, s] = k.split('/'); if ((t === 'directory' && cats.has(s)) || (t === 'agent-skills' && skillCats.has(s))) return k; throw new Error(`unknown category key: ${k}`); };
  if (override) return override === 'sitewide' ? 'sitewide' : check(override);
  if (rec.product === 'sitewide-sponsor') return 'sitewide';
  const url = rec.product === 'category-sponsor' ? rec.checkout?.category : rec.checkout?.listing;
  let p = ''; try { p = new URL(url).pathname; } catch { throw new Error(`cannot read the Swarmnest URL from checkout (${url}); pass --key=`); }
  let m;
  if ((m = p.match(/^\/directory\/([a-z0-9-]+)\/?/))) return check('directory/' + m[1]);
  if ((m = p.match(/^\/agent-skills\/category\/([a-z0-9-]+)\/?/))) return check('agent-skills/' + m[1]);
  if ((m = p.match(/^\/agent-skills\/([a-z0-9-]+)\/?$/))) { const s = data.skills.find((x) => x.slug === m[1]); if (s) return check('agent-skills/' + slugify(s.category)); }
  throw new Error(`cannot map ${url} to a category; pass --key=directory/<slug> or --key=agent-skills/<slug>`);
}
export function planApproval(rec, data, opts = {}) {
  if (!rec || !rec.fields) throw new Error('no Ad Details record for this session (the buyer has not submitted the form yet)');
  if (rec.status === 'approved' && !opts.force) throw new Error('already approved (pass --force to re-approve)');
  const key = placementKey(rec, data, opts.key);
  const start = opts.start || todayPT();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--start must be YYYY-MM-DD');
  const end = rec.mode === 'once' ? addDays(start, 29) : undefined; // one-time: 30 days inclusive; monthly: until cancelled
  const tail = rec.session.slice(-8).toLowerCase().replace(/[^a-z0-9]/g, '');
  const logoFile = rec.logo ? `${slugify(rec.fields.name).slice(0, 30) || 'sponsor'}-${tail}.${rec.logo.ext}` : null;
  const bannerFile = rec.banner && key === 'sitewide' ? `${slugify(rec.fields.name).slice(0, 30) || 'sponsor'}-${tail}-banner.${rec.banner.ext}` : null;
  const entry = { name: rec.fields.name, headline: rec.fields.headline, text: rec.fields.sentence, url: rec.fields.url, ...(logoFile ? { logo: '/sponsors/' + logoFile } : {}), ...(bannerFile ? { banner: '/sponsors/' + bannerFile } : {}), start, ...(end ? { end } : {}), order: rec.session, ...(rec.subscription ? { subscription: rec.subscription } : {}), product: rec.product, mode: rec.mode };
  const sp = structuredClone(data.sponsors);
  const live = (s) => s && (!s.end || s.end >= start);
  if (key === 'sitewide') { if (live(sp.sitewide) && sp.sitewide.order !== rec.session && !opts.force) throw new Error('a sitewide sponsor is already active (pass --force to replace)'); sp.sitewide = entry; }
  else if (rec.product === 'featured-listing') {
    const arr = (Array.isArray(sp.featured[key]) ? sp.featured[key] : sp.featured[key] ? [sp.featured[key]] : []).filter((s) => s.order !== rec.session);
    if (arr.filter(live).length >= 2 && !opts.force) throw new Error(`${key} already has 2 active featured listings (pass --force)`);
    sp.featured[key] = [...arr, entry];
  } else {
    const cur = sp.categories[key];
    if (live(cur) && cur.order !== rec.session && !opts.force) throw new Error(`${key} already has an active category sponsor (pass --force to replace)`);
    sp.categories[key] = entry;
  }
  return { key, entry, sponsors: sp, logoFile, bannerFile };
}
const wr = (args, opt = {}) => execFileSync('npx', ['wrangler', 'kv', 'key', ...args, '--namespace-id', NS], { env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || 'e48ffb81a1db5717af9ab1a0bfb937f8' }, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 20e6, ...opt });
async function main() {
  const args = process.argv.slice(2); const sid = args.find((a) => !a.startsWith('--'));
  const opt = (n) => (args.find((a) => a.startsWith(`--${n}=`)) || '').split('=')[1];
  if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(sid || '')) { console.error('usage: node scripts/approve-sponsor.mjs <session_id> [--start=YYYY-MM-DD] [--key=...] [--force] [--dry-run]'); process.exit(2); }
  const dry = args.includes('--dry-run');
  let raw; try { raw = wr(['get', 'sponsor-details:' + sid, '--text']).toString(); } catch (e) { console.error('could not read KV (is wrangler logged in?)'); process.exit(1); }
  const rec = raw.trim() && raw.trim() !== 'Value not found' ? JSON.parse(raw) : null;
  const data = { categories: JSON.parse(readFileSync(root + 'data/categories.json', 'utf8')), skills: JSON.parse(readFileSync(root + 'data/skills.json', 'utf8')), sponsors: JSON.parse(readFileSync(root + 'data/sponsors.json', 'utf8')) };
  let plan; try { plan = planApproval(rec, data, { start: opt('start'), key: opt('key'), force: args.includes('--force') }); } catch (e) { console.error('not approved:', e.message); process.exit(1); }
  console.log(`placement: ${plan.key}\n` + JSON.stringify(plan.entry, null, 1));
  if (rec.country && rec.country !== 'US') console.log(`WARNING: billing country ${rec.country} (US-only terms)`);
  if (dry) { console.log('dry run: nothing written'); return; }
  if (plan.logoFile) {
    const buf = wr(['get', 'sponsor-logo:' + sid]);
    mkdirSync(root + 'public/sponsors', { recursive: true }); writeFileSync(root + 'public/sponsors/' + plan.logoFile, buf);
    console.log(`logo: public/sponsors/${plan.logoFile} (${buf.length} bytes)`);
  }
  if (plan.bannerFile) {
    const buf = wr(['get', 'sponsor-banner:' + sid]);
    mkdirSync(root + 'public/sponsors', { recursive: true }); writeFileSync(root + 'public/sponsors/' + plan.bannerFile, buf);
    console.log(`banner: public/sponsors/${plan.bannerFile} (${buf.length} bytes)`);
  }
  writeFileSync(root + 'data/sponsors.json', JSON.stringify(plan.sponsors, null, 1) + '\n');
  const locked = { ...rec, status: 'approved', approvedAt: new Date().toISOString(), placement: plan.key, start: plan.entry.start, end: plan.entry.end || null };
  const tmp = mkdtempSync(tmpdir() + '/sp-'); writeFileSync(tmp + '/v.json', JSON.stringify(locked));
  wr(['put', 'sponsor-details:' + sid, '--path', tmp + '/v.json']);
  const CNT = root + 'data/kv-writes.json', day = new Date().toISOString().slice(0, 10);
  let c = existsSync(CNT) ? JSON.parse(readFileSync(CNT, 'utf8')) : { day, total: 0, log: [] }; if (c.day !== day) c = { day, total: 0, log: [] };
  c.total += 1; c.log.push({ at: new Date().toISOString(), writes: 1, what: 'approve-sponsor ' + sid.slice(0, 16) + '…' }); writeFileSync(CNT, JSON.stringify(c, null, 1));
  console.log('record locked (status approved). data/sponsors.json updated. Publish with: ./ship.sh "Sponsor: ' + rec.fields.name.replace(/"/g, '') + '"');
}
if (import.meta.url === `file://${process.argv[1]}`) main();
