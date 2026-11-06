import Link from 'next/link';
import { notFound } from 'next/navigation';
import Logo from '@/components/Logo';
import ScoreRing from '@/components/ScoreRing';
import { Chevron, ShareIcon } from '@/components/Icons';
import { getRoast, percentileFor } from '@/lib/supabase';
import { barColor, scoreLabel } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const roast = await getRoast(id);
  if (!roast) return { title: 'Report not found' };
  const title = `${roast.host} scored ${roast.score}/100`;
  return {
    title,
    description: roast.headline,
    openGraph: { title: `${title} on SiteRoast`, description: roast.headline, images: [{ url: `/r/${id}/card`, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, description: roast.headline, images: [`/r/${id}/card`] },
  };
}

function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function Report({ params }) {
  const { id } = await params;
  const roast = await getRoast(id);
  if (!roast) notFound();

  const label = scoreLabel(roast.score);
  const percentile = await percentileFor(roast.score).catch(() => null);

  return (
    <div className="page">
      <header className="topbar">
        <Logo />
        <Link className="topbar-link" href="/">New roast</Link>
      </header>

      <div className="report-meta">{roast.host} · roasted {timeAgo(roast.created_at)}</div>

      <div className="report">
        <section className="card verdict report-verdict" aria-label="Verdict">
          <div className="verdict-top">
            <ScoreRing score={roast.score} />
            <div className="verdict-tags">
              <span className={`badge badge--${label.tone}`}>{label.text}</span>
              {percentile != null && (
                <span className="muted" style={{ fontSize: 14, lineHeight: 1.4 }}>
                  Better than {percentile}% of sites we’ve roasted
                </span>
              )}
            </div>
          </div>
          <h1 className="display verdict-title">{roast.headline}</h1>
        </section>

        <div className="report-main">
          <section>
            <h2 className="section-title">How visitors see it</h2>
            <div className="shots">
              <figure className="shot shot--phone" style={{ margin: 0 }}>
                <div className="shot-frame">
                  {roast.has_mobile_shot ? (
                    <img src={`/r/${id}/shot/mobile`} alt={`${roast.host} on a phone`} loading="lazy" />
                  ) : (
                    <span>No screenshot</span>
                  )}
                </div>
                <figcaption className="shot-cap">Phone</figcaption>
              </figure>
              <figure className="shot shot--laptop" style={{ margin: 0 }}>
                <div className="shot-frame">
                  {roast.has_desktop_shot ? (
                    <img src={`/r/${id}/shot/desktop`} alt={`${roast.host} on a laptop`} loading="lazy" />
                  ) : (
                    <span>No screenshot</span>
                  )}
                </div>
                <figcaption className="shot-cap">Laptop</figcaption>
              </figure>
            </div>
          </section>

          <section>
            <h2 className="section-title">Fix these first</h2>
            <ol className="fixes">
              {roast.fixes.map((fix, i) => (
                <li key={fix.title} className="card fix">
                  <span className="fix-num" aria-hidden="true">{i + 1}</span>
                  <div className="fix-body">
                    <span className="fix-title">{fix.title}</span>
                    <span className="fix-text">{fix.body}</span>
                    {fix.impact && <span className="fix-impact">{fix.impact}</span>}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="breakdown">
            <h2 className="section-title" style={{ marginBottom: 4 }}>Full breakdown</h2>
            {roast.categories.map((c) => (
              <details key={c.key}>
                <summary>
                  <span className="bd-name">{c.name}</span>
                  <span className="bd-bar" aria-hidden="true">
                    <span className="bd-fill" style={{ display: 'block', width: `${c.score ?? 0}%`, background: barColor(c.score) }} />
                  </span>
                  <span className="bd-score">{c.score ?? '—'}</span>
                  <span className="bd-chev"><Chevron /></span>
                </summary>
                {c.score == null ? (
                  <p className="bd-ok">We couldn’t check this one. The site may block automated visitors.</p>
                ) : c.issues.length ? (
                  <ul className="bd-list">
                    {c.issues.map((issue) => <li key={issue}>{issue}</li>)}
                  </ul>
                ) : (
                  <p className="bd-ok">Nothing major here. Nice work.</p>
                )}
              </details>
            ))}
          </section>
        </div>

        <aside className="report-actions" aria-label="Next steps">
          <Link href={`/r/${id}/share`} className="btn btn--ghost btn--block">
            <ShareIcon /> Share your score
          </Link>
          <section className="cta">
            <h2>Want these fixed for you?</h2>
            <p>A real designer reviews your report and sends a free quote within 24 hours.</p>
            <Link href={`/r/${id}/quote`} className="btn btn--dark btn--block">Get a free quote</Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
