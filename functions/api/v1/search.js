import Core from '../../_lib/search-core.js';
const H={'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*','cache-control':'public, max-age=300'};
const J=(o,s=200)=>new Response(JSON.stringify(o,null,1),{status:s,headers:H});
let IDX=null,VOC=null,KNOWN=null; // parsed once per isolate to keep CPU low
async function load(env,u){
 if(IDX)return;
 const [r,v]=await Promise.all([env.ASSETS.fetch(new URL('/api-index.json',u)),env.ASSETS.fetch(new URL('/search-vocab.json',u))]);
 const d=await r.json();VOC=await v.json();KNOWN=Core.mkVocab(VOC);
 IDX=Core.prepare(d.rows.map(r=>({name:r[0],slug:r[1],category:r[2],category_name:r[3],description:r[4],url:r[5],docs_url:r[6],auth:r[7],pricing:r[8],http_status:r[9],last_checked_at:r[10],status:r[11],swarmnest_url:`https://swarmnest.ai/directory/${r[2]}/${r[1]}/`})));
}
const pub=e=>{const o={...e};for(const k of Object.keys(o))if(k[0]==='_')delete o[k];return o};
export async function onRequest({request,env}){
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...H,'access-control-allow-methods':'GET,OPTIONS'}});
 const u=new URL(request.url),q=(u.searchParams.get('q')||'').trim().slice(0,200),cat=u.searchParams.get('category'),auth=u.searchParams.get('auth'),pricing=u.searchParams.get('pricing');
 let limit=parseInt(u.searchParams.get('limit')||'20',10);if(!(limit>0))limit=20;limit=Math.min(limit,100);
 if(!q&&!cat)return J({error:'Provide q and/or category. Example: /api/v1/search?q=translate&limit=10',docs:'https://swarmnest.ai/openapi.json'},400);
 await load(env,u);
 const r=Core.run(IDX,VOC,KNOWN,q,{category:cat,auth,pricing});
 return J({query:r.query,corrected_query:r.corrected,fuzzy:!!r.corrected,category:cat||null,total:r.total,count:Math.min(r.total,limit),results:r.hits.slice(0,limit).map(h=>({...pub(h.e),score:h.score}))});
}
