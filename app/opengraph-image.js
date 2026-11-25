import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// The 1200×630 preview for SiteRoast itself: what shows on WhatsApp
// (chats and status), X, LinkedIn and iMessage when the home link is shared.
// Next.js finds this file by its name and adds the og:image tags for us.
// Review pages keep their own card (app/r/[id]/card).

export const runtime = 'nodejs';
export const alt = 'SiteRoast: is your website losing you customers? A free, honest review in 30 seconds.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const domain = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://siteroast.app').hostname.replace(/^www\./, '');
const font = (file) => readFile(join(process.cwd(), 'assets', file));

const INK = '#111111';
const PEN = '#D9301C';
const MUTE = '#686868';

export default async function Image() {
  const [serif, serifItalic, mono] = await Promise.all([
    font('newsreader-latin-500-normal.woff'),
    font('newsreader-latin-500-italic.woff'),
    font('geist-mono-latin-500-normal.woff'),
  ]);

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#FFFFFF', color: INK, padding: '60px 72px', fontFamily: 'Serif' }}>
        {/* Masthead */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${INK}`, paddingBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', fontSize: 40 }}>
            <span style={{ fontStyle: 'italic' }}>Site</span>
            <span>Roast</span>
            <span style={{ color: PEN }}>.</span>
          </div>
          <div style={{ display: 'flex', fontFamily: 'Mono', fontSize: 20, letterSpacing: 3, color: MUTE }}>THE HONEST WEBSITE REVIEW</div>
        </div>

        {/* Headline + stamp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: 76, lineHeight: 1.04, letterSpacing: '-0.035em' }}>
              <span style={{ marginRight: '0.22em' }}>Is</span>
              <span style={{ marginRight: '0.22em' }}>your</span>
              <span style={{ marginRight: '0.22em' }}>website</span>
              {/* The red pen: italic words with a hand-drawn underline */}
              <span style={{ display: 'flex', flexDirection: 'column', marginRight: '0.22em', color: PEN, fontStyle: 'italic' }}>
                <span>losing</span>
                <span style={{ display: 'flex', height: 6, marginTop: -6, background: PEN, borderRadius: 6, transform: 'rotate(-1.5deg)' }} />
              </span>
              <span style={{ color: PEN, fontStyle: 'italic', marginRight: '0.22em' }}>you</span>
              <span style={{ color: PEN, fontStyle: 'italic' }}>customers?</span>
            </div>
            <div style={{ display: 'flex', marginTop: 28, fontSize: 32, color: '#3B3B3B' }}>
              Paste your link. Get the honest verdict.
            </div>
          </div>

          <div style={{ display: 'flex', width: 220, height: 220, flexShrink: 0, borderRadius: 999, border: `3px solid ${PEN}`, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', transform: 'rotate(-8deg)', color: PEN }}>
            <div style={{ display: 'flex', fontFamily: 'Mono', fontSize: 16, letterSpacing: 3 }}>REVIEWED</div>
            <div style={{ display: 'flex', fontSize: 72, lineHeight: 1, fontStyle: 'italic', margin: '6px 0' }}>Free</div>
            <div style={{ display: 'flex', fontFamily: 'Mono', fontSize: 16, letterSpacing: 3 }}>IN 30 SECONDS</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', fontFamily: 'Mono', fontSize: 22, letterSpacing: 2, color: MUTE }}>
          REVIEW YOUR SITE FREE AT&nbsp;<span style={{ color: PEN }}>{domain.toUpperCase()}</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Serif', data: serif, weight: 500, style: 'normal' },
        { name: 'Serif', data: serifItalic, weight: 500, style: 'italic' },
        { name: 'Mono', data: mono, weight: 500, style: 'normal' },
      ],
    }
  );
}
