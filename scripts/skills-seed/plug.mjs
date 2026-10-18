import fs from 'node:fs';
const H={Authorization:'Bearer '+process.env.GITHUB_TOKEN,'User-Agent':'s'};
const CODE=/\.(py|sh|bash|js|mjs|cjs|ts|rb|go|rs|ps1|pl|php|zsh)$/i;
const res=[];
for(const repo of ['anthropics/claude-plugins-official','wshobson/agents','openai/plugins','stripe/ai','cloudflare/skills','supabase/agent-skills']){
 const m=await (await fetch('https://api.github.com/repos/'+repo,{headers:H})).json(); if(!m.default_branch){console.error(repo,m.message);continue}
 const t=await (await fetch(`https://api.github.com/repos/${repo}/git/trees/${m.default_branch}?recursive=1`,{headers:H})).json();
 const sha=(await (await fetch(`https://api.github.com/repos/${repo}/commits/${m.default_branch}`,{headers:H})).json()).sha;
 const files=t.tree.filter(x=>x.type==='blob').map(x=>x.path);
 const pj=files.filter(f=>/(^|\/)\.(claude|codex|cursor)-plugin\/plugin\.json$/.test(f));
 console.error(repo,pj.length);
 for(const p of pj){const dir=p.replace(/\/?\.(claude|codex|cursor)-plugin\/plugin\.json$/,'');const mine=files.filter(f=>dir===''||f.startsWith(dir+'/'));
  res.push({repo,branch:m.default_branch,sha,license:m.license&&m.license.spdx_id,dir,manifest:p,ncode:mine.filter(f=>CODE.test(f)).length,hooks:mine.some(f=>/(^|\/)hooks\//.test(f)||/hooks\.json$/.test(f)),scriptsDir:mine.some(f=>/(^|\/)scripts\//.test(f)),skills:mine.filter(f=>/SKILL\.md$/i.test(f)).length,mcp:mine.some(f=>/\.mcp\.json$/.test(f)),cmds:mine.some(f=>/(^|\/)commands\//.test(f)),agents:mine.some(f=>/(^|\/)agents\//.test(f))})}
}
fs.writeFileSync('plug.json',JSON.stringify(res));
console.log(res.length);
for(const r of res)console.log(r.repo.split('/')[0],r.dir,r.ncode,r.hooks,r.skills)
