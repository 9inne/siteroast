import Link from 'next/link';
import Masthead from '@/components/Logo';

export default function NotFound() {
  return (
    <>
      <Masthead />
      <main className="page">
        <div className="notfound">
          <span className="kicker">Not found</span>
          <h1 className="narrow-title" style={{ margin: 0 }}>Nothing to <em>review</em> here.</h1>
          <p className="muted" style={{ margin: 0 }}>This page or review doesn’t exist, or the link is incomplete.</p>
          <Link href="/" className="btn btn-ink">Review a website</Link>
        </div>
      </main>
    </>
  );
}
