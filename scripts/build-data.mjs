import fs from 'node:fs';
const raw = fs.readFileSync('data/raw.txt','utf8').split('\n').filter(Boolean);
const status = {};
if (fs.existsSync('urlstatus.txt')) for (const l of fs.readFileSync('urlstatus.txt','utf8').split('\n')) { const [c,...u]=l.split(' '); if(u.length) status[u.join(' ')]=+c; }
const checked = process.env.CHECKED_AT || '2026-10-14';
const slugify = s => s.toLowerCase().replace(/&/g,' and ').replace(/\./g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const seen = new Set(); const out = [];
for (const line of raw) {
  const [category,name,url,docs_url,auth,pricing,...d] = line.split('|');
  const slug = slugify(name); if (seen.has(slug)) throw new Error('dup '+slug); seen.add(slug);
  out.push({ name, slug, category, description: d.join('|'), url, docs_url, auth, pricing, http_status: status[url] ?? null, last_checked_at: checked, status: 'active' });
}
fs.writeFileSync('data/entries.json', JSON.stringify(out,null,1));
console.log('entries', out.length);
