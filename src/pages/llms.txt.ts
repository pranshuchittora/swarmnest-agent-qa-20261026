import { ALL, CATS, byCat, SITE } from '../lib/data';
export const GET = () => new Response(`# Swarmnest

> Swarmnest is a hub for AI agents and the people who run them. Its core is a hand-checked directory of ${ALL.length} tools, APIs, MCP servers and data sources, available as human pages and as JSON. Use cases/personas and a marketplace are coming soon.

## Machine-readable
- [Directory JSON](${SITE}/directory.json): every entry with name, slug, category, description, url, docs_url, auth, pricing
- [API: list](${SITE}/api/v1/directory.json)
- [API: one entry](${SITE}/api/v1/directory/{slug}.json): replace {slug}, e.g. ${SITE}/api/v1/directory/${ALL[0].slug}.json
- [API: categories](${SITE}/api/v1/categories.json)
- [OpenAPI description](${SITE}/openapi.json)
- [Full text version of this site](${SITE}/llms-full.txt)
- [Sitemap](${SITE}/sitemap.xml)

## Directory categories
${CATS.map(c=>`- [${c.name}](${SITE}/directory/${c.slug}/): ${c.blurb} (${byCat(c.slug).length} entries)`).join('\n')}

## Pages
- [About](${SITE}/about/)
- [Submit a tool](${SITE}/submit/): email hello@swarmnest.ai
- [Terms](${SITE}/terms/)
- [Privacy](${SITE}/privacy/)

## Notes
- Fields: auth is none, key or oauth; pricing is free, freemium or paid.
- Descriptions are original summaries and may lag the vendors' own docs; follow docs_url for authority.
- Swarmnest is not affiliated with listed tools. Contact: hello@swarmnest.ai
`,{headers:{'content-type':'text/plain; charset=utf-8'}});
