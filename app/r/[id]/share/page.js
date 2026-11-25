import Link from 'next/link';
import { notFound } from 'next/navigation';
import Masthead from '@/components/Logo';
import { ArrowLeft } from '@/components/Icons';
import ShareButtons from '@/components/ShareButtons';
import { getRoast } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Share this review', robots: { index: false } };

export default async function Share({ params }) {
  const { id } = await params;
  const roast = await getRoast(id);
  if (!roast) notFound();

  const site = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
  const reportUrl = `${site}/r/${id}`;
  const text = `My website ${roast.host} just got reviewed on SiteRoast: ${roast.score}/100. ${String(roast.headline).replace(/\*/g, '')}`;

  return (
    <>
      <Masthead />
      <main className="page">
        <div className="narrow">
          <div className="subhead">
            <Link href={`/r/${id}`} className="back" aria-label="Back to the review"><ArrowLeft /></Link>
            <span className="kicker">Back to the review</span>
          </div>
          <h1 className="narrow-title">Share the <em>verdict</em></h1>
          <p className="muted" style={{ margin: 0 }}>This card shows up as the preview wherever you post the link.</p>
          <div className="share-card">
            <img src={`/r/${id}/card`} alt={`${roast.host} scored ${roast.score} out of 100`} width={1200} height={630} />
          </div>
          <ShareButtons url={reportUrl} text={text} imageUrl={`/r/${id}/card`} fileName={`siteroast-${roast.host}.png`} />
          <div className="share-foot">
            <span className="muted">Know a site that needs this more?</span>
            <Link href="/" style={{ fontWeight: 500, padding: '12px 0' }}>Review it</Link>
          </div>
        </div>
      </main>
    </>
  );
}
