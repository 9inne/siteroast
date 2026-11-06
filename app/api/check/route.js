import { NextResponse } from 'next/server';
import { fetchPage, FetchError } from '@/lib/safe-fetch';
import { analyzeHtml } from '@/lib/html-checks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST { url } → contact & trust checks for that page.
// If the site blocks us, we answer ok:false and the report marks that
// category as "couldn't check" instead of failing the whole roast.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad-request' }, { status: 400 });
  }

  try {
    const { finalUrl, html } = await fetchPage(body?.url);
    return NextResponse.json({ ok: true, finalUrl, ...analyzeHtml(html, finalUrl) });
  } catch (err) {
    const reason = err instanceof FetchError ? err.message : 'unreachable';
    const status = ['empty', 'invalid'].includes(reason) ? 400 : 200;
    return NextResponse.json({ ok: false, error: reason }, { status });
  }
}
