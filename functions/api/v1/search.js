const H={'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*','cache-control':'public, max-age=300'};
const J=(o,s=200)=>new Response(JSON.stringify(o,null,1),{status:s,headers:H});
const SW=new Set(['to','for','the','a','an','and','of','in','on','with','api','apis','tool','tools']);
const stem=t=>t.length>5?t.replace(/ations?$/,'at').replace(/(ings?|ions?|ers?|es|ed|s|e)$/,''):t;
function terms(q){const w=q.split(/\s+/).filter(Boolean).slice(0,8);const k=w.filter(t=>!SW.has(t));return (k.length?k:w).map(stem)}
const nz=x=>x.toLowerCase().replace(/[-_\/]+/g,' ');
let IDX=null; // parsed once per isolate to keep CPU low
async function index(env,u){
 if(IDX)return IDX;
 const r=await env.ASSETS.fetch(new URL('/api-index.json',u));const d=await r.json();
 IDX=d.rows.map(r=>{const e={name:r[0],slug:r[1],category:r[2],category_name:r[3],description:r[4],url:r[5],docs_url:r[6],auth:r[7],pricing:r[8],http_status:r[9],last_checked_at:r[10],status:r[11]};
  e._n=e.name.toLowerCase();e._c=(e.category_name+' '+e.category).toLowerCase();e._d=e.description.toLowerCase();e._x=e.auth+' '+e.pricing;e._cn=nz(e.category_name);e._nn=nz(e.name);e._dn=nz(e.description);
  e.swarmnest_url=`https://swarmnest.ai/directory/${e.category}/${e.slug}/`;return e});
 return IDX}
function bonus(e,q){if(!q.includes(' '))return 0;const Q=nz(q);let b=0;if(e._cn.includes(Q))b+=20;if(e._nn.includes(Q))b+=15;if(e._dn.includes(Q))b+=5;return b}
function score(e,ts){let s=0;for(const t of ts){let m=0;if(e._n===t)m=12;else if(e._n.startsWith(t))m=9;else if(e._n.includes(t))m=7;else if(e._c.includes(t))m=4;else if(e._d.includes(t))m=2;else if(e._x.includes(t))m=1;if(!m)return 0;s+=m}return s}
function lev(a,b){const m=a.length,n=b.length;let p=Array.from({length:n+1},(_,j)=>j);for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}return p[n]}
function fscore(e,ts){ // typo tolerance on name + category words only (keeps CPU bounded)
 const nm=e._nw||(e._nw=e._n.split(/[^a-z0-9]+/).filter(Boolean));const cw=e._cw||(e._cw=e._c.split(/[^a-z0-9]+/).filter(Boolean));const words=nm.concat(cw);let s=0;
 for(const t of ts){let best=9;const tol=t.length>=7?2:1;words.forEach((w,j)=>{let d;if(w.startsWith(t))d=0;else if(t.length<4||Math.abs(w.length-t.length)>tol+2)return;else d=Math.min(lev(t,w.slice(0,t.length)),lev(t,w));if(d<=tol&&(d+=Math.abs(w.length-t.length)*0.05)<best){best=d;if(j<nm.length)best-=0.5}});if(best===9)return 0;s+=4-best}return s}
const pub=e=>{const o={...e};for(const k of Object.keys(o))if(k[0]==='_')delete o[k];return o};
export async function onRequest({request,env}){
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...H,'access-control-allow-methods':'GET,OPTIONS'}});
 const u=new URL(request.url),q=(u.searchParams.get('q')||'').trim().toLowerCase().slice(0,200),cat=u.searchParams.get('category'),auth=u.searchParams.get('auth'),pricing=u.searchParams.get('pricing');
 let limit=parseInt(u.searchParams.get('limit')||'20',10);if(!(limit>0))limit=20;limit=Math.min(limit,100);
 if(!q&&!cat)return J({error:'Provide q and/or category. Example: /api/v1/search?q=translate&limit=10',docs:'https://swarmnest.ai/openapi.json'},400);
 const all=await index(env,u);
 const ts=q?terms(q):[];
 const base=all.filter(e=>(!cat||e.category===cat)&&(!auth||e.auth===auth)&&(!pricing||e.pricing===pricing));
 let hits=base.map(e=>{const s=ts.length?score(e,ts):1;return {s:s&&ts.length?s+bonus(e,q):s,e}}).filter(h=>h.s>0);
 let fuzzy=false;
 if(!hits.length&&ts.length&&ts.length<=4){hits=base.map(e=>({s:fscore(e,ts),e})).filter(h=>h.s>0);fuzzy=true}
 hits.sort((a,b)=>b.s-a.s||a.e.name.localeCompare(b.e.name));
 return J({query:q,fuzzy,category:cat||null,total:hits.length,count:Math.min(hits.length,limit),results:hits.slice(0,limit).map(h=>({...pub(h.e),score:h.s}))});
}
