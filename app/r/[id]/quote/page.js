import Link from 'next/link';
import { notFound } from 'next/navigation';
import Masthead from '@/components/Logo';
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
    <>
      <Masthead />
      <main className="page">
        <div className="narrow">
          <div className="subhead">
            <Link href={`/r/${id}`} className="back" aria-label="Back to the review"><ArrowLeft /></Link>
            <span className="kicker">Back to the review</span>
          </div>
          <QuoteForm roastId={id} host={roast.host} fixes={roast.fixes.map((f) => f.title)} />
        </div>
      </main>
    </>
  );
}
