import { ALL, CATS, entryJson, SITE, BUILD_DATE } from '../../../lib/data';
export const GET = () => new Response(JSON.stringify({ count:ALL.length, generated_at:BUILD_DATE, note:'Static snapshot. Filter client-side on category, auth and pricing.', categories:CATS, entries:ALL.map(entryJson) },null,1),{headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*'}});
