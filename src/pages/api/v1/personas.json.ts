import { PERSONAS } from '../../../lib/content';
import { SITE } from '../../../lib/data';
export const GET=()=>new Response(JSON.stringify({count:PERSONAS.length,personas:PERSONAS.map(p=>({...p,url:`${SITE}/use-cases/${p.slug}/`}))},null,1),{headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*'}});
