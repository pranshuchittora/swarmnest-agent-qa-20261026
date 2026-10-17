export const PRICE_TO_SLUG = {
 "price_1UQiit6aC1E09RZYMYrWB82m": "web-research-skill-pack",
 "price_1UQiiu6aC1E09RZYeRUgmMIk": "lead-research-workflow",
 "price_1UQiiv6aC1E09RZYXejhssVQ": "customer-support-prompt-pack",
 "price_1UQiiw6aC1E09RZY9mPSHrqo": "content-repurposing-workflow",
 "price_1UQiix6aC1E09RZYuCUJk2Mt": "mcp-server-starter-kit",
 "price_1UQiiy6aC1E09RZYupaHKFmA": "agent-eval-guardrails-pack",
 "price_1UQiiz6aC1E09RZY6BordMgo": "agent-templates-bundle"
};
export const FILE_VERSION = 'v1.0';
export const PRODUCT_TITLES = {
 "web-research-skill-pack": "Web Research Skill Pack",
 "lead-research-workflow": "Lead Research Workflow",
 "customer-support-prompt-pack": "Customer Support Prompt Pack",
 "content-repurposing-workflow": "Content Repurposing Workflow",
 "mcp-server-starter-kit": "MCP Server Starter Kit",
 "agent-eval-guardrails-pack": "Agent Eval & Guardrails Pack",
 "agent-templates-bundle": "Agent Templates Bundle"
};
// Slugs renamed after launch; tokens issued before the rename still resolve.
export const LEGACY_SLUGS = { "persona-bundle": "agent-templates-bundle" };
export const canonicalSlug = (s) => LEGACY_SLUGS[s] || s;
