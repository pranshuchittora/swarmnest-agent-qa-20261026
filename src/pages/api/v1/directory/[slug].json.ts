import { ALL, entryJson } from '../../../../lib/data';
export function getStaticPaths(){ return ALL.map(e=>({params:{slug:e.slug},props:{e}})); }
export const GET = ({props}:any) => new Response(JSON.stringify(entryJson(props.e),null,1),{headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*'}});
