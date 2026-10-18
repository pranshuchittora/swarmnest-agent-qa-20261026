import { SKILLS, compact, FORMATS } from '../../../../../lib/skills';
export function getStaticPaths(){return FORMATS.map(f=>({params:{format:f.slug},props:{f}}))}
export const GET=({props}:any)=>{const l=SKILLS.filter(s=>s.format===props.f.key);return new Response(JSON.stringify({format:props.f.name,count:l.length,skills:l.map(compact)},null,1),{headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*','cache-control':'public, max-age=300'}})};
