import '@fontsource-variable/inter';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'SiteRoast — Find out what your website is costing you',
    template: '%s · SiteRoast',
  },
  description:
    'Paste a link. In 30 seconds you get a score, the problems, and how to fix them. Free, no sign-up.',
  openGraph: {
    siteName: 'SiteRoast',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport = {
  themeColor: '#0A0B0D',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
