import { ALL, CATS, byCat, SITE, authLabel, priceLabel } from '../lib/data';
export const GET = () => new Response(`# Swarmnest: full directory

Hub for AI agents and the people who run them. ${ALL.length} entries. Source: ${SITE}/directory.json

${CATS.map(c=>`## ${c.name}\n${c.blurb}\n\n${byCat(c.slug).map(e=>`### ${e.name}\n${e.description}\n- Page: ${SITE}/directory/${c.slug}/${e.slug}/\n- Website: ${e.url}\n- Docs: ${e.docs_url}\n- Auth: ${authLabel[e.auth]}\n- Pricing: ${priceLabel[e.pricing]}\n`).join('\n')}`).join('\n')}
`,{headers:{'content-type':'text/plain; charset=utf-8'}});
