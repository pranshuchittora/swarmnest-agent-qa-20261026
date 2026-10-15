import { ALL, CATS, entryJson, SITE, BUILD_DATE } from '../lib/data';
export const GET = () => new Response(JSON.stringify({ name:'Swarmnest directory', url:SITE+'/directory/', generated_at:BUILD_DATE, count:ALL.length, categories:CATS, entries:ALL.map(entryJson) },null,1),{headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*'}});
