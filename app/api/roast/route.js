import { NextResponse } from 'next/server';
import { buildCategories } from '@/lib/scoring';
import { writeVerdict } from '@/lib/verdict';
import { db, newId, hashIp, clientIp } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ROASTS_PER_HOUR = 10;

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');
const issueList = (v) =>
  (Array.isArray(v) ? v : []).slice(0, 6).map((i) => ({ id: str(i?.id, 80), title: str(i?.title, 140), value: str(i?.value, 60) }));
const shot = (v) =>
  typeof v === 'string' && /^data:image\/(jpeg|webp|png);base64,[A-Za-z0-9+/=]+$/.test(v) && v.length < 350_000 ? v : null;

// Only keep the fields we use, in the shapes we expect.
function cleanPsi(p) {
  if (!p || typeof p !== 'object') return null;
  const s = p.scores || {};
  const m = p.metrics || {};
  const i = p.issues || {};
  const pct = (v) => (num(v) == null ? null : Math.max(0, Math.min(100, Math.round(v))));
  return {
    finalUrl: str(p.finalUrl, 500),
    scores: { performance: pct(s.performance), accessibility: pct(s.accessibility), bestPractices: pct(s.bestPractices), seo: pct(s.seo) },
    metrics: { lcpMs: num(m.lcpMs), fcpMs: num(m.fcpMs), tbtMs: num(m.tbtMs), speedIndexMs: num(m.speedIndexMs), totalBytes: num(m.totalBytes) },
    viewportOk: p.viewportOk === true,
    issues: {
      performance: issueList(i.performance),
      accessibility: issueList(i.accessibility),
      bestPractices: issueList(i.bestPractices),
      seo: issueList(i.seo),
    },
    screenshot: shot(p.screenshot),
  };
}

function cleanChecks(c) {
  if (!c || c.ok !== true || typeof c.score !== 'number') return null;
  const f = c.facts || {};
  const bool = (v) => v === true;
  return {
    score: Math.max(0, Math.min(100, Math.round(c.score))),
    items: (Array.isArray(c.items) ? c.items : []).slice(0, 12).map((i) => ({ key: str(i?.key, 30), label: str(i?.label, 120), pass: bool(i?.pass) })),
    facts: {
      https: bool(f.https), title: str(f.title, 120), description: str(f.description, 200), h1: str(f.h1, 150),
      hasPhone: bool(f.hasPhone), hasEmail: bool(f.hasEmail), hasWhatsApp: bool(f.hasWhatsApp), hasForm: bool(f.hasForm),
      hasContactPage: bool(f.hasContactPage), socials: num(f.socials) || 0,
    },
  };
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  }

  const mobile = cleanPsi(body?.mobile);
  const desktop = cleanPsi(body?.desktop);
  const checks = cleanChecks(body?.checks);
  if (!mobile || mobile.scores.performance == null) {
    return NextResponse.json({ error: 'missing-results' }, { status: 400 });
  }

  let url;
  try {
    url = new URL(mobile.finalUrl || body?.url);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
  } catch {
    return NextResponse.json({ error: 'bad-url' }, { status: 400 });
  }

  const ipHash = hashIp(clientIp(request));
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await db().from('roasts').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', since);
  if ((count || 0) >= ROASTS_PER_HOUR) {
    return NextResponse.json({ error: 'rate-limited' }, { status: 429 });
  }

  const host = url.hostname.replace(/^www\./, '');
  const { score, categories } = buildCategories({ mobile, checks });
  const verdict = await writeVerdict({ host, mobile, checks, categories, score });

  const id = newId();
  const { error } = await db().from('roasts').insert({
    id,
    url: url.toString(),
    host,
    score,
    categories,
    headline: verdict.headline,
    fixes: verdict.fixes,
    verdict_source: verdict.source,
    metrics: { mobile: mobile.metrics, desktop: desktop?.metrics || null, scores: mobile.scores },
    shot_mobile: mobile.screenshot,
    shot_desktop: desktop?.screenshot || null,
    ip_hash: ipHash,
  });
  if (error) {
    console.error('Saving roast failed:', error.message);
    return NextResponse.json({ error: 'save-failed' }, { status: 500 });
  }

  return NextResponse.json({ id });
}
