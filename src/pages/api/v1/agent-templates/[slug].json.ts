import { TEMPLATES, useCasesFor } from '../../../../lib/content';
import { SITE } from '../../../../lib/data';
export const getStaticPaths=()=>TEMPLATES.map(p=>({params:{slug:p.slug},props:{p}}));
export const GET=({props}:any)=>new Response(JSON.stringify({...props.p,use_cases:useCasesFor(props.p.slug).map(u=>({slug:u.slug,name:u.name,url:`${SITE}/use-cases/${u.slug}/`})),url:`${SITE}/agent-templates/${props.p.slug}/`},null,1),{headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*'}});
