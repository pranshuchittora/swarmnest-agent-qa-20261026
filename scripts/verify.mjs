// Link-integrity crawl. usage: node scripts/verify.mjs https://swarmnest.ai
import fs from 'node:fs';
const base=(process.argv[2]||'https://swarmnest.ai').replace(/\/$/,'');
const UA={'user-agent':'Swarmnest/1.0 (+https://swarmnest.ai)'};
const legacy=JSON.parse(fs.readFileSync('data/legacy.json','utf8'));
const before=fs.existsSync('data/live-sitemap-before.txt')?fs.readFileSync('data/live-sitemap-before.txt','utf8').split('\n').filter(Boolean).map(u=>u.replace('https://swarmnest.ai','')):[];
async function pool(items,n,fn){let i=0;const res=[];await Promise.all(Array.from({length:n},async()=>{while(i<items.length){const k=i++;res[k]=await fn(items[k]).catch(e=>({err:String(e)}))}}));return res}
const get=async(p,redirect='manual')=>{let r;for(let i=0;i<4;i++){r=await fetch(base+p,{redirect,headers:UA});if(r.status<400||r.status===403&&false)return r;await new Promise(z=>setTimeout(z,500*(i+1)))}return r};
const fails=[];const fail=(k,m)=>fails.push(k+': '+m);
// 1 legacy URLs: must be 200 or single 301 -> 200
const old=new Set(before);
for(const c of legacy.cats)old.add(`/directory/${c}/`);
for(const [c,s] of legacy.entries)old.add(`/directory/${c}/${s}/`);
for(const t of ['research-analyst','support-agent','seo-writer','lead-researcher','data-analyst','devops-helper','executive-assistant','social-media-manager']){old.add(`/use-cases/${t}/`);old.add(`/api/v1/personas/${t}.json`)}old.add('/api/v1/personas.json');
const olds=[...old];let nred=0,n200=0;
await pool(olds,16,async p=>{const r=await get(p);if(r.status===200){n200++;return}
 if(r.status===301){nred++;const loc=r.headers.get('location');const t=new URL(loc,base).pathname;const r2=await get(t);if(r2.status!==200)fail('legacy',`${p} -> ${t} gave ${r2.status}`);return}
 fail('legacy',`${p} status ${r.status}`)});
console.log(`legacy urls ${olds.length}: ${n200} direct 200, ${nred} one-hop 301, failures so far ${fails.length}`);
// 2 sitemap
const sm=await (await get('/sitemap.xml')).text();const smurls=[...sm.matchAll(/<loc>([^<]+)/g)].map(m=>m[1].replace('https://swarmnest.ai',''));
const pages=new Map();
await pool(smurls,16,async p=>{const r=await get(p);if(r.status!==200){fail('sitemap',`${p} ${r.status}`);return}pages.set(p,await r.text())});
console.log('sitemap urls',smurls.length,'ok',pages.size);
// 3 internal links in every page
const links=new Set();
for(const [p,h] of pages)for(const m of h.matchAll(/href="([^"#]+)(#[^"]*)?"/g)){let u=m[1];if(u.startsWith('https://swarmnest.ai'))u=u.slice(20);if(!u.startsWith('/')||u.startsWith('//')||u.startsWith('/cdn-cgi/'))continue;links.add(u)}
const lk=[...links].filter(u=>!smurls.includes(u));
await pool(lk,16,async u=>{const r=await get(u,'follow');if(r.status!==200)fail('link',`${u} ${r.status}`)});
console.log('internal links',links.size,'(non-sitemap checked',lk.length+')');
// 4 llms.txt, llms-full, api
const extra=new Set(['/llms.txt','/llms-full.txt','/openapi.json','/directory.json','/api/v1/directory.json','/api/v1/categories.json','/api/v1/agent-templates.json','/api/v1/use-cases.json','/api/v1/products.json','/search-index.json','/search-vocab.json','/search.js','/opensearch.xml','/robots.txt','/api/v1/search?q=stripe']);
const llms=await (await get('/llms.txt')).text();for(const m of llms.matchAll(/\]\((https:\/\/swarmnest\.ai[^)\s]*)\)/g))extra.add(m[1].replace('https://swarmnest.ai',''));
const dj=await (await get('/api/v1/directory.json')).json();const list=dj.entries||dj.results||dj;
for(const e of list)extra.add(`/api/v1/directory/${e.slug}.json`);
const ex=[...extra].filter(u=>!u.includes('{'));
await pool(ex,16,async u=>{const r=await get(u,'follow');if(r.status!==200)fail('llms/api',`${u} ${r.status}`)});
console.log('llms/api urls',ex.length);
console.log(fails.length?'FAILURES '+fails.length+'\n'+fails.slice(0,60).join('\n'):'ALL OK');
process.exit(fails.length?1:0);
