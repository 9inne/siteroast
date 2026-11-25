'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BUDGETS } from '@/lib/constants';

const MESSAGES = {
  name: 'Please add your name.',
  email: 'Please check your email address.',
  'rate-limited': 'You’ve sent a few requests already. We’ll be in touch soon.',
  default: 'That didn’t send. Please try again.',
};

export default function QuoteForm({ roastId, host, fixes }) {
  const [status, setStatus] = useState('idle'); // idle | sending | sent
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          roastId,
          name: form.get('name'),
          email: form.get('email'),
          phone: form.get('phone'),
          fixes: form.getAll('fixes'),
          budget: form.get('budget'),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'default');
      setStatus('sent');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(MESSAGES[err.message] || MESSAGES.default);
      setStatus('idle');
    }
  }

  if (status === 'sent') {
    return (
      <div className="q-done" role="status">
        <span className="kicker">Request received</span>
        <h1 className="narrow-title" style={{ margin: 0 }}>Thank you. We’ll be <em>in touch</em>.</h1>
        <p className="muted" style={{ margin: 0 }}>You’ll get a quote by email within 24 hours.</p>
        <Link href={`/r/${roastId}`} className="btn btn-line" style={{ marginTop: 8 }}>Back to the review</Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="narrow-title">Let’s fix <em>{host}</em></h1>
      <p className="muted" style={{ margin: 0 }}>Your review is attached automatically. You’ll get a quote within 24 hours, with no obligation.</p>

      <form className="qform" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="name" className="label">Your name</label>
          <input id="name" name="name" className="input" autoComplete="name" required />
        </div>
        <div className="field">
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" className="input" autoComplete="email" placeholder="you@business.com" required />
        </div>
        <div className="field">
          <label htmlFor="phone" className="label">Phone or WhatsApp <span style={{ color: 'var(--mute)', fontWeight: 400 }}>(optional)</span></label>
          <input id="phone" name="phone" type="tel" className="input" autoComplete="tel" />
        </div>

        <fieldset className="fieldset">
          <legend className="label">What should we fix?</legend>
          {fixes.map((f) => (
            <label key={f} className="check-row">
              <input type="checkbox" name="fixes" value={f} defaultChecked />
              {f}
            </label>
          ))}
        </fieldset>

        <fieldset className="fieldset">
          <legend className="label">Rough budget</legend>
          <div className="pills">
            {BUDGETS.map((b, i) => (
              <label key={b} className="pill">
                <input type="radio" name="budget" value={b} defaultChecked={i === 1} />
                <span>{b}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p className="error-text" role="alert">{error}</p>}

        <button type="submit" className="btn btn-ink btn-block" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send my request'}
        </button>
      </form>
    </>
  );
}
