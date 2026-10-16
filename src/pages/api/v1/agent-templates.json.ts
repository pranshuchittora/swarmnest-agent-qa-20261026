import { TEMPLATES, useCasesFor } from '../../../lib/content';
import { SITE } from '../../../lib/data';
export const GET=()=>new Response(JSON.stringify({count:TEMPLATES.length,agent_templates:TEMPLATES.map(p=>({...p,use_cases:useCasesFor(p.slug).map(u=>u.slug),url:`${SITE}/agent-templates/${p.slug}/`}))},null,1),{headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*'}});
