const H={'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*','cache-control':'public, max-age=300'};
const J=(o,s=200)=>new Response(JSON.stringify(o,null,1),{status:s,headers:H});
const SW=new Set(['to','for','the','a','an','and','of','in','on','with','api','apis','tool','tools']);
const stem=t=>t.length>5?t.replace(/ations?$/,'at').replace(/(ings?|ions?|ers?|es|ed|s|e)$/,''):t;
function terms(q){const w=q.split(/\s+/).filter(Boolean);const k=w.filter(t=>!SW.has(t));return (k.length?k:w).map(stem)}
const nz=x=>x.toLowerCase().replace(/[-_\/]+/g,' ');
function bonus(e,q){if(!q||!q.includes(' '))return 0;const Q=nz(q);let b=0;if(nz(e.category_name)===Q||nz(e.category_name).includes(Q))b+=20;if(nz(e.name).includes(Q))b+=15;if(nz(e.description).includes(Q))b+=5;return b}
function score(e,ts){const n=e.name.toLowerCase(),c=(e.category_name+' '+e.category).toLowerCase(),d=e.description.toLowerCase(),x=(e.auth+' '+e.pricing).toLowerCase();let s=0;
for(const t of ts){let m=0;if(n===t)m=12;else if(n.startsWith(t))m=9;else if(n.includes(t))m=7;else if(c.includes(t))m=4;else if(d.includes(t))m=2;else if(x.includes(t))m=1;if(!m)return 0;s+=m}return s}
function lev(a,b){const m=a.length,n=b.length;let p=Array.from({length:n+1},(_,j)=>j);for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}return p[n]}
function fscore(e,ts){const nm=e.name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean),words=nm.concat((e.category_name+' '+e.description).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));let s=0;
for(const t of ts){let best=9;const tol=t.length>=7?2:1;words.forEach((w,j)=>{let d;if(w.startsWith(t))d=0;else if(t.length<4)return;else d=Math.min(lev(t,w.slice(0,t.length)),lev(t,w));if(d<=tol&&(d+=Math.abs(w.length-t.length)*0.05)<best){best=d;if(j<nm.length)best-=0.5}});if(best===9)return 0;s+=4-best}return s}
export async function onRequest({request,env}){
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...H,'access-control-allow-methods':'GET,OPTIONS'}});
 const u=new URL(request.url),q=(u.searchParams.get('q')||'').trim().toLowerCase(),cat=u.searchParams.get('category'),auth=u.searchParams.get('auth'),pricing=u.searchParams.get('pricing');
 let limit=parseInt(u.searchParams.get('limit')||'20',10);if(!(limit>0))limit=20;limit=Math.min(limit,100);
 if(!q&&!cat)return J({error:'Provide q and/or category. Example: /api/v1/search?q=translate&limit=10',docs:'https://swarmnest.ai/openapi.json'},400);
 const r=await env.ASSETS.fetch(new URL('/directory.json',u));const all=(await r.json()).entries;
 const ts=q?terms(q):[];
 let hits=all.filter(e=>(!cat||e.category===cat)&&(!auth||e.auth===auth)&&(!pricing||e.pricing===pricing)).map(e=>({s:ts.length?(score(e,ts)?score(e,ts)+bonus(e,q):0):1,e})).filter(h=>h.s>0);
 let fuzzy=false;
 if(!hits.length&&ts.length){const base=all.filter(e=>(!cat||e.category===cat)&&(!auth||e.auth===auth)&&(!pricing||e.pricing===pricing));hits=base.map(e=>({s:fscore(e,ts),e})).filter(h=>h.s>0);fuzzy=true}
 hits.sort((a,b)=>b.s-a.s||a.e.name.localeCompare(b.e.name));
 return J({query:q,fuzzy,category:cat||null,total:hits.length,count:Math.min(hits.length,limit),results:hits.slice(0,limit).map(h=>({...h.e,score:h.s}))});
}
