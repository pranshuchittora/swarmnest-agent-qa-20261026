import { PRODUCTS } from '../../../lib/content';
import { SITE } from '../../../lib/data';
export const GET=()=>new Response(JSON.stringify({count:PRODUCTS.length,status:'coming_soon',products:PRODUCTS.map(p=>({...p,status:'coming_soon',url:`${SITE}/marketplace/${p.slug}/`}))},null,1),{headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*'}});
