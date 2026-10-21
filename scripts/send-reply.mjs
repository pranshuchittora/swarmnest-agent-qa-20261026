#!/usr/bin/env node
// Send an approved, threaded email reply via Resend (from hello@ or support@swarmnest.ai).
// Usage: RESEND_API_KEY=... node scripts/send-reply.mjs <payload.json> [--dry-run]
// Payload: { approved, from, to[], subject, text, inReplyTo, references, bcc[], cc[], replyTo }
// Not part of the deployed site. Never prints the API key.
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const file = args.find((a) => !a.startsWith('--'));
if (!file) { console.error('Usage: node scripts/send-reply.mjs <payload.json> [--dry-run]'); process.exit(2); }

let job;
try { job = JSON.parse(readFileSync(file, 'utf8')); }
catch (e) { console.error('Cannot read JSON: ' + e.message); process.exit(2); }

const ALLOWED_FROM = /<(hello|support)@swarmnest\.ai>$|^(hello|support)@swarmnest\.ai$/i;
const errs = [];
if (!job.from || !ALLOWED_FROM.test(job.from.trim())) errs.push('from must be hello@ or support@swarmnest.ai');
const to = Array.isArray(job.to) ? job.to : job.to ? [job.to] : [];
if (!to.length) errs.push('to is required');
if (!job.subject) errs.push('subject is required');
if (!job.text) errs.push('text is required');
const angle = (v) => (v ? String(v).trim() : '');
const inReplyTo = angle(job.inReplyTo);
const references = angle(job.references) || inReplyTo;
if (inReplyTo && !/^<[^<>\s]+>$/.test(inReplyTo)) errs.push('inReplyTo must look like <id@host>');
if (errs.length) { console.error('Invalid payload:\n- ' + errs.join('\n- ')); process.exit(2); }

const payload = { from: job.from, to, subject: job.subject, text: job.text };
if (job.html) payload.html = job.html;
if (job.cc?.length) payload.cc = job.cc;
if (job.bcc?.length) payload.bcc = job.bcc;
if (job.replyTo) payload.reply_to = job.replyTo;
const headers = {};
if (inReplyTo) headers['In-Reply-To'] = inReplyTo;
if (references) headers['References'] = references;
if (Object.keys(headers).length) payload.headers = headers;

if (dryRun) {
  console.log('DRY RUN (nothing sent). approved=' + (job.approved === true));
  console.log('POST https://api.resend.com/emails');
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

if (job.approved !== true) { console.error('Refusing to send: payload does not contain "approved": true'); process.exit(3); }
const key = process.env.RESEND_API_KEY;
if (!key) { console.error('RESEND_API_KEY is not set'); process.exit(2); }

const idem = 'reply-' + Buffer.from(to.join(',') + '|' + job.subject + '|' + inReplyTo).toString('base64url').slice(0, 200);
const r = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + key, 'content-type': 'application/json', 'Idempotency-Key': idem },
  body: JSON.stringify(payload),
});
const body = await r.text();
if (!r.ok) { console.error('Resend error ' + r.status + ': ' + body.replaceAll(key, '[redacted]')); process.exit(1); }
let id; try { id = JSON.parse(body).id; } catch {}
console.log('Sent. Resend email id: ' + (id || body));
