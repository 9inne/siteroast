import Link from 'next/link';
import { FlameIcon } from './Icons';

export default function Logo() {
  return (
    <Link href="/" className="logo" aria-label="SiteRoast home">
      <FlameIcon size={22} color="var(--lime)" />
      <span>SiteRoast</span>
    </Link>
  );
}
