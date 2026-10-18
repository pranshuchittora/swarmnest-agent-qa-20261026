import entries from '../../data/entries.json';
import categories from '../../data/categories.json';
import groupsRaw from '../../data/groups.json';
export type Entry = (typeof entries)[number];
export const SITE = 'https://swarmnest.ai';
export const ALL: Entry[] = entries as Entry[];
export const CATS = categories;
export const catName = (slug: string) => CATS.find(c => c.slug === slug)!.name;
export const byCat = (slug: string) => ALL.filter(e => e.category === slug);
export const authLabel: Record<string,string> = { none: 'No auth', key: 'API key', oauth: 'OAuth', unknown: 'See docs' };
export const priceLabel: Record<string,string> = { free: 'Free', freemium: 'Free tier', paid: 'Paid', unknown: 'See site' };
export const entryJson = (e: Entry) => ({ ...e, category_name: catName(e.category), swarmnest_url: `${SITE}/directory/${e.category}/${e.slug}/` });
export const BUILD_DATE = '2026-10-18';

const _assigned = new Set(groupsRaw.flatMap(g=>g.cats));
const _more = categories.filter(c=>!_assigned.has(c.slug)).map(c=>c.slug);
export const GROUPS = [...groupsRaw, ...(_more.length?[{slug:'more',name:'More',blurb:'Other categories.',cats:_more}]:[])]
  .map(g=>({...g,cats:g.cats.map(s=>categories.find(c=>c.slug===s)!).filter(Boolean)}));
export const groupOf = (slug: string) => GROUPS.find(g=>g.cats.some(c=>c.slug===slug));
