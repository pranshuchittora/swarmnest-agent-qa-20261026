import { LAUNCH } from '../lib/config';
import { TEMPLATES, USECASES, PRODUCTS } from '../lib/content';
import { ALL, CATS, GROUPS, byCat, SITE } from '../lib/data';
export const GET = () => new Response(`# Swarmnest

> Swarmnest is a hub for AI agents and the people who run them. Its core is a hand-checked directory of ${ALL.length} tools, APIs, MCP servers and data sources, available as human pages and as JSON. It also has 8 use cases with 8 ready-made agent templates, and a marketplace of own products that is coming soon.

## Machine-Readable
- [Directory JSON](${SITE}/directory.json): every entry with name, slug, category, description, url, docs_url, auth, pricing
- [API: list](${SITE}/api/v1/directory.json)
- [API: one entry](${SITE}/api/v1/directory/{slug}.json): replace {slug}, e.g. ${SITE}/api/v1/directory/${ALL[0].slug}.json
- [API: search](${SITE}/api/v1/search?q=translate&category=translation-apis&limit=10): GET, params q (keywords, all must match), category (slug), auth (none|key|oauth), pricing (free|freemium|paid), limit (max 100). Returns ranked JSON results. Human search: ${SITE}/search/
- [API: categories](${SITE}/api/v1/categories.json)
- [OpenAPI description](${SITE}/openapi.json)
- [Full text version of this site](${SITE}/llms-full.txt)
- [Sitemap](${SITE}/sitemap.xml)

## Directory Categories (${CATS.length} in ${GROUPS.length} groups)
${GROUPS.map(g=>`### ${g.name}\n${g.blurb}\n${g.cats.map(c=>`- [${c.name}](${SITE}/directory/${c.slug}/): ${c.blurb} (${byCat(c.slug).length} entries)`).join('\n')}`).join('\n\n')}

## Pages
- [About](${SITE}/about/)
- [Submit a tool](${SITE}/submit/): email hello@swarmnest.ai
- [Terms](${SITE}/terms/)
- [Privacy](${SITE}/privacy/)
- [API terms](${SITE}/api-terms/)
- [All legal policies](${SITE}/legal/)
- [Refunds](${SITE}/refunds/)
- [Takedown](${SITE}/takedown/)

## Use Cases (Jobs to Be Done)
- [Index](${SITE}/use-cases/) and [JSON](${SITE}/api/v1/use-cases.json)
${USECASES.map(u=>`- [${u.name}](${SITE}/use-cases/${u.slug}/): ${u.goal}`).join('\n')}

## Agent Templates (Ready-Made Agents: Instructions, Guardrails, Tools, Persona and Tone)
- [Index](${SITE}/agent-templates/) and [JSON](${SITE}/api/v1/agent-templates.json)
${TEMPLATES.map(p=>`- [${p.name}](${SITE}/agent-templates/${p.slug}/): ${p.role}`).join('\n')}

## Marketplace (${LAUNCH?'for sale':'Coming Soon, Not for Sale Yet'})
- [Marketplace](${SITE}/marketplace/) and [JSON](${SITE}/api/v1/products.json)
${PRODUCTS.map(p=>`- [${p.title}](${SITE}/marketplace/${p.slug}/): ${p.summary}${LAUNCH?' ('+p.price+')':''}`).join('\n')}

## Notes
- Fields: auth is none, key or oauth; pricing is free, freemium or paid.
- Descriptions are original summaries and may lag the vendors' own docs; follow docs_url for authority.
- Swarmnest is not affiliated with listed tools. Contact: hello@swarmnest.ai
`,{headers:{'content-type':'text/plain; charset=utf-8'}});
