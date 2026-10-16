const H={'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*','cache-control':'public, max-age=300'};
const J=(o,s=200)=>new Response(JSON.stringify(o,null,1),{status:s,headers:H});
function score(e,ts){const n=e.name.toLowerCase(),c=(e.category_name+' '+e.category).toLowerCase(),d=e.description.toLowerCase(),x=(e.auth+' '+e.pricing).toLowerCase();let s=0;
for(const t of ts){let m=0;if(n===t)m=12;else if(n.startsWith(t))m=9;else if(n.includes(t))m=7;else if(c.includes(t))m=4;else if(d.includes(t))m=2;else if(x.includes(t))m=1;if(!m)return 0;s+=m}return s}
export async function onRequest({request,env}){
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...H,'access-control-allow-methods':'GET,OPTIONS'}});
 const u=new URL(request.url),q=(u.searchParams.get('q')||'').trim().toLowerCase(),cat=u.searchParams.get('category'),auth=u.searchParams.get('auth'),pricing=u.searchParams.get('pricing');
 let limit=parseInt(u.searchParams.get('limit')||'20',10);if(!(limit>0))limit=20;limit=Math.min(limit,100);
 if(!q&&!cat)return J({error:'Provide q and/or category. Example: /api/v1/search?q=translate&limit=10',docs:'https://swarmnest.ai/openapi.json'},400);
 const r=await env.ASSETS.fetch(new URL('/directory.json',u));const all=(await r.json()).entries;
 const ts=q?q.split(/\s+/):[];
 let hits=all.filter(e=>(!cat||e.category===cat)&&(!auth||e.auth===auth)&&(!pricing||e.pricing===pricing)).map(e=>({s:ts.length?score(e,ts):1,e})).filter(h=>h.s>0);
 hits.sort((a,b)=>b.s-a.s||a.e.name.localeCompare(b.e.name));
 return J({query:q,category:cat||null,total:hits.length,count:Math.min(hits.length,limit),results:hits.slice(0,limit).map(h=>({...h.e,score:h.s}))});
}
