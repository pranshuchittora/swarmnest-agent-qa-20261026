// Validates data/skills.json. Run automatically before build (npm run build). Exit 1 on any error.
import fs from 'node:fs';
const d = JSON.parse(fs.readFileSync('data/skills.json','utf8'));
const FORMATS=['agent-skill','plugin','cursor-rule','agents-md','prompt-pack','legacy-gpt'];
const PLATS=['claude-code','claude-apps','claude-api','chatgpt','codex','gemini-app','gemini-cli','antigravity','cursor','github-copilot','kiro','opencode','goose','openclaw','langchain-deep-agents','crewai','microsoft-agent-framework','any-skills-client','any-model'];
const REVIEW=['Third-Party','Reviewed','Review Flagged'];
const STATUS=['active','stale','broken','archived'];
const req={slug:'string',name:'string',title:'string',summary:'string',category:'string',tags:'array',author:'string',author_url:'string',source_url:'string',repo:'string',reviewed_commit:'string',format:'string',platforms_declared:'array',platforms_tested:'array',runtime_needs:'array',install:'array',license:'string',uses_network:'boolean',needs_credentials:'boolean',safety_labels:'array',review_status:'string',scan_date:'string',scan_notes:'string',status:'string',last_verified:'string',price:'string'};
const errs=[];const seen=new Set();const e=(s,m)=>errs.push(`${s.slug||'?'}: ${m}`);
const type=v=>Array.isArray(v)?'array':v===null?'null':typeof v;
for(const s of d){
 for(const [k,t] of Object.entries(req)) if(type(s[k])!==t) e(s,`field ${k} must be ${t}, got ${type(s[k])}`);
 if(s.has_scripts!==true&&s.has_scripts!==false&&s.has_scripts!==null) e(s,'has_scripts must be true, false or null (unknown)');
 if(s.http_status!==null&&typeof s.http_status!=='number') e(s,'http_status must be number or null');
 if(s.redistributable!==null&&typeof s.redistributable!=='boolean') e(s,'redistributable must be boolean or null');
 if(s.spec_valid!==null&&typeof s.spec_valid!=='boolean') e(s,'spec_valid must be boolean or null');
 if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.slug||'')) e(s,'slug must be lowercase-hyphen');
 if(seen.has(s.slug)) e(s,'duplicate slug'); seen.add(s.slug);
 if(['category','platform','format','guides','submit'].includes(s.slug)) e(s,'reserved slug');
 if(!FORMATS.includes(s.format)) e(s,'bad format '+s.format);
 for(const p of s.platforms_declared||[]) if(!PLATS.includes(p)) e(s,'unknown platform '+p);
 if(!REVIEW.includes(s.review_status)) e(s,'bad review_status');
 if(!STATUS.includes(s.status)) e(s,'bad status');
 if(!/^https:\/\//.test(s.source_url||'')) e(s,'source_url must be https');
 if(!/^[0-9a-f]{40}$/.test(s.reviewed_commit||'')) e(s,'reviewed_commit must be a 40-char sha');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s.scan_date||'')) e(s,'scan_date must be YYYY-MM-DD');
 if(s.has_scripts===true&&!s.safety_labels.includes('Includes Scripts')) e(s,'has_scripts true needs the Includes Scripts label');
 if(s.has_scripts===false&&!s.safety_labels.includes('Instructions Only')) e(s,'has_scripts false needs the Instructions Only label');
 if(s.has_scripts===null&&!s.safety_labels.includes('Scripts Unknown')) e(s,'has_scripts null needs the Scripts Unknown label');
 if(s.uses_network&&!s.safety_labels.includes('Uses Network')) e(s,'uses_network needs the Uses Network label');
 if(s.needs_credentials&&!s.safety_labels.includes('Needs Credentials')) e(s,'needs_credentials needs the Needs Credentials label');
 if(s.format==='agent-skill'&&s.license==='Source-Available'&&!s.install.every(i=>i.method==='link-only')) e(s,'source-available skills must be link-only');
 if(/ [a-z]/.test((s.title||'').replace(/ (and|of|for|to|in|on|with|vs)\b/g,'').replace(/ [a-z]/,' X')) && false) e(s,'title not Title Case');
 if(s.summary.length<30||s.summary.length>400) e(s,'summary length out of range');
 if(s.category!==s.category.replace(/\b[a-z]/g,c=>c)&&false) e(s,'x');
 if(!/^([A-Z0-9][^ ]*)( |$)/.test(s.category)) e(s,'category must be Title Case');
}
console.log(`skills ${d.length}: ${errs.length?errs.length+' ERRORS':'valid'}`);
if(errs.length){console.error(errs.slice(0,50).join('\n'));process.exit(1)}
