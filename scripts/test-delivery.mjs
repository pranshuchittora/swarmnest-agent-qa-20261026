import { onRequestGet as dl } from '../functions/download/[[path]].js';
import { sendDeliveryEmail, buildDeliveryEmail } from '../functions/_lib/email.js';
import { onRequestPost as hook } from '../functions/api/stripe-webhook.js';
import { createHmac } from 'crypto';
const ok=(c,n)=>{console.log(c?'PASS':'FAIL',n); if(!c) process.exitCode=1;};
const store=new Map(); const kv={get:async(k)=>store.has(k)?store.get(k):null,put:async(k,v)=>{store.set(k,v)}};
const T='a'.repeat(64);
store.set('dl:'+T,JSON.stringify({slug:'agent-templates-pack',expires:Date.now()+1e6,count:0}));
store.set('pm:agent-templates-pack',JSON.stringify(['README.md','agent-templates/x/template.json']));
store.set('pf:agent-templates-pack:README.md','# hi'); store.set('pf:agent-templates-pack:agent-templates/x/template.json','{"a":1}');
store.set('file:agent-templates-pack-v2.0.zip',new Uint8Array([80,75]).buffer);
const env={SIGNUPS:kv,FILES:kv};
const get=(path,q='')=>dl({params:{path},env,request:{url:'https://x/download/'+path.join('/')+q}});
let r=await get([T]); let h=await r.text(); ok(r.status===200&&r.headers.get('content-type').startsWith('text/html')&&h.includes('/f/agent-templates/x/template.json')&&h.includes('/zip'),'list page');
r=await get([T,'f','README.md']); ok(r.status===200&&r.headers.get('content-type')==='text/plain; charset=utf-8'&&r.headers.get('content-disposition').startsWith('inline')&&await r.text()==='# hi','view md');
r=await get([T,'f','agent-templates','x','template.json'],'?dl=1'); ok(r.headers.get('content-disposition').startsWith('attachment'),'save json');
r=await get([T,'f','..','etc']); ok(r.status===404,'traversal');
r=await get([T,'f','nope.md']); ok(r.status===404,'missing file');
r=await get([T,'zip']); ok(r.status===200&&r.headers.get('content-type')==='application/zip','zip'); ok(JSON.parse(store.get('dl:'+T)).count===1,'count');
r=await get(['zz']); ok(r.status===404,'bad token');
store.set('dl:'+T,JSON.stringify({slug:'agent-templates-pack',expires:Date.now()-1,count:0})); r=await get([T,'f','README.md']); ok(r.status===410,'expired');
// email
ok((await sendDeliveryEmail({},{to:'a@b.co',slug:'agent-templates-pack',token:T,sessionId:'cs_test_1'})).skipped,'noop without key');
let sent; const f=async(u,o)=>{sent={u,o};return {ok:true,status:200}};
ok((await sendDeliveryEmail({RESEND_API_KEY:'k'},{to:'a@b.co',slug:'agent-templates-pack',token:T,sessionId:'cs_test_1'},f)).sent && JSON.parse(sent.o.body).text.includes('/download/'+T),'sends');
{ const b=JSON.parse(sent.o.body); ok(b.reply_to==='support@swarmnest.ai'&&b.text.includes('support@swarmnest.ai')&&b.html.includes('support@swarmnest.ai')&&b.from.includes('hello@swarmnest.ai'),'email reply-to and support line'); }
ok((await sendDeliveryEmail({RESEND_API_KEY:'k'},{to:null,slug:'agent-templates-pack',token:T,sessionId:'c'},f)).skipped,'no recipient');
ok(!(await sendDeliveryEmail({RESEND_API_KEY:'k'},{to:'a@b.co',slug:'agent-templates-pack',token:T,sessionId:'c'},async()=>{throw new Error('x')})).sent,'fetch error swallowed');
// webhook with no key
const price='price_1UQiiz6aC1E09RZY6BordMgo';
globalThis.fetch=async()=>({ok:true,json:async()=>({object:'checkout.session',payment_status:'paid',line_items:{data:[{price:{id:price}}]}})});
const body=JSON.stringify({id:'evt_1',type:'checkout.session.completed',data:{object:{id:'cs_test_abc',customer_details:{email:'a@b.co'}}}});
const t=Math.floor(Date.now()/1000), sig=createHmac('sha256','wh').update(`${t}.${body}`).digest('hex');
store.clear();
const res=await hook({request:{text:async()=>body,headers:{get:()=>`t=${t},v1=${sig}`}},env:{...env,STRIPE_WEBHOOK_SECRET:'wh',STRIPE_API_KEY:'x'}});
ok(res.status===200&&JSON.parse(store.get('order:cs_test_abc')).emailed===false,'webhook ok without RESEND key');
// idempotency: a second event for the same session (retry, or async_payment_succeeded) creates no second token and no second email
{
  const toks=()=>[...store.keys()].filter(k=>k.startsWith('dl:')).length;
  let mails=0; const realFetch=globalThis.fetch;
  globalThis.fetch=async(u,o)=>{ if(String(u).includes('resend.com')){mails++;return {ok:true,status:200};} return realFetch(u,o); };
  const send=async(evId,type)=>{ const b=JSON.stringify({id:evId,type,data:{object:{id:'cs_test_idem1',customer_details:{email:'a@b.co'}}}}); const tt=Math.floor(Date.now()/1000), sg=createHmac('sha256','wh').update(`${tt}.${b}`).digest('hex'); return hook({request:{text:async()=>b,headers:{get:()=>`t=${tt},v1=${sg}`}},env:{...env,STRIPE_WEBHOOK_SECRET:'wh',STRIPE_API_KEY:'x',RESEND_API_KEY:'k'}}); };
  store.clear(); await send('evt_a','checkout.session.completed'); await send('evt_a','checkout.session.completed'); await send('evt_b','checkout.session.async_payment_succeeded');
  ok(toks()===1&&mails===1,'webhook idempotent per session (1 token, 1 email)');
  globalThis.fetch=realFetch;
}
// bundle files resolve from the member product's keys
{
  const b=new Map(); const kv2={get:async(k)=>b.has(k)?b.get(k):null,put:async(k,v)=>{b.set(k,v)}}; const TB='b'.repeat(64);
  b.set('dl:'+TB,JSON.stringify({slug:'growth-bundle',expires:Date.now()+1e6,count:0})); b.set('pf:lead-research-workflow:README.md','# lead'); b.set('pf:growth-bundle:START-HERE.md','# start');
  const g=(p)=>dl({params:{path:[TB,...p]},env:{SIGNUPS:kv2,FILES:kv2},request:{url:'https://x/'}});
  let r=await g(['f','lead-research-workflow','README.md']); ok(r.status===200&&await r.text()==='# lead','bundle member file resolves');
  r=await g(['f','START-HERE.md']); ok(r.status===200,'bundle root file');
  r=await g(['f','mcp-server-starter-kit','README.md']); ok(r.status===404,'non-member path 404');
}
