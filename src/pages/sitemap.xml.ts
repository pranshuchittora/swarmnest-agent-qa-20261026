import { PERSONAS, PRODUCTS } from '../lib/content';
import { ALL, CATS, SITE, BUILD_DATE } from '../lib/data';
const urls = ['/','/directory/','/about/','/submit/','/marketplace/','/use-cases/','/terms/','/privacy/','/refunds/','/takedown/',...PERSONAS.map(p=>`/use-cases/${p.slug}/`),...PRODUCTS.map(p=>`/marketplace/${p.slug}/`),...CATS.map(c=>`/directory/${c.slug}/`),...ALL.map(e=>`/directory/${e.category}/${e.slug}/`)];
export const GET = () => new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`<url><loc>${SITE}${u}</loc><lastmod>${BUILD_DATE}</lastmod></url>`).join('\n')}\n</urlset>\n`,{headers:{'content-type':'application/xml; charset=utf-8'}});
