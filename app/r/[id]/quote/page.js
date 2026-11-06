import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from '@/components/Icons';
import QuoteForm from '@/components/QuoteForm';
import { getRoast } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Get a free quote', robots: { index: false } };

export default async function Quote({ params }) {
  const { id } = await params;
  const roast = await getRoast(id);
  if (!roast) notFound();

  return (
    <div className="page">
      <div className="narrow">
        <header className="subhead">
          <Link href={`/r/${id}`} className="back" aria-label="Back to report"><ArrowLeft /></Link>
          <span className="subhead-title">Get a free quote</span>
        </header>
        <QuoteForm roastId={id} host={roast.host} fixes={roast.fixes.map((f) => f.title)} />
      </div>
    </div>
  );
}
