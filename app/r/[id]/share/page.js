import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from '@/components/Icons';
import ShareButtons from '@/components/ShareButtons';
import { getRoast } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Share your score', robots: { index: false } };

export default async function Share({ params }) {
  const { id } = await params;
  const roast = await getRoast(id);
  if (!roast) notFound();

  const site = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
  const reportUrl = `${site}/r/${id}`;
  const text = `My website ${roast.host} scored ${roast.score}/100 on SiteRoast. ${roast.headline}`;

  return (
    <div className="page">
      <div className="narrow">
        <header className="subhead">
          <Link href={`/r/${id}`} className="back" aria-label="Back to report"><ArrowLeft /></Link>
          <span className="subhead-title">Share your score</span>
        </header>

        <p className="muted" style={{ margin: '24px 0 16px', fontSize: 15 }}>
          This image is made for your report. It shows up as a big preview wherever you post the link.
        </p>

        <div className="share-card">
          <img src={`/r/${id}/card`} alt={`${roast.host} scored ${roast.score} out of 100`} width={1200} height={630} />
        </div>

        <ShareButtons url={reportUrl} text={text} imageUrl={`/r/${id}/card`} fileName={`siteroast-${roast.host}.png`} />

        <div className="share-foot">
          <span className="muted">Think a friend’s site is worse?</span>
          <Link href="/" style={{ fontWeight: 600, padding: '12px 0', textDecoration: 'none' }}>Roast theirs</Link>
        </div>
      </div>
    </div>
  );
}
