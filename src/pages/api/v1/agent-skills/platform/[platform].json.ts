import { SKILLS, compact, platformsUsed } from '../../../../../lib/skills';
export function getStaticPaths(){return platformsUsed.map(p=>({params:{platform:p.slug},props:{p}}))}
export const GET=({props}:any)=>{const l=SKILLS.filter(s=>s.platforms_declared.includes(props.p.slug));return new Response(JSON.stringify({platform:props.p.name,count:l.length,skills:l.map(compact)},null,1),{headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*','cache-control':'public, max-age=300'}})};
