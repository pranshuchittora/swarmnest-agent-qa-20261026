import { SKILLS, CATEGORIES, fmtByKey, platName } from '../lib/skills';
import { ALL, CATS, byCat, SITE, authLabel, priceLabel } from '../lib/data';
export const GET = () => new Response(`# Swarmnest: full directory

Hub for AI agents and the people who run them. ${ALL.length} entries. Source: ${SITE}/directory.json

${CATS.map(c=>`## ${c.name}\n${c.blurb}\n\n${byCat(c.slug).map(e=>`### ${e.name}\n${e.description}\n- Page: ${SITE}/directory/${c.slug}/${e.slug}/\n- Website: ${e.url}\n- Docs: ${e.docs_url}\n- Auth: ${authLabel[e.auth]}\n- Pricing: ${priceLabel[e.pricing]}\n`).join('\n')}`).join('\n')}


# Agent Skills (${SKILLS.length} listings; all Not Reviewed; platforms are declared, not tested)

${CATEGORIES.map(c=>`## ${c.name}\n${SKILLS.filter(s=>s.category===c.name).map(s=>`- ${s.title} [${fmtByKey(s.format).short}; ${s.has_scripts===true?'Includes Scripts':s.has_scripts===false?'Instructions Only':'Scripts Unknown'}; ${s.platforms_declared.map(platName).join(', ')||'platforms not stated'}]: ${s.summary} ${SITE}/agent-skills/${s.slug}/`).join('\n')}\n`).join('\n')}
`,{headers:{'content-type':'text/plain; charset=utf-8'}});
