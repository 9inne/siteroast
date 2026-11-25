'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { runReview, toUrl, hostOf } from '@/lib/run-review';
import Plate from './Plate';

export const ERRORS = {
  invalid: 'That doesn’t look like a website address. Try something like yourbusiness.com.',
  unreachable: 'We couldn’t open that site. Check the link is right and the site is online, then try again.',
  limited: 'You’ve reviewed a lot of sites this hour. Take a breather and try again a little later.',
  generic: 'Something went wrong on our side. Please try again.',
};

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

  async function begin(raw) {
    const url = toUrl(raw);
    if (!url) return setFormError(ERRORS.invalid);
    setFormError('');

    const controller = new AbortController();
    abortRef.current = controller;
    let pages = 0;
    setRun({ host: hostOf(url), notes: [{ key: 'open', text: 'Opening the homepage on a phone', writing: true }], shot: null, pages: 0, error: '' });
    window.scrollTo({ top: 0 });

    try {
      const id = await runReview(url, {
        kind: 'main',
        signal: controller.signal,
        onShot: (shot) => patch({ shot }),
        onNote: (note) => {
          addNote(note);
          if (['reach', 'lcp', 'laptop', 'write'].includes(note.key)) patch({ pages: ++pages });
        },
      });
      if (controller.signal.aborted) return;
      router.push(`/r/${id}`);
    } catch (err) {
      if (controller.signal.aborted) return;
      patch({ error: ERRORS[err.message] || ERRORS.unreachable });
    }
  }

  function start(e) {
    e.preventDefault();
    begin(value);
  }

  // "Re-check this site" links here as /?check=site.com and starts straight away.
  useEffect(() => {
    const check = new URLSearchParams(window.location.search).get('check');
    if (!check) return;
    window.history.replaceState(null, '', window.location.pathname);
    setValue(check);
    begin(check);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
