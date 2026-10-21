import { ALL, entryJson, BUILD_DATE } from '../lib/data';
import catmap from '../../data/catmap.json';
export const GET = () => new Response(JSON.stringify({checked:BUILD_DATE,catmap,rows:ALL.map(e=>{const j:any=entryJson(e);return [j.name,j.slug,j.category,j.category_name,j.description,j.url,j.docs_url,j.auth,j.pricing,j.http_status,j.last_checked_at,j.status]})}),{headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=300'}});
