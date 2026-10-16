import { ALL, entryJson } from '../lib/data';
export const GET = () => new Response(JSON.stringify(ALL.map(e=>{const j:any=entryJson(e);return [j.name,j.description,j.category,j.category_name,j.auth,j.pricing,j.swarmnest_url.replace(/^https?:\/\/[^/]+/,'')]})),{headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*','cache-control':'public, max-age=300'}});
