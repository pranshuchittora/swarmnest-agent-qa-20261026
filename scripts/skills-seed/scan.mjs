import fs from 'node:fs';
const T=process.env.GITHUB_TOKEN;const H={Authorization:'Bearer '+T,'User-Agent':'swarmnest'};
const repos=process.argv.slice(2);
const CODE=/\.(py|sh|bash|js|mjs|cjs|ts|rb|go|rs|ps1|pl|php|java|kt|swift|c|cpp|zsh)$/i;
const out=[];
for(const repo of repos){
 const meta=await (await fetch('https://api.github.com/repos/'+repo,{headers:H})).json();
 if(!meta.default_branch){console.error('skip',repo,meta.message);continue}
 const br=meta.default_branch;
 const tr=await (await fetch(`https://api.github.com/repos/${repo}/git/trees/${br}?recursive=1`,{headers:H})).json();
 const br2=await (await fetch(`https://api.github.com/repos/${repo}/commits/${br}`,{headers:H})).json();
 const sha=br2.sha;const files=tr.tree.filter(t=>t.type==='blob').map(t=>t.path);
 const skills=files.filter(p=>/(^|\/)SKILL\.md$/i.test(p)).filter(p=>!/(^|\/)(node_modules|tests?|fixtures?|examples?|templates?)\//i.test(p)||repo.includes('anthropics'));
 console.error(repo,'skills',skills.length,tr.truncated?'TRUNCATED':'');
 for(const p of skills){
  const dir=p.replace(/\/?SKILL\.md$/i,'');
  const inDir=files.filter(f=>dir===''?true:f.startsWith(dir+'/'));
  const nested=inDir.filter(f=>/(^|\/)SKILL\.md$/i.test(f)&&f!==p&&f.startsWith(dir+'/'));
  let mine=inDir;if(nested.length){const subdirs=nested.map(n=>n.replace(/\/SKILL\.md$/i,'/'));mine=inDir.filter(f=>!subdirs.some(s=>f.startsWith(s)))}
  const hasScriptsDir=mine.some(f=>/(^|\/)scripts\//i.test(f.slice(dir.length)));
  const codeFiles=mine.filter(f=>CODE.test(f)&&!/(^|\/)(node_modules)\//.test(f));
  out.push({repo,branch:br,sha,path:p,dir,license:meta.license&&meta.license.spdx_id,stars:meta.stargazers_count,hasScriptsDir,codeFiles:codeFiles.slice(0,6),ncode:codeFiles.length,nfiles:mine.length});
 }
}
fs.writeFileSync(process.env.OUT||'scan.json',JSON.stringify(out));
