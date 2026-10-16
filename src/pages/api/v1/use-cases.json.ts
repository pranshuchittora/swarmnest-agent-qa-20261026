import { USECASES } from '../../../lib/content';
import { SITE } from '../../../lib/data';
export const GET=()=>new Response(JSON.stringify({count:USECASES.length,use_cases:USECASES.map(u=>({...u,url:`${SITE}/use-cases/${u.slug}/`,template_urls:u.templates.map(t=>`${SITE}/agent-templates/${t}/`)}))},null,1),{headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*'}});
