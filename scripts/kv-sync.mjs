// Diff-based, write-capped upload of product files to the FILES KV namespace (Cloudflare free tier: 1,000 writes/day).
//   node scripts/kv-sync.mjs [--dry-run] [--override] [--max-day=600] [--dist=DIR] [--only=slug,slug]
// - Builds the desired key set (text files via product-files.mjs, plus each zip as file:<name>).
// - Compares with data/kv-manifest.json (sha256 per key; NO KV reads) and writes only new/changed keys.
// - Counts every write against a UTC-day counter (data/kv-writes.json); aborts if the plan would push the day over --max-day
//   (default 600) unless --override. Counts are recorded BEFORE each batch (a failed batch still counts: be conservative).
// - Manifest is updated only for batches that succeeded. Never deletes keys (stale keys are reported only).
import { execFileSync } from 'child_process'; import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
const arg = (n, d) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').split('=')[1] ?? d;
const flag = (n) => process.argv.includes(`--${n}`);
const NS = process.env.KV_FILES_NAMESPACE_ID || '797f788d1993456597425618f59188c1';
process.env.CLOUDFLARE_ACCOUNT_ID ||= 'e48ffb81a1db5717af9ab1a0bfb937f8';
const MAX = Number(arg('max-day', 600)), dist = arg('dist', '/workspace/swarmnest-products/dist');
const only = arg('only', '') ? arg('only').split(',') : null;
const root = new URL('..', import.meta.url).pathname, MAN = root + 'data/kv-manifest.json', CNT = root + 'data/kv-writes.json', BULK = '/workspace/kv-files-bulk.json';
const sha = (b) => createHash('sha256').update(b).digest('hex');
const load = (f, d) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : d);

execFileSync('node', [root + 'scripts/product-files.mjs', dist, BULK], { stdio: 'ignore' });
const desired = new Map(); // key -> {hash, kind, value|path}
for (const { key, value } of JSON.parse(readFileSync(BULK, 'utf8'))) desired.set(key, { hash: sha(value), kind: 'text', value });
for (const z of readdirSync(dist).filter((f) => f.endsWith('.zip'))) desired.set('file:' + z, { hash: sha(readFileSync(`${dist}/${z}`)), kind: 'zip', path: `${dist}/${z}` });
const slugOf = (k) => k.startsWith('file:') ? k.slice(5).replace(/-v[\d.]+\.zip$/, '') : k.split(':')[1];
const manifest = load(MAN, {});
const changed = [...desired].filter(([k, v]) => manifest[k] !== v.hash && (!only || only.includes(slugOf(k))));
const texts = changed.filter(([, v]) => v.kind === 'text'), zips = changed.filter(([, v]) => v.kind === 'zip');
const stale = Object.keys(manifest).filter((k) => !desired.has(k));

const today = new Date().toISOString().slice(0, 10);
let cnt = load(CNT, { day: today, total: 0, log: [] });
if (cnt.day !== today) cnt = { day: today, total: 0, log: [] };
const planned = changed.length;
console.log(`KV plan: ${texts.length} text keys + ${zips.length} zips = ${planned} writes; unchanged ${desired.size - changed.length}; stale (not deleted) ${stale.length}`);
console.log(`Today (UTC ${today}) already counted: ${cnt.total}; cap for this run: ${MAX}${flag('override') ? ' (OVERRIDE ON)' : ''}`);
if (!planned) { console.log('Nothing to upload.'); process.exit(0); }
if (cnt.total + planned > MAX && !flag('override')) { console.error(`ABORT: ${cnt.total} + ${planned} would exceed ${MAX} writes today. Narrow with --only=slug, wait for the next UTC day, or pass --override.`); process.exit(2); }
if (flag('dry-run')) { console.log('dry run: no writes'); process.exit(0); }

const save = () => writeFileSync(CNT, JSON.stringify(cnt, null, 1)), saveMan = () => writeFileSync(MAN, JSON.stringify(manifest, null, 1));
const record = (n, what) => { cnt.total += n; cnt.log.push({ at: new Date().toISOString(), writes: n, what }); save(); };
const wr = (args) => execFileSync('npx', ['wrangler', 'kv', ...args, '--namespace-id', NS], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
let failed = 0;
if (texts.length) { // one bulk call; all-or-nothing
  const tmp = '/tmp/kv-sync-bulk.json'; writeFileSync(tmp, JSON.stringify(texts.map(([key, v]) => ({ key, value: v.value }))));
  record(texts.length, `bulk text keys (${texts.length})`);
  try { wr(['bulk', 'put', tmp]); for (const [k, v] of texts) manifest[k] = v.hash; saveMan(); console.log(`bulk ok: ${texts.length}`); }
  catch (e) { failed += texts.length; console.error('bulk FAILED:', String(e.stderr || e).split('\n').filter((l) => /error|limit/i.test(l)).slice(0, 2).join(' | ')); }
}
for (const [k, v] of zips) {
  if (failed && /limit/i.test(String(process.env.KV_LAST_ERR))) break;
  record(1, k);
  try { wr(['key', 'put', k, '--path', v.path]); manifest[k] = v.hash; saveMan(); console.log('ok', k); }
  catch (e) { failed++; process.env.KV_LAST_ERR = String(e.stderr || e); console.error('FAILED', k, /limit/i.test(process.env.KV_LAST_ERR) ? '(daily limit)' : ''); if (/limit/i.test(process.env.KV_LAST_ERR)) break; }
}
console.log(`done. failed=${failed}; day total counted=${cnt.total}`); process.exit(failed ? 1 : 0);
