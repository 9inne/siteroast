// Runs one full review from the visitor's browser and saves it.
// Used by the home page (one site) and Head to Head (several sites at once).
//
//   kind     'main' for the visitor's own site, 'rival' for a competitor
//   desktop  also test the laptop view (main reviews only, to save time)
//   onNote   called with { key, text, value, tone } as each result arrives
//   onShot   called with the phone screenshot as soon as it's ready
//   signal   an AbortSignal to cancel everything
//
// Resolves to the new review's id, or throws an Error whose message is one of:
// 'limited', 'generic', 'unreachable'.

import { runPageSpeed } from './psi-client';

const secs = (ms) => `${(ms / 1000).toFixed(1)} s`;
const mb = (b) => `${(b / 1_000_000).toFixed(1)} MB`;

export function toUrl(input) {
  let raw = String(input || '').trim();
  if (!raw || /\s/.test(raw)) return null;
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  try {
    const u = new URL(raw);
    return u.hostname.includes('.') ? u.toString() : null;
  } catch {
    return null;
  }
}

export const hostOf = (url) => new URL(url).hostname.replace(/^www\./, '');

export async function runReview(url, { kind = 'main', desktop = true, onNote = () => {}, onShot = () => {}, signal } = {}) {
  const within = (ms) => AbortSignal.any([signal, AbortSignal.timeout(ms)].filter(Boolean));
  const live = () => !signal?.aborted;

  const checkP = fetch('/api/check', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url }),
    signal: within(15000),
  })
    .then((r) => r.json())
    .catch(() => null)
    .then((c) => {
      if (!live()) return c;
      if (c?.ok) {
        const f = c.facts;
        const reach = f.hasPhone || f.hasEmail || f.hasWhatsApp || f.hasForm;
        onNote({ key: 'reach', text: 'A way to call, email or chat', value: reach ? 'Found' : 'None', tone: reach ? 'ok' : 'bad' });
        onNote({ key: 'desc', text: 'Description for Google', value: f.description ? 'Yes' : 'Missing', tone: f.description ? 'ok' : 'bad' });
      } else {
        onNote({ key: 'reach', text: 'Contact check', value: 'Blocked', tone: 'ok' });
      }
      return c;
    });

  const mobileP = runPageSpeed(url, 'mobile', within(90000)).then((m) => {
    if (!live()) return m;
    onShot(m.screenshot);
    const slow = (ms, limit) => (ms > limit ? 'bad' : 'ok');
    if (m.metrics.fcpMs) onNote({ key: 'fcp', text: 'Time until something appears', value: secs(m.metrics.fcpMs), tone: slow(m.metrics.fcpMs, 1800) });
    if (m.metrics.lcpMs) onNote({ key: 'lcp', text: 'Main content visible', value: secs(m.metrics.lcpMs), tone: slow(m.metrics.lcpMs, 2500) });
    if (m.metrics.totalBytes) onNote({ key: 'weight', text: 'Weight of the page', value: mb(m.metrics.totalBytes), tone: m.metrics.totalBytes > 3_000_000 ? 'bad' : 'ok' });
    return m;
  });

  const desktopP = desktop
    ? runPageSpeed(url, 'desktop', within(90000))
        .catch(() => null)
        .then((d) => {
          if (live()) onNote({ key: 'laptop', text: 'Laptop view', value: d ? 'Done' : 'Skipped', tone: 'ok' });
          return d;
        })
    : Promise.resolve(null);

  let results;
  try {
    results = await Promise.all([mobileP, desktopP, checkP]);
  } catch (err) {
    if (!live()) throw err;
    throw new Error('unreachable');
  }
  const [mobile, desktopResult, checks] = results;
  onNote({ key: 'write', text: kind === 'main' ? 'Writing the review' : 'Scoring', writing: true });

  const res = await fetch('/api/roast', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url, kind, mobile, desktop: desktopResult, checks }),
    signal: within(30000),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 429) throw new Error('limited');
  if (!res.ok || !data.id) throw new Error('generic');
  return data.id;
}
