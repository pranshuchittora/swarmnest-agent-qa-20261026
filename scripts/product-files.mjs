// Reads product zips -> src/lib/product-files.json (listing) and a KV bulk file for individual-file delivery.
// Usage: node scripts/product-files.mjs [distDir] [bulkOut]
import { execFileSync } from 'child_process'; import { readdirSync, writeFileSync } from 'fs';
const dist = process.argv[2] || '/workspace/swarmnest-products/dist';
const bulkOut = process.argv[3] || '/workspace/kv-files-bulk.json';
const listing = {}, bulk = [];
for (const z of readdirSync(dist).filter((f) => f.endsWith('.zip'))) {
  const slug = z.replace(/-v[\d.]+\.zip$/, '');
  const names = execFileSync('unzip', ['-Z1', `${dist}/${z}`], { encoding: 'utf8' }).split('\n').filter((n) => n && !n.endsWith('/'));
  const files = [];
  for (const n of names) {
    const buf = execFileSync('unzip', ['-p', `${dist}/${z}`, n], { maxBuffer: 50e6 });
    const rel = n.split('/').slice(1).join('/');
    if (buf.includes(0)) continue; // skip binary
    files.push(rel);
    bulk.push({ key: `pf:${slug}:${rel}`, value: buf.toString('utf8') });
  }
  files.sort(); listing[slug] = files;
  bulk.push({ key: `pm:${slug}`, value: JSON.stringify(files) });
}
writeFileSync(new URL('../src/lib/product-files.json', import.meta.url), JSON.stringify(listing, null, 1));
writeFileSync(bulkOut, JSON.stringify(bulk));
console.log(Object.entries(listing).map(([k, v]) => k + ':' + v.length).join(' '));
