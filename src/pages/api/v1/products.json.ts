import { PRODUCTS } from '../../../lib/content';
import { LAUNCH, BUY_URLS } from '../../../lib/config';
import { SITE } from '../../../lib/data';
const status = LAUNCH ? 'available' : 'coming_soon';
export const GET=()=>new Response(JSON.stringify({count:PRODUCTS.length,status,products:PRODUCTS.map(p=>({slug:p.slug,title:p.title,type:p.type,summary:p.summary,price_usd:p.cents/100,status,url:`${SITE}/marketplace/${p.slug}/`,...(LAUNCH?{buy_url:BUY_URLS[p.slug]}:{})}))},null,1),{headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*'}});
