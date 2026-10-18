import fs from 'node:fs';
const H={Authorization:'Bearer '+process.env.GITHUB_TOKEN,'User-Agent':'s'};
const cands=['openai/codex','vercel/next.js','agentsmd/agents.md','cloudflare/workers-sdk','apache/airflow','supabase/supabase','langchain-ai/langchain','huggingface/transformers','vercel/ai','denoland/deno','astral-sh/uv','shadcn-ui/ui','mastra-ai/mastra','vercel/turborepo','microsoft/vscode','facebook/react','stripe/stripe-node','prisma/prisma','biomejs/biome','honojs/hono','sveltejs/svelte','withastro/astro','pydantic/pydantic','tailwindlabs/tailwindcss'];
const out=[];
for(const r of cands){const m=await (await fetch('https://api.github.com/repos/'+r,{headers:H})).json();if(!m.default_branch)continue;
 const sha=(await (await fetch(`https://api.github.com/repos/${r}/commits/${m.default_branch}`,{headers:H})).json()).sha;
 const raw=await fetch(`https://raw.githubusercontent.com/${r}/${sha}/AGENTS.md`);
 if(raw.status===200){const t=await raw.text();out.push({repo:r,branch:m.default_branch,sha,license:m.license&&m.license.spdx_id,stars:m.stargazers_count,len:t.length,head:t.slice(0,160).replace(/\n/g,' ')})}}
fs.writeFileSync('agentsmd.json',JSON.stringify(out));out.forEach(x=>console.log(x.repo,x.license,x.len,x.head.slice(0,100)));
// plugin descriptions
const pl=JSON.parse(fs.readFileSync('plug.json','utf8'));const seen=new Set();const sel=[];
for(const p of pl){const k=p.repo+p.dir;if(seen.has(k))continue;if(p.repo==='anthropics/claude-plugins-official'&&p.dir.startsWith('plugins/')&&!/example-plugin|cwc-makers|mcp-tunnels|project-artifact/.test(p.dir)||(p.repo==='wshobson/agents'&&/plugins\/(backend-development|cloud-infrastructure|conductor|kubernetes-operations)$/.test(p.dir))){seen.add(k);sel.push(p)}}
await Promise.all(sel.map(async p=>{const r=await fetch(`https://raw.githubusercontent.com/${p.repo}/${p.sha}/${p.manifest}`);if(r.status===200){try{const j=await r.json();p.pname=j.name;p.pdesc=j.description;p.pauthor=j.author&&(j.author.name||j.author);p.plic=j.license}catch(e){}}p.rawStatus=r.status}));
fs.writeFileSync('plugsel.json',JSON.stringify(sel));console.log(sel.length,sel.filter(p=>!p.pdesc).length);
sel.forEach(p=>console.log(p.dir,'|',(p.pdesc||'').slice(0,80),'|',p.ncode,p.hooks,p.scriptsDir,p.plic))
