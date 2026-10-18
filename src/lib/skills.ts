import skillsRaw from '../../data/skills.json';
import { SITE } from './data';
export { SITE };
export type Skill = (typeof skillsRaw)[number] & { has_scripts: boolean | null };
export const SKILLS: Skill[] = (skillsRaw as Skill[]).slice().sort((a,b)=>a.title.localeCompare(b.title));
export const slugify = (s: string) => s.toLowerCase().replace(/&/g,' and ').replace(/\./g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const SECTION = '/agent-skills/';
export const FORMATS = [
 { slug:'skill-md', key:'agent-skill', name:'Agent Skills (SKILL.md Format)', short:'SKILL.md Skills', blurb:'Folders with a SKILL.md file in the open Agent Skills format. Supported by Claude, Codex, Cursor, Gemini CLI, GitHub Copilot and many more tools.', portable:'Portable across tools that read the open format. Skills that include scripts also need a runtime the platform may not offer.' },
 { slug:'plugin-bundles', key:'plugin', name:'Plugin Bundles', short:'Plugin Bundles', blurb:'Packages that bundle skills with commands, subagents, hooks and MCP server settings, installed as one unit.', portable:'Tied to one platform. Claude Code plugins and OpenAI plugins use different manifests.' },
 { slug:'cursor-rules', key:'cursor-rule', name:'Cursor Rules', short:'Cursor Rules', blurb:'Always-on guidance files (.mdc) that tell Cursor how to write code in your project.', portable:'Cursor only. Other tools ignore .cursor/rules files.' },
 { slug:'agents-md-templates', key:'agents-md', name:'AGENTS.md Templates', short:'AGENTS.md Templates', blurb:'Real-world AGENTS.md files from public projects, to copy and adapt as the always-on briefing for coding agents in your repo.', portable:'Read by Codex, Cursor, GitHub Copilot, Gemini CLI, OpenCode and others. Claude Code reads CLAUDE.md, so import or link it there.' },
 { slug:'prompt-packs', key:'prompt-pack', name:'Prompt Packs', short:'Prompt Packs', blurb:'Collections of plain-text prompts that work with any chat model. They can be wrapped as a SKILL.md to become portable skills.', portable:'Work with any model, but have no structure or auto-loading.' },
 { slug:'legacy-gpts-and-gems', key:'legacy-gpt', name:'Legacy GPTs and Gems', short:'Legacy GPTs and Gems', blurb:'Custom GPTs and Gemini Gems are being retired in favor of skills and plugins. We do not list them as installable items; use our migration guides instead.', portable:'Locked to one platform and retiring.' }
];
export const fmtByKey = (k: string) => FORMATS.find(f=>f.key===k)!;
export const fmtBySlug = (s: string) => FORMATS.find(f=>f.slug===s)!;
export const PLATFORMS = [
 { slug:'claude-code', name:'Claude Code', group:'Claude' }, { slug:'claude-apps', name:'Claude Apps', group:'Claude' }, { slug:'claude-api', name:'Claude API', group:'Claude' },
 { slug:'chatgpt', name:'ChatGPT', group:'OpenAI' }, { slug:'codex', name:'Codex', group:'OpenAI' },
 { slug:'gemini-cli', name:'Gemini CLI', group:'Google' }, { slug:'antigravity', name:'Antigravity', group:'Google' },
 { slug:'cursor', name:'Cursor', group:'Editors' }, { slug:'github-copilot', name:'GitHub Copilot', group:'Editors' }, { slug:'kiro', name:'Kiro', group:'Editors' }, { slug:'opencode', name:'OpenCode', group:'Editors' }, { slug:'openclaw', name:'OpenClaw', group:'Editors' },
 { slug:'any-skills-client', name:'Any Agent Skills Client', group:'Catch-All' }, { slug:'any-model', name:'Any Chat Model', group:'Catch-All' }
];
export const platName = (s: string) => PLATFORMS.find(p=>p.slug===s)?.name || s;
export const CATEGORIES = [...new Set(SKILLS.map(s=>s.category))].sort((a,b)=>a.localeCompare(b)).map(n=>({ name:n, slug:slugify(n), count:SKILLS.filter(s=>s.category===n).length }));
export const catSlug = (n: string) => slugify(n);
export const platformsUsed = PLATFORMS.filter(p=>SKILLS.some(s=>s.platforms_declared.includes(p.slug)));
export const scriptsLabel = (s: Skill) => s.has_scripts===true ? 'Includes Scripts' : s.has_scripts===false ? 'Instructions Only' : 'Scripts Unknown';
export const labelsOf = (s: Skill) => { const l = [scriptsLabel(s)]; if (s.uses_network) l.push('Uses Network'); if (s.needs_credentials) l.push('Needs Credentials'); if ((s.safety_labels||[]).includes('Uses Hooks')) l.push('Uses Hooks'); l.push(s.review_status); return l; };
export const skillPath = (s: Skill) => `${SECTION}${s.slug}/`;
export const compact = (s: Skill) => ({ slug:s.slug, title:s.title, summary:s.summary, category:s.category, category_slug:slugify(s.category), format:fmtByKey(s.format).slug, platforms:s.platforms_declared, has_scripts:s.has_scripts, uses_network:s.uses_network, needs_credentials:s.needs_credentials, license:s.license, review_status:s.review_status, author:s.author, source_url:s.source_url, url:SITE+skillPath(s) });
export const GUIDES = [
 { slug:'migrate-a-custom-gpt-to-a-skill', title:'Migrate a Custom GPT to a Skill', blurb:'Custom GPTs retire on Dec 11, 2026. Here is what moves, what does not, and how to rebuild yours as a skill or plugin.', updated:'2026-10-18' }
];
