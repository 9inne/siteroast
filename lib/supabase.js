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

const REPORT_COLUMNS = 'id, url, host, score, categories, headline, fixes, has_mobile_shot, has_desktop_shot, created_at';

export async function getRoast(id) {
  if (!isValidId(id)) return null;
  const { data, error } = await db().from('roasts').select(REPORT_COLUMNS).eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

// "Better than X% of sites we've roasted" — only once there's enough data to mean something.
export async function percentileFor(score) {
  const { count: total } = await db().from('roasts').select('id', { count: 'exact', head: true });
  if (!total || total < 25) return null;
  const { count: below } = await db().from('roasts').select('id', { count: 'exact', head: true }).lt('score', score);
  return Math.round(((below || 0) / total) * 100);
}
