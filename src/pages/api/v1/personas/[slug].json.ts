import { PERSONAS } from '../../../../lib/content';
import { SITE } from '../../../../lib/data';
export const getStaticPaths=()=>PERSONAS.map(p=>({params:{slug:p.slug},props:{p}}));
export const GET=({props}:any)=>new Response(JSON.stringify({...props.p,url:`${SITE}/use-cases/${props.p.slug}/`},null,1),{headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*'}});
