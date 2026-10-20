// Flip to true to show live Buy buttons. ALSO re-activate the Stripe payment links first
// (otherwise the buy page says the link is inactive). Then: npm run build && wrangler pages deploy.
export const LAUNCH = true;
export const BUY_URLS: Record<string,string> = {
  "web-research-skill-pack": "https://buy.stripe.com/4gMbIUgQhc4Rg9t6rZdIA0m",
  "lead-research-workflow": "https://buy.stripe.com/00w8wI1Vn8SF9L517FdIA0n",
  "customer-support-prompt-pack": "https://buy.stripe.com/3cI7sE57z5Gt3mH3fNdIA0o",
  "content-repurposing-workflow": "https://buy.stripe.com/dRm5kwfMd8SF0av7w3dIA0p",
  "mcp-server-starter-kit": "https://buy.stripe.com/8x29AM0Rj0m9f5pcQndIA0q",
  "agent-eval-guardrails-pack": "https://buy.stripe.com/dRmdR27fHgl7f5p5nVdIA0r",
  "agent-templates-pack": "https://buy.stripe.com/00waEQeI96Kx3mHaIfdIA0s",
  "workflow-reliability-pack": "https://buy.stripe.com/6oUfZa0Rj1qd1ezdUrdIA0w",
  "coding-agent-skills-pack": "https://buy.stripe.com/9B6bIU8jL0m9f5pg2zdIA0x",
  "project-memory-kit": "https://buy.stripe.com/bJebIUfMdb0NaP95nVdIA0y",
  "ai-sdr-outbound-workflow": "https://buy.stripe.com/6oU5kw8jL1qd9L54jRdIA0z",
  "ai-receptionist-kit": "https://buy.stripe.com/14AbIUgQhd8Vf5pg2zdIA0A",
  "macos-app-dev-skills-pack": "https://buy.stripe.com/5kQ6oA1Vn6Kx8H1g2zdIA0B",
  "all-products-bundle": "https://buy.stripe.com/bJe8wIeI9ecZ3mHdUrdIA0t",
  "agent-builder-bundle": "https://buy.stripe.com/9B6eV643vd8V3mHbMjdIA0u",
  "growth-bundle": "https://buy.stripe.com/bJe3coeI9b0N7CX7w3dIA0v"
};

// Sponsorship Payment Links (Oct 2026): monthly subscription (primary) and one-time 30 days (secondary).
export const SPONSOR_BUY: Record<string,{monthly:string;once:string}> = {
 "featured-listing": {
  "monthly": "https://buy.stripe.com/28EeV6dE50m92iDbMjdIA0C",
  "once": "https://buy.stripe.com/3cI7sEbvX0m96yT17FdIA0D"
 },
 "category-sponsor": {
  "monthly": "https://buy.stripe.com/eVq8wI8jL1qdf5p6rZdIA0E",
  "once": "https://buy.stripe.com/cNi28kfMd3yle1lg2zdIA0F"
 },
 "sitewide-sponsor": {
  "monthly": "https://buy.stripe.com/fZu28kdE5gl7g9t3fNdIA0G",
  "once": "https://buy.stripe.com/4gMfZa0Rjfh36yT4jRdIA0H"
 }
};
export const BILLING_PORTAL = "https://billing.stripe.com/p/login/3cI6oAarT7OBf5p2bJdIA00";
