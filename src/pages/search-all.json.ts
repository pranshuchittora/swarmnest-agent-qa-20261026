// Unified static search index: directory categories and groups, Agent Skills categories, hub pages,
// directory entries, Agent Skills, Marketplace packs, use cases and agent templates. Served as a static file (no Functions).
import { ALL, CATS, catName } from '../lib/data';
import { SKILLS, CATEGORIES, skillPath } from '../lib/skills';
import { PRODUCTS, USECASES, TEMPLATES } from '../lib/content';
import { NAV_GROUPS, groupPath, groupForCat, catCount } from '../lib/nav';
// Extra words people type for a category (synonyms). Matched like category text.
const ALIAS: Record<string, string> = {
  'mcp-servers': 'mcp model context protocol server servers', 'macos-mcp-servers': 'mcp mac macos apple', 'mcp-directories': 'mcp registry',
  'llm-apis': 'llm llms large language model gpt claude gemini', 'ai-coding-assistants': 'coding agents code agent agents ai coding copilot',
  'vector-databases': 'vector db vectordb embeddings store', 'browser-automation': 'browser agent headless chrome playwright puppeteer',
  'text-to-speech': 'tts voice synthesis', 'speech-transcription': 'stt asr speech to text transcription', 'agent-frameworks': 'agent agents framework frameworks',
  'mac-ai-agent-apps': 'mac macos apple desktop', 'mac-computer-use': 'mac macos computer use desktop control', 'mac-local-llm-runners': 'mac macos local llm ollama',
  'web-scraping-apis': 'scrape scraper crawler crawl', 'scraping-libraries': 'scrape scraper crawler crawl', 'code-execution': 'sandbox sandboxes code interpreter',
  'workflow-automation': 'zapier n8n automation automate', 'local-inference': 'local llm offline ollama', 'embeddings-rerankers': 'embedding embeddings rerank',
  'observability-evals': 'evals eval tracing monitoring llm', 'security-guardrails': 'guardrails safety prompt injection', 'ocr-document-parsing': 'ocr pdf parsing',
};
const SK_ALIAS: Record<string, string> = {
  'apple-macos-skills': 'mac macos apple', 'mac-admin-skills': 'mac macos apple', 'mac-automation-skills': 'mac macos apple automation',
  'mac-computer-use-skills': 'mac macos computer use', 'swift-swiftui-and-xcode-skills': 'swift swiftui xcode ios mac macos apple',
  'apple-ios-skills': 'ios iphone ipad apple swift', 'app-store-connect-skills': 'app store ios mac apple', 'homebrew-skills': 'brew mac macos',
  'mcp-building-skills': 'mcp model context protocol server', 'cursor-rules': 'cursor rules mdc', 'code-review-skills': 'coding code review',
  'debugging-skills': 'coding debug', 'software-engineering-skills': 'coding code', 'testing-skills': 'coding tests', 'git-workflow-skills': 'git github coding',
};
const cut = (s: string, n = 110) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s);
const rows: (string | number)[][] = [];
// type codes: c=directory category, g=group, k=skill category, h=hub, e=entry, s=skill, p=pack, u=use case, t=template
for (const c of CATS) { const g = groupForCat(c.slug); rows.push(['c', c.name, cut(c.blurb), `/directory/${c.slug}/`, `${catCount(c.slug)} tools${g ? ' · ' + g.name : ''}`, (ALIAS[c.slug] || '') + ' category ' + c.slug.replace(/-/g, ' ')]); }
for (const g of NAV_GROUPS) rows.push(['g', g.name, cut(g.blurb || ''), groupPath(g.slug), `${g.cats.length} categories · ${g.total} tools`, 'group directory']);
for (const k of CATEGORIES) rows.push(['k', k.name, `Agent Skills category with ${k.count} listings.`, `/agent-skills/category/${k.slug}/`, `${k.count} skills`, (SK_ALIAS[k.slug] || '') + ' skill skills agent']);
rows.push(['h', 'macOS Hub', 'Mac tools, MCP servers, Agent Skills and the macOS pack in one place.', '/macos/', 'Hub', 'mac macos apple osx hub']);
rows.push(['h', 'All Categories A–Z', 'Every directory and Agent Skills category on one page.', '/directory/all-categories/', 'Index', 'a-z az categories index list all']);
for (const p of PRODUCTS) rows.push(['p', p.title, cut(p.summary), `/marketplace/${p.slug}/`, p.price, 'pack marketplace buy ' + p.type]);
for (const u of USECASES) rows.push(['u', u.name, cut(u.goal), `/use-cases/${u.slug}/`, 'Use Case', 'use case job']);
for (const t of TEMPLATES) rows.push(['t', t.name, cut(t.role), `/agent-templates/${t.slug}/`, 'Agent Template', 'template agent persona']);
for (const s of SKILLS) rows.push(['s', s.title, cut(s.summary), skillPath(s), s.category, ((s as any).os || []).join(' ').toLowerCase() + ' skill']);
for (const e of ALL) rows.push(['e', e.name, cut(e.description), `/directory/${e.category}/${e.slug}/`, catName(e.category), (ALIAS[e.category] || '')]);
export const GET = () => new Response(JSON.stringify(rows), { headers: { 'content-type': 'application/json; charset=utf-8' } });
