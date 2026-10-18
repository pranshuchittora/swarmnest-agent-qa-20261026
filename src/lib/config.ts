// Flip to true to show live Buy buttons. ALSO re-activate the Stripe payment links first
// (otherwise the buy page says the link is inactive). Then: npm run build && wrangler pages deploy.
export const LAUNCH = false;
export const BUY_URLS: Record<string,string> = {
  "web-research-skill-pack": "https://buy.stripe.com/28EbIU1Vn6Kx1ezbMjdIA07",
  "lead-research-workflow": "https://buy.stripe.com/5kQ7sE57zfh35uP2bJdIA01",
  "customer-support-prompt-pack": "https://buy.stripe.com/28E4gsbvX1qd0avbMjdIA08",
  "content-repurposing-workflow": "https://buy.stripe.com/3cIdR2eI9fh35uP7w3dIA03",
  "mcp-server-starter-kit": "https://buy.stripe.com/8x2aEQgQhecZf5p2bJdIA09",
  "agent-eval-guardrails-pack": "https://buy.stripe.com/3cI9AMdE5ecZ5uP3fNdIA05",
  "agent-templates-pack": "https://buy.stripe.com/7sY28k43v8SFcXh9EbdIA0a",
  "workflow-reliability-pack": "https://buy.stripe.com/5kQ6oA1Vn7OBg9t2bJdIA0e",
  "coding-agent-skills-pack": "https://buy.stripe.com/9B6bIU1Vnd8Ve1l3fNdIA0f",
  "project-memory-kit": "https://buy.stripe.com/28EfZa9nPd8VaP9cQndIA0g",
  "ai-sdr-outbound-workflow": "https://buy.stripe.com/bJe4gs8jLecZcXh9EbdIA0h",
  "ai-receptionist-kit": "https://buy.stripe.com/5kQ6oAfMd9WJaP9bMjdIA0i",
  "all-products-bundle": "https://buy.stripe.com/aFabIU1Vn5Gtf5p03BdIA0b",
  "agent-builder-bundle": "https://buy.stripe.com/eVqbIU1Vn2uh1ezcQndIA0c",
  "growth-bundle": "https://buy.stripe.com/00wdR2eI9b0N5uP6rZdIA0j"
};
