import { NextResponse } from 'next/server';
import { db, getRoast, isValidId, hashIp, clientIp } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { BUDGETS } from '@/lib/constants';
const LEADS_PER_HOUR = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const str = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Emails you about a new lead through Brevo, if BREVO_API_KEY and
// LEAD_NOTIFY_EMAIL are set. The lead is saved either way.
async function notify(lead, roast) {
  const key = process.env.BREVO_API_KEY;
  const to = process.env.LEAD_NOTIFY_EMAIL;
  if (!key || !to) return;
  const site = process.env.NEXT_PUBLIC_SITE_URL || '';
  const html = `
    <h2>New SiteRoast quote request</h2>
    <p><b>${esc(lead.name)}</b> — ${esc(lead.email)}${lead.phone ? ` — ${esc(lead.phone)}` : ''}</p>
    <p>Website: ${esc(roast.url)} (score ${roast.score}/100)</p>
    <p>Budget: ${esc(lead.budget || 'not given')}</p>
    <p>Wants fixed:</p><ul>${lead.fixes.map((f) => `<li>${esc(f)}</li>`).join('') || '<li>Not specified</li>'}</ul>
    <p><a href="${esc(site)}/r/${roast.id}">Open their report</a></p>`;
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': key, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: 'SiteRoast', email: process.env.LEAD_SENDER_EMAIL || to },
        to: [{ email: to }],
        replyTo: { email: lead.email, name: lead.name },
        subject: `New quote request: ${roast.host} (${roast.score}/100)`,
        htmlContent: html,
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.error('Lead email failed:', err?.message);
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  }

  const roastId = str(body?.roastId, 8);
  const name = str(body?.name, 100);
  const email = str(body?.email, 200).toLowerCase();
  const phone = str(body?.phone, 40);
  const budget = BUDGETS.includes(body?.budget) ? body.budget : null;

  if (!isValidId(roastId)) return NextResponse.json({ error: 'bad-report' }, { status: 400 });
  if (!name) return NextResponse.json({ error: 'name' }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'email' }, { status: 400 });

  const roast = await getRoast(roastId);
  if (!roast) return NextResponse.json({ error: 'bad-report' }, { status: 404 });

  // Only accept fix titles that are actually on this report.
  const allowed = new Set((roast.fixes || []).map((f) => f.title));
  const fixes = (Array.isArray(body?.fixes) ? body.fixes : []).filter((f) => allowed.has(f)).slice(0, 3);

  const ipHash = hashIp(clientIp(request));
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await db().from('leads').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', since);
  if ((count || 0) >= LEADS_PER_HOUR) return NextResponse.json({ error: 'rate-limited' }, { status: 429 });

  const lead = { roast_id: roastId, name, email, phone: phone || null, fixes, budget, ip_hash: ipHash };
  const { error } = await db().from('leads').insert(lead);
  if (error) {
    console.error('Saving lead failed:', error.message);
    return NextResponse.json({ error: 'save-failed' }, { status: 500 });
  }

  await notify({ ...lead, fixes }, roast);
  return NextResponse.json({ ok: true });
}
