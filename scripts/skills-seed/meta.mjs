import fs from 'node:fs';
const sel=JSON.parse(fs.readFileSync('sel.json','utf8'));
async function pool(items,n,fn){let i=0;await Promise.all(Array.from({length:n},async()=>{while(i<items.length){const k=i++;await fn(items[k]).catch(e=>{items[k].err=String(e)})}}))}
await pool(sel,12,async x=>{const u=`https://raw.githubusercontent.com/${x.repo}/${x.sha}/${x.path}`;const r=await fetch(u);x.rawStatus=r.status;if(r.status!==200)return;const t=await r.text();const m=t.match(/^---\r?\n([\s\S]*?)\r?\n---/);const fm=m?m[1]:'';
 const get=k=>{const mm=fm.match(new RegExp('^'+k+':\\s*(.*)$','m'));if(!mm)return null;let v=mm[1].trim();if(/^[>|]/.test(v)){const idx=fm.indexOf(mm[0])+mm[0].length;const rest=fm.slice(idx).split('\n').slice(1);const lines=[];for(const l of rest){if(/^\S/.test(l))break;lines.push(l.trim())}v=lines.join(' ')}return v.replace(/^["']|["']$/g,'')};
 x.fmName=get('name');x.fmDesc=get('description');x.fmLicense=get('license');x.fmCompat=get('compatibility');x.hasFm=!!m;
 const body=t.toLowerCase();x.net=/\b(curl |wget |fetch\(|requests\.|https?:\/\/api\.|webfetch|web search|websearch)/.test(body);x.cred=/(api[_ -]?key|access[_ -]?token|\bsecret\b|credentials|_token\b|oauth)/.test(body)})
fs.writeFileSync('sel2.json',JSON.stringify(sel));
console.log(sel.filter(x=>x.rawStatus!==200).length,'bad raw;',sel.filter(x=>!x.fmName||!x.fmDesc).length,'missing fm');
