import { verifyStripeSignature, grantForSession } from '../_lib/fulfil.js';
import { sendDeliveryEmail } from '../_lib/email.js';
export async function onRequestPost({ request, env }) {
  const body = await request.text();
  if (!(await verifyStripeSignature(body, request.headers.get('stripe-signature'), env.STRIPE_WEBHOOK_SECRET)))
    return new Response('bad signature', { status: 400 });
  const ev = JSON.parse(body);
  if (ev.type === 'checkout.session.completed' || ev.type === 'checkout.session.async_payment_succeeded') {
    const id = ev.data.object.id;
    // One order per checkout session (covers retries and completed + async_payment_succeeded for the same session): one read, two writes.
    if (!(await env.SIGNUPS.get('order:' + id))) {
      const g = await grantForSession(env, id);
      const email = ev.data.object.customer_details?.email || null;
      const mail = g ? await sendDeliveryEmail(env, { to: email, slug: g.slug, token: g.token, sessionId: id }) : { skipped: true, reason: 'no-grant' };
      await env.SIGNUPS.put('order:' + id, JSON.stringify({ at: new Date().toISOString(), email, slug: g?.slug || null, emailed: !!mail.sent }), { expirationTtl: 60 * 60 * 24 * 400 });
    }
  }
  return new Response('ok');
}
