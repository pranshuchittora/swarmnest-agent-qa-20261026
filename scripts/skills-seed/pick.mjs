import fs from 'node:fs';
const d=JSON.parse(fs.readFileSync('scan1.json','utf8'));
const lim={'anthropics/skills':99,'openai/skills':99,'vercel-labs/agent-skills':99,'cloudflare/skills':99,'supabase/agent-skills':99,'huggingface/skills':99,'stripe/ai':99,'addyosmani/agent-skills':99,'coreyhaines31/marketingskills':15,'obra/superpowers':99,'OthmanAdi/planning-with-files':99,'blader/humanizer':99,'JimLiu/baoyu-skills':12,'microsoft/skills':24,'K-Dense-AI/scientific-agent-skills':20,'phuryn/pm-skills':12};
const cnt={};const seenName=new Set();const sel=[];
const skip=p=>/^template\//.test(p)||/providers\//.test(p)||/\/(i18n|translations?|docs|\.codex|\.opencode|\.gemini|\.cursor|\.kiro|\.continue|\.openclaw|\.pi)\//i.test(p)||/^(\.(codex|opencode|gemini|cursor|kiro|continue|openclaw|pi|claude)\/)/.test(p);
let src=d.filter(x=>lim[x.repo]);
// microsoft: prefer .github/skills then azure-skills, deep-wiki
if(true){src.sort((a,b)=>{const r=x=>x.repo!=='microsoft/skills'?0:x.path.startsWith('.github/skills/')?0:/azure-skills\//.test(x.path)&&x.path.split('/').length<=7?1:/deep-wiki|m365|agents-toolkit/.test(x.path)?2:9;return r(a)-r(b)})}
for(const x of src){ if(skip(x.path))continue; if(x.repo==='microsoft/skills'&&/sdk-/.test(x.path))continue;
 if((cnt[x.repo]||0)>=lim[x.repo])continue; if(x.repo==='stripe/ai'&&!/^skills\//.test(x.path))continue;
 if(x.repo==='K-Dense-AI/scientific-agent-skills'&&!/^scientific-skills\//.test(x.path))continue;
 if(x.repo==='microsoft/skills'&&x.path.split('/').length>8)continue;
 const key=x.path.split('/').slice(-2,-1)[0]; if(x.repo==='openai/skills'&&seenName.has(key))continue; if(x.repo==='openai/skills')seenName.add(key);
 cnt[x.repo]=(cnt[x.repo]||0)+1;sel.push(x)}
console.log(cnt,sel.length);
fs.writeFileSync('sel.json',JSON.stringify(sel));
