import { verifyStripeSignature, grantForSession } from '../_lib/fulfil.js';
export async function onRequestPost({ request, env }) {
  const body = await request.text();
  if (!(await verifyStripeSignature(body, request.headers.get('stripe-signature'), env.STRIPE_WEBHOOK_SECRET)))
    return new Response('bad signature', { status: 400 });
  const ev = JSON.parse(body);
  if (ev.type === 'checkout.session.completed' || ev.type === 'checkout.session.async_payment_succeeded') {
    const id = ev.data.object.id;
    const seen = 'evt:' + ev.id;
    if (!(await env.SIGNUPS.get(seen))) {
      const g = await grantForSession(env, id);
      await env.SIGNUPS.put('order:' + id, JSON.stringify({ at: new Date().toISOString(), email: ev.data.object.customer_details?.email || null, slug: g?.slug || null }), { expirationTtl: 60 * 60 * 24 * 400 });
      await env.SIGNUPS.put(seen, '1', { expirationTtl: 60 * 60 * 24 * 7 });
      // No email sender available yet: buyer gets the link on the thank-you page.
    }
  }
  return new Response('ok');
}
