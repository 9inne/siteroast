import 'server-only';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

// Server-only Supabase client. Uses the secret key, so it must never be
// imported into a browser component. Row Level Security is on for every
// table with no public policies: only this server can read or write.

let client;
export function db() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY');
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

const ALPHABET = '23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
export function newId(length = 8) {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export function hashIp(ip) {
  return crypto
    .createHash('sha256')
    .update(`${ip}|${process.env.IP_SALT || 'siteroast'}`)
    .digest('hex')
    .slice(0, 32);
}

export function clientIp(request) {
  return (
    request.headers.get('x-nf-client-connection-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  );
}

export const isValidId = (id) => /^[2-9a-zA-Z]{8}$/.test(String(id || ''));

const REPORT_COLUMNS = 'id, url, host, kind, score, categories, headline, fixes, metrics, has_mobile_shot, has_desktop_shot, created_at';

export async function getRoast(id) {
  if (!isValidId(id)) return null;
  const { data, error } = await db().from('roasts').select(REPORT_COLUMNS).eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

// Several reviews at once, returned in the order of the ids given.
export async function getRoasts(ids) {
  const valid = ids.filter(isValidId);
  if (!valid.length) return [];
  const { data, error } = await db().from('roasts').select(REPORT_COLUMNS).in('id', valid);
  if (error) throw error;
  return valid.map((id) => data.find((r) => r.id === id)).filter(Boolean);
}

// The review of the same site just before this one (for "before and after").
export async function previousRoast(host, before) {
  const { data, error } = await db()
    .from('roasts')
    .select('id, score, created_at, has_mobile_shot')
    .eq('host', host)
    .lt('created_at', before)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// A newer review of the same site, if one exists.
export async function newerRoast(host, after) {
  const { data, error } = await db()
    .from('roasts')
    .select('id, score, created_at')
    .eq('host', host)
    .gt('created_at', after)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

const COMPARISON_COLUMNS = 'id, you_id, rival_ids, created_at';

export async function getComparison(id) {
  if (!isValidId(id)) return null;
  const { data, error } = await db().from('comparisons').select(COMPARISON_COLUMNS).eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

// "Better than X% of sites we've roasted" — only once there's enough data to mean something.
export async function percentileFor(score) {
  const { count: total } = await db().from('roasts').select('id', { count: 'exact', head: true }).eq('kind', 'main');
  if (!total || total < 25) return null;
  const { count: below } = await db().from('roasts').select('id', { count: 'exact', head: true }).eq('kind', 'main').lt('score', score);
  return Math.round(((below || 0) / total) * 100);
}
