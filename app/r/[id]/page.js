import Link from 'next/link';
import { notFound } from 'next/navigation';
import Masthead from '@/components/Logo';
import Lines from '@/components/Lines';
import Stamp from '@/components/Stamp';
import ReviewBody from '@/components/ReviewBody';
import { getRoast, percentileFor } from '@/lib/supabase';
import { scoreLabel } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

const plain = (s) => String(s || '').replace(/\*/g, '');

export async function generateMetadata({ params }) {
  const { id } = await params;
  const roast = await getRoast(id);
  if (!roast) return { title: 'Review not found' };
  const title = `${roast.host} scored ${roast.score}/100`;
  const description = plain(roast.headline);
  return {
    title,
    description,
    openGraph: { title: `${title} · SiteRoast review`, description, images: [{ url: `/r/${id}/card`, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, description, images: [`/r/${id}/card`] },
  };
}

function reviewedWhen(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 2) return 'Reviewed just now';
  if (mins < 60) return `Reviewed ${mins} minutes ago`;
  return `Reviewed ${new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

const NOTE = {
  bad: 'Good bones, but it’s losing people before they get to know you.',
  mid: 'Getting there. A few focused fixes would make a real difference.',
  good: 'A solid site. Polish the details below and it shines.',
};

function Chevron() {
  return (
    <svg className="sr-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default async function Review({ params }) {
  const { id } = await params;
  const roast = await getRoast(id);
  if (!roast) notFound();

  const label = scoreLabel(roast.score);
  const percentile = await percentileFor(roast.score).catch(() => null);

  return (
    <>
      <Masthead right={<Link className="mast-link" href="/">Review another site</Link>} />
      <main>
        <article className="report">
          <div className="page">
            <header className="r-head">
              <div>
                <span className="kicker">Review · {roast.host}</span>
                <Lines text={roast.headline} className={`r-title${plain(roast.headline).length > 80 ? ' long' : ''}`} />
                <div className="byline kicker">
                  <span>{reviewedWhen(roast.created_at)}</span>
                  {percentile != null && <span>Better than {percentile}% of sites reviewed</span>}
                </div>
              </div>
              <div className="stamp-wrap">
                <Stamp score={roast.score} />
                <div className="rating-note">
                  <span className={`tag tag-${label.tone}`}>{label.text}</span>
                  <p>{NOTE[label.tone]}</p>
                </div>
              </div>
            </header>

            <ReviewBody host={roast.host} shotSrc={roast.has_mobile_shot ? `/r/${id}/shot/mobile` : null} fixes={roast.fixes}>
              <section>
                <h2 className="sec-h">The <em>scorecard</em></h2>
                <div className="score-rows">
                  {roast.categories.map((c) => (
                    <details key={c.key}>
                      <summary>
                        <span className="sr-name">{c.name}</span>
                        <span className="sr-val">{c.score ?? '—'}<small>/100</small></span>
                        <Chevron />
                        <span className="sr-bar" aria-hidden="true">
                          <i style={{ width: `${c.score ?? 0}%`, background: c.score != null && c.score < 50 ? 'var(--pen)' : 'var(--ink)' }} />
                        </span>
                      </summary>
                      {c.score == null ? (
                        <p className="sr-ok">We couldn’t check this one. The site may block automated visitors.</p>
                      ) : c.issues.length ? (
                        <ul className="sr-list">{c.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>
                      ) : (
                        <p className="sr-ok">Nothing major here. Nice work.</p>
                      )}
                    </details>
                  ))}
                </div>
              </section>

              {roast.has_desktop_shot && (
                <figure className="plate" style={{ margin: 0 }}>
                  <div className="laptop-shot"><img src={`/r/${id}/shot/desktop`} alt={`${roast.host} on a laptop`} loading="lazy" /></div>
                  <figcaption><em>Fig. 2</em> <span className="kicker">· On a laptop</span></figcaption>
                </figure>
              )}

              <div className="quick">
                <Link href={`/r/${id}/share`} className="btn btn-line">Share this review</Link>
                <Link href="/" className="btn btn-line">Review another site</Link>
              </div>
            </ReviewBody>
          </div>

          <section className="cta" aria-label="Get it fixed">
            <div className="page cta-inner">
              <span className="kicker">The rewrite</span>
              <h2>Want it <em>fixed</em> for you?</h2>
              <p>A real designer reads this review and sends you a free quote within 24 hours. No obligation.</p>
              <Link href={`/r/${id}/quote`} className="btn btn-paper">Get a free quote</Link>
            </div>
          </section>
        </article>
      </main>
    </>
  );
}
