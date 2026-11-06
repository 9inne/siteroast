import Link from 'next/link';
import Logo from '@/components/Logo';

export default function NotFound() {
  return (
    <div className="page">
      <header className="topbar"><Logo /></header>
      <div className="notfound">
        <h1 className="display" style={{ fontSize: 36, fontWeight: 700 }}>Nothing to roast here.</h1>
        <p className="muted" style={{ margin: 0 }}>This page or report doesn’t exist, or the link is incomplete.</p>
        <Link href="/" className="btn btn--primary">Roast a website</Link>
      </div>
    </div>
  );
}
