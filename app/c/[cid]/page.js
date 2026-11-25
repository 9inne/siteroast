import Link from 'next/link';
import { notFound } from 'next/navigation';
import Masthead from '@/components/Logo';
import Lines from '@/components/Lines';
import Reveal from '@/components/Reveal';
import { getComparison, getRoasts } from '@/lib/supabase';
import { buildHeadToHead, shortName } from '@/lib/compare';

export const dynamic = 'force-dynamic';

async function load(cid) {
  const comparison = await getComparison(cid);
  if (!comparison) return null;
  const roasts = await getRoasts([comparison.you_id, ...comparison.rival_ids]);
  const you = roasts.find((r) => r.id === comparison.you_id);
  const rivals = roasts.filter((r) => r.id !== comparison.you_id);
  if (!you || !rivals.length) return null;
  return { you, rivals, ...buildHeadToHead(you, rivals) };
}

export async function generateMetadata({ params }) {
  const { cid } = await params;
  const h = await load(cid);
  if (!h) return { title: 'Head to Head not found' };
  const title = `${h.you.host} vs ${h.rivals.length} competitor${h.rivals.length > 1 ? 's' : ''}`;
  return { title, description: h.headline.replace(/\*/g, ''), robots: { index: false } };
}

const BARS = [['speed', 'Speed'], ['mobile', 'Mobile'], ['seo', 'Google'], ['contact', 'Contact']];

export default async function HeadToHead({ params }) {
  const { cid } = await params;
  const h = await load(cid);
  if (!h) notFound();
  const { you, ranked, headline, gaps, position } = h;

  return (
    <>
      <Masthead right={<Link className="mast-link" href={`/r/${you.id}`}>Your review</Link>} />
      <main>
        <article className="report">
          <div className="page">
            <header className="r-head h2h-head">
              <div>
                <span className="kicker">Head to Head · {you.host}</span>
                <Lines text={headline} className="r-title" />
              </div>
            </header>

            <div className="h2h">
              <section aria-label="League table">
                <ol className="league">
                  {ranked.map((r, i) => {
                    const isYou = r.id === you.id;
                    return (
                      <Reveal as="li" key={r.id} delay={i * 0.08} className={isYou ? 'you' : ''}>
                        <span className="pos" aria-hidden="true">{i + 1}</span>
                        <Link href={`/r/${r.id}`} className="lg-name">
                          {r.host}
                          {isYou && <small>You</small>}
                        </Link>
                        <span className="lg-score">{r.score}<small>/100</small></span>
                        <span className="lg-bars">
                          {BARS.map(([key, name]) => {
                            const s = r.categories?.find((c) => c.key === key)?.score;
                            return (
                              <span className="lg-bar" key={key}>
                                <span>{name}</span>
                                <i><b style={{ width: `${s ?? 0}%` }} className={s != null && s < 50 ? 'low' : ''} /></i>
                              </span>
                            );
                          })}
                        </span>
                      </Reveal>
                    );
                  })}
                </ol>

                {gaps.length > 0 && (
                  <div className="h2h-sec">
                    <h2 className="sec-h">{position === 0 ? <>How to <em>stay</em> first</> : <>How to take <em>first place</em></>}</h2>
                    <ul className="gaps">
                      {gaps.map((g) => (
                        <li key={g.text}><span>{g.text}</span><b>{g.value}</b></li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              <section className="h2h-sec" aria-label="Side by side">
                <h2 className="sec-h">Side by <em>side</em></h2>
                <div className="side-shots">
                  {ranked.map((r, i) => (
                    <Link href={`/r/${r.id}`} key={r.id} className="side-shot">
                      <span className={`mini${r.id === you.id ? ' you' : ''}`}>
                        {r.has_mobile_shot ? <img src={`/r/${r.id}/shot/mobile`} alt={`${r.host} on a phone`} loading="lazy" /> : <span className="mini-empty">No screenshot</span>}
                      </span>
                      <span className="mini-cap">{i + 1} · {r.id === you.id ? 'You' : shortName(r.host)}</span>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <section className="cta" aria-label="Get it fixed">
            <div className="page cta-inner">
              <span className="kicker">The rewrite</span>
              <h2>{position === 0 ? <>Want to <em>widen</em> the gap?</> : <>Want to <em>overtake</em> them?</>}</h2>
              <p>A designer reads this Head to Head and sends you a free quote within 24 hours. No obligation.</p>
              <Link href={`/r/${you.id}/quote`} className="btn btn-paper">Get a free quote</Link>
            </div>
          </section>
        </article>
      </main>
    </>
  );
}
