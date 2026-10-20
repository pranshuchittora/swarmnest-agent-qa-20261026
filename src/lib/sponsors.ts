import raw from '../../data/sponsors.json';
import { PRODUCTS } from './content';
export type Sponsor = { name: string; headline: string; text: string; url: string; start?: string; end?: string; order?: string };
const today = new Date().toISOString().slice(0, 10);
const live = (s: Sponsor | null | undefined): s is Sponsor => !!s && !!s.url && /^https?:\/\//.test(s.url) && (!s.start || s.start <= today) && (!s.end || today <= s.end);
const R = raw as unknown as { sitewide: Sponsor | null; categories: Record<string, Sponsor>; featured: Record<string, Sponsor | Sponsor[]> };
const first = (v: Sponsor | Sponsor[] | undefined) => (Array.isArray(v) ? v.find(live) : live(v) ? v : undefined);
// key: '' for the homepage, 'directory/<slug>' or 'agent-skills/<slug>' for category pages
export function sponsorFor(key: string): { kind: 'sitewide' | 'category' | 'featured'; s: Sponsor } | null {
  if (!key) return live(R.sitewide) ? { kind: 'sitewide', s: R.sitewide } : null;
  if (live(R.categories?.[key])) return { kind: 'category', s: R.categories[key] };
  const f = first(R.featured?.[key]); return f ? { kind: 'featured', s: f } : null;
}
// House card: one of our own packs, picked to fit the page where we can, otherwise stable by page key.
const FIT: [RegExp, string][] = [[/mac|apple|swift|ios|app-store|homebrew/, 'macos-app-dev-skills-pack'], [/coding|code|devops|git|test/, 'coding-agent-skills-pack'], [/mcp/, 'mcp-server-starter-kit'], [/search|scrap|crawl|research/, 'web-research-skill-pack'], [/workflow|automation|n8n/, 'workflow-reliability-pack'], [/support|crm|sales|email/, 'customer-support-prompt-pack'], [/eval|guardrail|observab|safety/, 'agent-eval-guardrails-pack']];
export function houseFor(key: string) {
  const singles = PRODUCTS.filter((p) => !p.bundle);
  const fit = FIT.find(([re]) => re.test(key))?.[1];
  if (fit) { const p = singles.find((x) => x.slug === fit); if (p) return p; }
  if (!key) return PRODUCTS.find((p) => p.slug === 'all-products-bundle') || singles[0];
  let h = 0; for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return singles[h % singles.length];
}
export const SPONSOR_ACTIVE_COUNT = [R.sitewide, ...Object.values(R.categories || {}), ...Object.values(R.featured || {}).flat()].filter(live).length;
