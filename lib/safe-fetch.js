import 'server-only';
import dns from 'node:dns';
import net from 'node:net';
import { Agent, fetch as undiciFetch } from 'undici';

// Fetches a public web page safely on the server.
// Visitors give us any URL, so we must never let it reach private addresses
// (our own server, cloud metadata, internal networks). The check runs inside
// the connection's own DNS lookup, so a site can't swap its address between
// "check" and "connect" (DNS rebinding).

const MAX_BYTES = 2_000_000; // 2 MB of HTML is plenty
const MAX_REDIRECTS = 4;
const TIMEOUT_MS = 8000;

export class FetchError extends Error {}

function isPrivateIPv4(ip) {
  const [a, b] = ip.split('.').map(Number);
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIP(ip) {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  const v6 = ip.toLowerCase();
  if (v6 === '::' || v6 === '::1') return true;
  if (v6.startsWith('::ffff:')) return isPrivateIPv4(v6.slice(7));
  if (/^f[cd]/.test(v6)) return true; // fc00::/7 unique local
  if (/^fe[89ab]/.test(v6)) return true; // fe80::/10 link local
  if (v6.startsWith('ff')) return true; // multicast
  return false;
}

function safeLookup(hostname, options, callback) {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err);
    const list = Array.isArray(addresses) ? addresses : [{ address: addresses, family: options.family }];
    if (!list.length || list.some((a) => isPrivateIP(a.address))) {
      return callback(new FetchError('blocked-address'));
    }
    if (options.all) return callback(null, list);
    return callback(null, list[0].address, list[0].family);
  });
}

const agent = new Agent({ connect: { lookup: safeLookup }, headersTimeout: TIMEOUT_MS, bodyTimeout: TIMEOUT_MS });

export function normalizeUrl(input) {
  let raw = String(input || '').trim();
  if (!raw) throw new FetchError('empty');
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new FetchError('invalid');
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new FetchError('invalid');
  if (url.username || url.password) throw new FetchError('invalid');
  if (url.port && !['80', '443'].includes(url.port)) throw new FetchError('invalid');
  if (!url.hostname.includes('.') || net.isIP(url.hostname.replace(/^\[|\]$/g, ''))) throw new FetchError('invalid');
  url.hash = '';
  return url;
}

async function readLimited(res) {
  const reader = res.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function fetchPage(input) {
  let url = normalizeUrl(input);
  const signal = AbortSignal.timeout(TIMEOUT_MS);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await undiciFetch(url, {
      dispatcher: agent,
      redirect: 'manual',
      signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; SiteRoastBot/1.0; +https://siteroast.app)',
        accept: 'text/html,application/xhtml+xml',
      },
    });

    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      await res.body?.cancel();
      url = normalizeUrl(new URL(res.headers.get('location'), url).toString());
      continue;
    }

    const type = res.headers.get('content-type') || '';
    if (!res.ok || !type.includes('html')) {
      await res.body?.cancel();
      throw new FetchError(`status-${res.status}`);
    }

    return { finalUrl: url.toString(), html: await readLimited(res) };
  }
  throw new FetchError('too-many-redirects');
}
