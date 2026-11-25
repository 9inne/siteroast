import { NextResponse } from 'next/server';
import { db, newId, hashIp, clientIp, getRoasts, isValidId } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COMPARISONS_PER_HOUR = 10;

// POST { youId, rivalIds: [up to 3] } → saves a Head to Head and returns its id.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  }

  const youId = body?.youId;
  const rivalIds = [...new Set((Array.isArray(body?.rivalIds) ? body.rivalIds : []).filter(isValidId))].filter((id) => id !== youId).slice(0, 3);
  if (!isValidId(youId) || !rivalIds.length) return NextResponse.json({ error: 'bad-request' }, { status: 400 });

  const found = await getRoasts([youId, ...rivalIds]);
  if (found.length !== rivalIds.length + 1) return NextResponse.json({ error: 'not-found' }, { status: 404 });

  const ipHash = hashIp(clientIp(request));
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await db().from('comparisons').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', since);
  if ((count || 0) >= COMPARISONS_PER_HOUR) return NextResponse.json({ error: 'rate-limited' }, { status: 429 });

  const id = newId();
  const { error } = await db().from('comparisons').insert({ id, you_id: youId, rival_ids: rivalIds, ip_hash: ipHash });
  if (error) {
    console.error('Saving comparison failed:', error.message);
    return NextResponse.json({ error: 'save-failed' }, { status: 500 });
  }
  return NextResponse.json({ id });
}
