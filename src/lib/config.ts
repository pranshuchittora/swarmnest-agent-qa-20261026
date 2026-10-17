// Flip to true to show live Buy buttons. ALSO re-activate the Stripe payment links first
// (otherwise the buy page says the link is inactive). Then: npm run build && wrangler pages deploy.
export const LAUNCH = false;
export const BUY_URLS: Record<string,string> = {
  "web-research-skill-pack": "https://buy.stripe.com/3cI6oAarT7OBf5p2bJdIA00",
  "lead-research-workflow": "https://buy.stripe.com/5kQ7sE57zfh35uP2bJdIA01",
  "customer-support-prompt-pack": "https://buy.stripe.com/00wdR2eI9b0Ne1l8A7dIA02",
  "content-repurposing-workflow": "https://buy.stripe.com/3cIdR2eI9fh35uP7w3dIA03",
  "mcp-server-starter-kit": "https://buy.stripe.com/4gMdR2gQh4Cpg9t8A7dIA04",
  "agent-eval-guardrails-pack": "https://buy.stripe.com/3cI9AMdE5ecZ5uP3fNdIA05",
  "agent-templates-bundle": "https://buy.stripe.com/bJe3coarTgl76yTeYvdIA06"
};
