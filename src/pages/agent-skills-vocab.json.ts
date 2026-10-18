import { SKILLS } from '../lib/skills';
const tok=(t:string)=>t.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
export const GET=()=>{const f=new Map<string,number>();const b=(w:string,n:number)=>{if(w.length>=3&&!/^[0-9]+$/.test(w))f.set(w,(f.get(w)||0)+n)};
for(const s of SKILLS){tok(s.title).forEach(w=>b(w,6));tok(s.category).forEach(w=>b(w,4));tok(s.summary).forEach(w=>b(w,1));s.platforms_declared.forEach(p=>tok(p).forEach(w=>b(w,2)))}
const v=[...f].filter(([w,n])=>n>=2).sort((a,c)=>c[1]-a[1]||(a[0]<c[0]?-1:1));
return new Response(JSON.stringify(v),{headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=300'}})};
