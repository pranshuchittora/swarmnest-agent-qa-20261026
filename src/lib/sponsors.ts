import raw from '../../data/sponsors.json';
import { PRODUCTS } from './content';
export type Sponsor = { name: string; headline: string; text: string; url: string; logo?: string; banner?: string; start?: string; end?: string; order?: string };
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
// Matched against whole slug words (split on / and -), so 'mac' never matches 'machine' and 'code' never matches 'no-code'.
const W = (t: string) => new RegExp(`(?:^|[/-])(?:${t})(?=$|-)`);
const FIT: [RegExp, string][] = [
  [W('no-code'), 'workflow-reliability-pack'],
  [W('mac|macos|apple|swift|swiftui|xcode|ios|homebrew|app-store'), 'macos-app-dev-skills-pack'],
  [W('mcp|cloudflare|cloud-deployment|serverless|azure|agent-protocols|agent-standards'), 'mcp-server-starter-kit'],
  [W('agents-md|agentsmd|documentation|planning|product-management'), 'project-memory-kit'],
  [W('agent-frameworks|visual-agent-builders|agent-workflow|skill-authoring|plugin-bundles|prompt|prompt-packs|prompt-libraries|prompt-management'), 'agent-templates-pack'],
  [W('evals?|guardrails|observability|safety|benchmarks'), 'agent-eval-guardrails-pack'],
  [W('coding|code|debugging|git|linux|testing|review|software|developer|ci-cd|cursor|frontend|security|database'), 'coding-agent-skills-pack'],
  [W('search|scraping|scrapers|crawl|research|academic|extraction'), 'web-research-skill-pack'],
  [W('workflow|automation|n8n|orchestration'), 'workflow-reliability-pack'],
  [W('lead|crm'), 'lead-research-workflow'],
  [W('support|helpdesk|live-chat'), 'customer-support-prompt-pack'],
  [W('email'), 'ai-sdr-outbound-workflow'],
  [W('content|writing|marketing|social|newsletters'), 'content-repurposing-workflow'],
  [W('voice|sms|speech'), 'ai-receptionist-kit'],
];
export function houseFor(key: string) {
  const fit = FIT.find(([re]) => re.test(key))?.[1];
  const pick = (slug: string) => PRODUCTS.find((x) => x.slug === slug);
  // Homepage: everything in one bundle. Other pages with no close match: the Agent Builder Bundle.
  return (fit && pick(fit)) || (!key ? pick('all-products-bundle') : pick('agent-builder-bundle')) || PRODUCTS[0];
}
export const SPONSOR_ACTIVE_COUNT = [R.sitewide, ...Object.values(R.categories || {}), ...Object.values(R.featured || {}).flat()].filter(live).length;
