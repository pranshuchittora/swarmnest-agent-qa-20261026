export const PRICE_TO_SLUG = {
 "price_1US0ke6aC1E09RZYMS75q671": "web-research-skill-pack",
 "price_1UQiiu6aC1E09RZYeRUgmMIk": "lead-research-workflow",
 "price_1US0kf6aC1E09RZYN0cm0lyO": "customer-support-prompt-pack",
 "price_1UQiiw6aC1E09RZY9mPSHrqo": "content-repurposing-workflow",
 "price_1US0kg6aC1E09RZYdU0gGW7z": "mcp-server-starter-kit",
 "price_1UQiiy6aC1E09RZYupaHKFmA": "agent-eval-guardrails-pack",
 "price_1UQiiz6aC1E09RZY6BordMgo": "agent-templates-pack",
 "price_1US1Qk6aC1E09RZY9el16zUf": "workflow-reliability-pack",
 "price_1US1Ql6aC1E09RZYprJbqJiR": "coding-agent-skills-pack",
 "price_1US1Qn6aC1E09RZY2Z1UsY9Y": "project-memory-kit",
 "price_1US1Qo6aC1E09RZYILPvqS1l": "ai-sdr-outbound-workflow",
 "price_1US1Qq6aC1E09RZYJb2wyks9": "ai-receptionist-kit",
 "price_1UST8v6aC1E09RZYqQDh3hbR": "macos-app-dev-skills-pack",
 "price_1US34j6aC1E09RZYxQKbMfrh": "all-products-bundle",
 "price_1US0kh6aC1E09RZY82raKJSK": "agent-builder-bundle",
 "price_1US2YS6aC1E09RZYnE4iyAoC": "growth-bundle"
};
// Archived prices (amount changed before launch); kept so any older checkout session still fulfils the right product.
export const LEGACY_PRICE_TO_SLUG = {
 "price_1US0kh6aC1E09RZYSlBSwq7O": "all-products-bundle",
 "price_1US0ki6aC1E09RZYhRSnVhxk": "growth-bundle",
 "price_1UQiit6aC1E09RZYMYrWB82m": "web-research-skill-pack",
 "price_1UQiiv6aC1E09RZYXejhssVQ": "customer-support-prompt-pack",
 "price_1UQiix6aC1E09RZYuCUJk2Mt": "mcp-server-starter-kit"
};
export const FILE_VERSION = 'v2.0';
export const PRODUCT_TITLES = {
 "web-research-skill-pack": "Web Research Skill Pack",
 "lead-research-workflow": "Lead Research Workflow",
 "customer-support-prompt-pack": "Customer Support Prompt Pack",
 "content-repurposing-workflow": "Content Repurposing Workflow",
 "mcp-server-starter-kit": "MCP Server Starter Kit",
 "agent-eval-guardrails-pack": "Agent Eval & Guardrails Pack",
 "agent-templates-pack": "Agent Templates Pack",
 "workflow-reliability-pack": "Workflow Reliability Pack",
 "coding-agent-skills-pack": "Coding Agent Skills Pack",
 "project-memory-kit": "Project Memory Kit",
 "ai-sdr-outbound-workflow": "AI SDR Outbound Workflow",
 "ai-receptionist-kit": "AI Receptionist Kit",
 "macos-app-dev-skills-pack": "macOS App Development Skills Pack",
 "all-products-bundle": "All Products Bundle",
 "agent-builder-bundle": "Agent Builder Bundle",
 "growth-bundle": "Growth Bundle"
};
// Slugs renamed after launch; tokens issued before the rename still resolve.
export const LEGACY_SLUGS = { "persona-bundle": "agent-templates-pack", "agent-templates-bundle": "agent-templates-pack" };
export const canonicalSlug = (s) => LEGACY_SLUGS[s] || s;
// Bundle zips share their members' files; per-file KV keys are stored once per product and resolved here (saves KV writes).
export const BUNDLE_MEMBERS = {
 "all-products-bundle": ["web-research-skill-pack","lead-research-workflow","customer-support-prompt-pack","content-repurposing-workflow","mcp-server-starter-kit","agent-eval-guardrails-pack","agent-templates-pack","workflow-reliability-pack","coding-agent-skills-pack","project-memory-kit","ai-sdr-outbound-workflow","ai-receptionist-kit"],
 "agent-builder-bundle": ["mcp-server-starter-kit","agent-eval-guardrails-pack","web-research-skill-pack","agent-templates-pack"],
 "growth-bundle": ["lead-research-workflow","content-repurposing-workflow","customer-support-prompt-pack","ai-sdr-outbound-workflow"]
};
