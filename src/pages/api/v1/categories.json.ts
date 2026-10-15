import { CATS, byCat } from '../../../lib/data';
export const GET = () => new Response(JSON.stringify({categories:CATS.map(c=>({...c,count:byCat(c.slug).length}))},null,1),{headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*'}});
