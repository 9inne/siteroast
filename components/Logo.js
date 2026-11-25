import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="SiteRoast home">
      <i>Site</i>Roast<b>.</b>
    </Link>
  );
}

// The top bar shared by every page.
export default function Masthead({ right }) {
  return (
    <header className="mast">
      <div className="page mast-inner">
        <Logo />
        {right}
      </div>
    </header>
  );
}
