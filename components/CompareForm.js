'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { runReview, toUrl, hostOf } from '@/lib/run-review';

const MESSAGES = {
  none: 'Add at least one competitor’s website.',
  invalid: 'One of those doesn’t look like a website address. Try something like theirbusiness.com.',
  same: 'That’s your own site. Add a competitor’s website instead.',
  limited: 'You’ve compared a lot of sites this hour. Please try again a little later.',
  failed: 'We couldn’t review any of those sites. Check the links and try again.',
  generic: 'Something went wrong on our side. Please try again.',
};

// Head to Head: the visitor adds up to three competitors, we review them all
// at the same time, then show the league table.
export default function CompareForm({ youId, youHost, youScore }) {
  const router = useRouter();
  const [values, setValues] = useState(['', '', '']);
  const [error, setError] = useState('');
  const [rows, setRows] = useState(null); // [{ host, status: 'working' | 'done' | 'failed', note }]
  const abortRef = useRef(null);

  const setRow = (i, patch) => setRows((r) => r.map((row, k) => (k === i ? { ...row, ...patch } : row)));

  async function submit(e) {
    e.preventDefault();
    const filled = values.map((v) => v.trim()).filter(Boolean);
    if (!filled.length) return setError(MESSAGES.none);
    const urls = filled.map(toUrl);
    if (urls.some((u) => !u)) return setError(MESSAGES.invalid);
    const unique = [...new Map(urls.map((u) => [hostOf(u), u])).values()];
    if (unique.some((u) => hostOf(u) === youHost)) return setError(MESSAGES.same);
    setError('');

    const controller = new AbortController();
    abortRef.current = controller;
    setRows(unique.map((u) => ({ host: hostOf(u), status: 'working', note: 'Opening on a phone' })));

    const settled = await Promise.allSettled(
      unique.map((u, i) =>
        runReview(u, {
          kind: 'rival',
          desktop: false,
          signal: controller.signal,
          onNote: (n) => setRow(i, { note: n.value ? `${n.text}: ${n.value}` : n.text }),
        }).then(
          (id) => (setRow(i, { status: 'done', note: 'Reviewed' }), id),
          (err) => {
            setRow(i, { status: 'failed', note: 'Couldn’t open this site' });
            throw err;
          }
        )
      )
    );
    if (controller.signal.aborted) return;

    const rivalIds = settled.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    if (!rivalIds.length) {
      const limited = settled.some((r) => r.reason?.message === 'limited');
      setError(limited ? MESSAGES.limited : MESSAGES.failed);
      return;
    }

    const res = await fetch('/api/compare', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ youId, rivalIds }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (res?.status === 429) return setError(MESSAGES.limited);
    if (!res?.ok || !data?.id) return setError(MESSAGES.generic);
    router.push(`/c/${data.id}`);
  }

  function cancel() {
    abortRef.current?.abort();
    setRows(null);
  }

  if (rows) {
    return (
      <section aria-live="polite">
        <span className="kicker">Head to Head</span>
        <h1 className="narrow-title">Reviewing your <em>rivals</em></h1>
        <p className="muted" style={{ margin: 0 }}>All at once. This takes about a minute.</p>
        <ol className="notebook" style={{ marginTop: 24 }}>
          <li>
            <span>{youHost} <span className="kicker" style={{ color: 'var(--pen-dark)' }}>You</span></span>
            <b className="ok">{youScore}/100</b>
          </li>
          {rows.map((r) => (
            <li key={r.host} className={r.status === 'working' ? 'writing' : ''}>
              <span>{r.host}<br /><small className="kicker" style={{ textTransform: 'none', letterSpacing: 0 }}>{r.note}</small></span>
              <b className={r.status === 'failed' ? 'bad' : 'ok'}>{r.status === 'working' ? 'Working' : r.status === 'done' ? 'Done' : 'Skipped'}</b>
            </li>
          ))}
        </ol>
        {error && <p className="error-text" role="alert" style={{ marginTop: 16 }}>{error}</p>}
        <button type="button" className="btn btn-line" style={{ marginTop: 20 }} onClick={cancel}>{error ? 'Try again' : 'Cancel'}</button>
      </section>
    );
  }

  return (
    <>
      <span className="kicker">Head to Head</span>
      <h1 className="narrow-title">How does <em>{youHost}</em> stack up?</h1>
      <p className="muted" style={{ margin: 0 }}>Add up to three competitors. We’ll review them side by side and show you exactly what it takes to beat them.</p>
      <form className="qform" onSubmit={submit} noValidate>
        {values.map((v, i) => (
          <div className="field" key={i}>
            <label htmlFor={`rival-${i}`} className="label">Competitor {i + 1}{i > 0 && <span style={{ color: 'var(--mute)', fontWeight: 400 }}> (optional)</span>}</label>
            <input
              id={`rival-${i}`}
              className="input"
              type="text"
              inputMode="url"
              autoCapitalize="none"
              spellCheck="false"
              placeholder="theirbusiness.com"
              value={v}
              onChange={(e) => setValues((all) => all.map((x, k) => (k === i ? e.target.value : x)))}
            />
          </div>
        ))}
        {error && <p className="error-text" role="alert">{error}</p>}
        <button type="submit" className="btn btn-ink btn-block">Compare</button>
      </form>
    </>
  );
}
