// Submit new/changed URLs to IndexNow. Usage: node scripts/indexnow.mjs [--dry]
// Reads dist/sitemap*.xml (static only), hashes each page's built HTML, submits those new/changed vs data/indexnow-state.json.
import fs from 'node:fs'; import crypto from 'node:crypto';
const HOST='swarmnest.ai', KEY='3205e3fa2163157dfb7582edb2f7a986', KEYLOC=`https://${HOST}/${KEY}.txt`, STATE='data/indexnow-state.json', dry=process.argv.includes('--dry');
const read=f=>fs.existsSync(f)?fs.readFileSync(f,'utf8'):'';
const locs=x=>[...x.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(m=>m[1]);
let urls=[]; const idx=read('dist/sitemap-index.xml');
if(idx) for(const l of locs(idx)) urls.push(...locs(read('dist/'+new URL(l).pathname.replace(/^\//,''))));
else urls=locs(read('dist/sitemap.xml'));
urls=[...new Set(urls)]; if(!urls.length){console.error('no sitemap urls (run build first)');process.exit(1);}
const hashOf=u=>{const p=new URL(u).pathname; for(const f of [`dist${p}${p.endsWith('/')?'index.html':'/index.html'}`,`dist${p}`]) if(fs.existsSync(f)&&fs.statSync(f).isFile()) return crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0,16); return 'url';};
const old=fs.existsSync(STATE)?JSON.parse(read(STATE)):{};
const cur={}; for(const u of urls) cur[u]=hashOf(u);
const todo=urls.filter(u=>old[u]!==cur[u]);
console.log(`sitemap ${urls.length} urls, to submit ${todo.length}`);
if(dry||!todo.length) process.exit(0);
const next={...old}; let ok=true;
for(let i=0;i<todo.length;i+=10000){const b=todo.slice(i,i+10000);
 const r=await fetch('https://api.indexnow.org/indexnow',{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8','User-Agent':'Swarmnest/1.0'},body:JSON.stringify({host:HOST,key:KEY,keyLocation:KEYLOC,urlList:b})});
 console.log('IndexNow batch',b.length,'HTTP',r.status);
 if(r.status===200||r.status===202) b.forEach(u=>next[u]=cur[u]); else {ok=false;console.error((await r.text()).slice(0,200));}}
fs.writeFileSync(STATE,JSON.stringify(next));
process.exit(ok?0:1);
