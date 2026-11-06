'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { runPageSpeed } from '@/lib/psi-client';
import { ArrowRight, Check, Circle, FlameIcon, Spinner } from './Icons';

const LINES = [
  'Timing how long your visitors wait…',
  'Looking at your site on a tiny phone screen…',
  'Checking if your buttons actually work…',
  'Counting the megabytes you make people download…',
  'Reading your headline like a first-time visitor…',
  'Asking Google what it thinks of you…',
];

const STEPS = [
  { key: 'site', label: 'Loading your site' },
  { key: 'speed', label: 'Checking speed on a phone' },
  { key: 'shots', label: 'Taking phone and laptop screenshots' },
  { key: 'contact', label: 'Testing contact buttons and links' },
  { key: 'verdict', label: 'Writing your verdict' },
];

const ERRORS = {
  invalid: 'That doesn’t look like a website address. Try something like yourbusiness.com.',
  unreachable: 'We couldn’t load that site. Check the link is right and the site is online, then try again.',
  limited: 'You’ve roasted a lot of sites this hour. Take a breather and try again a little later.',
  generic: 'Something went wrong on our side. Please try again.',
};

function toUrl(input) {
  let raw = input.trim();
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  try {
    const u = new URL(raw);
    if (!u.hostname.includes('.') || /\s/.test(input.trim())) return null;
    return u.toString();
  } catch {
    return null;
  }
}

function Loading({ host, done, error, onRetry, onCancel }) {
  const [line, setLine] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (error) return;
    const start = Date.now();
    const t1 = setInterval(() => setLine((l) => (l + 1) % LINES.length), 3200);
    const t2 = setInterval(() => setElapsed(Date.now() - start), 500);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, [error]);

  const doneCount = STEPS.filter((s) => done[s.key]).length;
  const progress = Math.min(96, Math.max((doneCount / STEPS.length) * 100, (elapsed / 45000) * 90));
  const active = STEPS.find((s) => !done[s.key])?.key;

  return (
    <section className="loading" aria-live="polite">
      <div className="loading-head">
        <div className="loading-orb" aria-hidden="true">
          <FlameIcon size={48} strokeWidth={1.6} color="var(--lime)" />
        </div>
        <span className="faint" style={{ marginTop: 14, fontSize: 14 }}>Roasting {host}</span>
        <p className="loading-line">{error ? 'That didn’t work.' : LINES[line]}</p>
      </div>

      {error ? (
        <div className="loading-error">
          <p className="error-text" role="alert">{error}</p>
          <button type="button" className="btn btn--primary btn--block" onClick={onRetry}>Try another link</button>
        </div>
      ) : (
        <>
          <div className="progress" role="progressbar" aria-label="Roast progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <ul className="checklist">
            {STEPS.map((s) => (
              <li key={s.key} className={done[s.key] ? '' : s.key === active ? 'is-active' : 'is-waiting'}>
                {done[s.key] ? <Check /> : s.key === active ? <Spinner /> : <Circle />}
                {s.label}
              </li>
            ))}
          </ul>
          <div className="loading-foot">
            <button type="button" className="btn btn--ghost" onClick={onCancel} style={{ height: 48 }}>Cancel</button>
          </div>
        </>
      )}
    </section>
  );
}

export default function RoastForm({ header, sample, children }) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [formError, setFormError] = useState('');
  const [run, setRun] = useState(null); // { host, done, error }
  const abortRef = useRef(null);

  const mark = (key) => setRun((r) => (r ? { ...r, done: { ...r.done, [key]: true } } : r));
  const fail = (msg) => setRun((r) => (r ? { ...r, error: msg } : r));

  async function start(e) {
    e.preventDefault();
    const url = toUrl(value);
    if (!url) {
      setFormError(ERRORS.invalid);
      return;
    }
    setFormError('');
    const controller = new AbortController();
    abortRef.current = controller;
    const host = new URL(url).hostname.replace(/^www\./, '');
    setRun({ host, done: {}, error: '' });
    window.scrollTo({ top: 0 });

    const timeout = (ms) => AbortSignal.any([controller.signal, AbortSignal.timeout(ms)]);

    const checkP = fetch('/api/check', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: timeout(15000),
    })
      .then((r) => r.json())
      .catch(() => null)
      .finally(() => mark('contact'));

    const mobileP = runPageSpeed(url, 'mobile', timeout(90000)).then((res) => {
      mark('site');
      mark('speed');
      return res;
    });
    const desktopP = runPageSpeed(url, 'desktop', timeout(90000))
      .catch(() => null)
      .finally(() => mark('shots'));

    try {
      const [mobile, desktop, checks] = await Promise.all([mobileP, desktopP, checkP]);
      if (controller.signal.aborted) return;
      mark('site');

      const res = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url, mobile, desktop, checks }),
        signal: timeout(25000),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) return fail(ERRORS.limited);
      if (!res.ok || !data.id) return fail(ERRORS.generic);

      mark('verdict');
      router.push(`/r/${data.id}`);
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error(err);
      fail(ERRORS.unreachable);
    }
  }

  function reset() {
    abortRef.current?.abort();
    setRun(null);
  }

  if (run) {
    return (
      <>
        {header}
        <Loading host={run.host} done={run.done} error={run.error} onRetry={reset} onCancel={reset} />
      </>
    );
  }

  return (
    <>
      {header}
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Free website audit</span>
          <h1 className="display hero-title">Find out what your website is costing you.</h1>
          <p className="hero-sub">Paste a link. In 30 seconds you get a score, the problems, and how to fix them. No sign-up.</p>
          <form className="roast-form" onSubmit={start} noValidate>
            <label htmlFor="site-url" className="label">Website link</label>
            <div className="roast-form-bar">
              <input
                id="site-url"
                className="input"
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
              <button type="submit" className="btn btn--primary">
                Roast my site <ArrowRight />
              </button>
            </div>
            {formError && <p id="url-error" className="error-text" role="alert">{formError}</p>}
          </form>
          <div className="chips" aria-label="What we check">
            <span className="chip">Speed</span>
            <span className="chip">Mobile</span>
            <span className="chip">SEO</span>
            <span className="chip">Contact &amp; trust</span>
          </div>
        </div>
        {sample}
      </section>
      {children}
    </>
  );
}
