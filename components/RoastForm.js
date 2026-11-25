'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { runPageSpeed } from '@/lib/psi-client';
import Plate from './Plate';

const ERRORS = {
  invalid: 'That doesn’t look like a website address. Try something like yourbusiness.com.',
  unreachable: 'We couldn’t open that site. Check the link is right and the site is online, then try again.',
  limited: 'You’ve reviewed a lot of sites this hour. Take a breather and try again a little later.',
  generic: 'Something went wrong on our side. Please try again.',
};

const secs = (ms) => `${(ms / 1000).toFixed(1)} s`;
const mb = (b) => `${(b / 1_000_000).toFixed(1)} MB`;

function toUrl(input) {
  let raw = input.trim();
  if (!raw || /\s/.test(raw)) return null;
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  try {
    const u = new URL(raw);
    return u.hostname.includes('.') ? u.toString() : null;
  } catch {
    return null;
  }
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// The "now reviewing" screen. Each note appears as the real result comes in.
function Reviewing({ host, notes, shot, pages, error, onReset }) {
  return (
    <section className="reviewing" aria-live="polite">
      <Plate src={shot} loading alt={`${host} on a phone`} caption={<span className="kicker">{shot ? 'Taking notes' : 'Opening the page'}</span>} />
      <div>
        <span className="kicker">Now reviewing</span>
        <h1 className="rv-title">{host}</h1>
      </div>
      <div className="pages" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i < pages ? 'done' : ''}><i /></span>
        ))}
      </div>
      <ol className="notebook">
        {notes.map((n, i) => (
          <li key={n.key} className={!error && i === notes.length - 1 && n.writing ? 'writing' : ''}>
            <span>{n.text}</span>
            <b className={n.tone || ''}>{n.value || ''}</b>
          </li>
        ))}
      </ol>
      {error ? (
        <div className="rv-error">
          <p className="error-text" role="alert">{error}</p>
          <button type="button" className="btn btn-ink" onClick={onReset}>Try another link</button>
        </div>
      ) : (
        <button type="button" className="btn btn-line" onClick={onReset}>Cancel</button>
      )}
    </section>
  );
}

export default function RoastForm({ sample, children }) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [formError, setFormError] = useState('');
  const [run, setRun] = useState(null); // { host, notes, shot, pages, error }
  const abortRef = useRef(null);

  const addNote = (note) => setRun((r) => (r ? { ...r, notes: [...r.notes.filter((n) => n.key !== note.key), note] } : r));
  const patch = (p) => setRun((r) => (r ? { ...r, ...p } : r));

  async function start(e) {
    e.preventDefault();
    const url = toUrl(value);
    if (!url) return setFormError(ERRORS.invalid);
    setFormError('');

    const controller = new AbortController();
    abortRef.current = controller;
    const host = new URL(url).hostname.replace(/^www\./, '');
    setRun({ host, notes: [{ key: 'open', text: 'Opening the homepage on a phone', writing: true }], shot: null, pages: 0, error: '' });
    window.scrollTo({ top: 0 });

    const within = (ms) => AbortSignal.any([controller.signal, AbortSignal.timeout(ms)]);
    let pages = 0;
    const turnPage = () => patch({ pages: ++pages });

    const checkP = fetch('/api/check', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: within(15000),
    })
      .then((r) => r.json())
      .catch(() => null)
      .then((c) => {
        if (controller.signal.aborted) return c;
        if (c?.ok) {
          const f = c.facts;
          const reach = f.hasPhone || f.hasEmail || f.hasWhatsApp || f.hasForm;
          addNote({ key: 'reach', text: 'A way to call, email or chat', value: reach ? 'Found' : 'None', tone: reach ? 'ok' : 'bad' });
          addNote({ key: 'desc', text: 'Description for Google', value: f.description ? 'Yes' : 'Missing', tone: f.description ? 'ok' : 'bad' });
        } else {
          addNote({ key: 'reach', text: 'Contact check', value: 'Blocked', tone: 'ok' });
        }
        turnPage();
        return c;
      });

    const mobileP = runPageSpeed(url, 'mobile', within(90000)).then((m) => {
      if (controller.signal.aborted) return m;
      patch({ shot: m.screenshot });
      const slow = (ms, limit) => (ms > limit ? 'bad' : 'ok');
      if (m.metrics.fcpMs) addNote({ key: 'fcp', text: 'Time until something appears', value: secs(m.metrics.fcpMs), tone: slow(m.metrics.fcpMs, 1800) });
      if (m.metrics.lcpMs) addNote({ key: 'lcp', text: 'Main content visible', value: secs(m.metrics.lcpMs), tone: slow(m.metrics.lcpMs, 2500) });
      if (m.metrics.totalBytes) addNote({ key: 'weight', text: 'Weight of the page', value: mb(m.metrics.totalBytes), tone: m.metrics.totalBytes > 3_000_000 ? 'bad' : 'ok' });
      turnPage();
      return m;
    });

    const desktopP = runPageSpeed(url, 'desktop', within(90000))
      .catch(() => null)
      .then((d) => {
        if (!controller.signal.aborted) {
          addNote({ key: 'laptop', text: 'Laptop view', value: d ? 'Done' : 'Skipped', tone: 'ok' });
          turnPage();
        }
        return d;
      });

    try {
      const [mobile, desktop, checks] = await Promise.all([mobileP, desktopP, checkP]);
      if (controller.signal.aborted) return;
      addNote({ key: 'write', text: 'Writing the review', writing: true });

      const res = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url, mobile, desktop, checks }),
        signal: within(30000),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) return patch({ error: ERRORS.limited });
      if (!res.ok || !data.id) return patch({ error: ERRORS.generic });
      turnPage();
      router.push(`/r/${data.id}`);
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error(err);
      patch({ error: ERRORS.unreachable });
    }
  }

  function reset() {
    abortRef.current?.abort();
    setRun(null);
  }

  if (run) return <Reviewing {...run} onReset={reset} />;

  return (
    <>
      <section className="hero">
        <div>
          <span className="kicker fade">The honest website review</span>
          <h1 className="h-title">
            <span className="row"><span style={{ '--i': 0 }}>Find out what</span></span>
            <span className="row"><span style={{ '--i': 1 }}>your website is</span></span>
            <span className="row open">
              <span style={{ '--i': 2 }}>
                <em>
                  costing you.
                  <svg className="underline" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
                    <path className="draw-in" d="M3 13 C 60 5, 120 16, 180 9 S 270 7, 297 12" pathLength="1" />
                  </svg>
                </em>
              </span>
            </span>
          </h1>
          <p className="h-sub fade" style={{ '--dl': '.55s' }}>
            Paste your link. In 30 seconds, SiteRoast reviews your site like a sharp critic would and tells you, in plain English, what’s driving customers away.
          </p>
          <form className="url-form fade" style={{ '--dl': '.7s' }} onSubmit={start} noValidate>
            <label htmlFor="site-url" className="visually-hidden">Website link</label>
            <div className="url-field">
              <span aria-hidden="true">https://</span>
              <input
                id="site-url"
                type="text"
                inputMode="url"
                autoComplete="url"
                autoCapitalize="none"
                spellCheck="false"
                placeholder="yourbusiness.com"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                aria-invalid={Boolean(formError)}
                aria-describedby={formError ? 'url-error' : undefined}
              />
            </div>
            <button type="submit" className="btn btn-ink">Review my site <ArrowIcon /></button>
            {formError && <p id="url-error" className="error-text" role="alert">{formError}</p>}
            <div className="form-note kicker"><span>Free</span><span>No sign-up</span><span>About 30 seconds</span></div>
          </form>
        </div>
        {sample}
      </section>
      {children}
    </>
  );
}
