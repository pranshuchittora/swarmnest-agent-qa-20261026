import { SKILLS, compact, CATEGORIES } from '../../../../../lib/skills';
export function getStaticPaths(){return CATEGORIES.map(c=>({params:{category:c.slug},props:{c}}))}
export const GET=({props}:any)=>{const l=SKILLS.filter(s=>s.category===props.c.name);return new Response(JSON.stringify({category:props.c.name,count:l.length,skills:l.map(compact)},null,1),{headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*','cache-control':'public, max-age=300'}})};
