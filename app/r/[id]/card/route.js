import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getRoast } from '@/lib/supabase';

export const runtime = 'nodejs';

// The 1200×630 share card for a review: the preview people see on
// WhatsApp, X, LinkedIn and iMessage when the link is shared.

const domain = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://siteroast.app').hostname.replace(/^www\./, '');
const font = (file) => readFile(join(process.cwd(), 'assets', file));

// Split the headline into words, keeping *emphasis* as red italic.
function words(headline) {
  const out = [];
  String(headline).split(/(\*[^*]+\*)/).filter(Boolean).forEach((part) => {
    const em = part.startsWith('*') && part.endsWith('*');
    (em ? part.slice(1, -1) : part).split(/\s+/).filter(Boolean).forEach((w) => out.push({ w, em }));
  });
  return out;
}

export async function GET(_request, { params }) {
  const { id } = await params;
  const roast = await getRoast(id);
  if (!roast) return new Response('Not found', { status: 404 });

  const [serif, serifItalic, mono] = await Promise.all([
    font('newsreader-latin-500-normal.woff'),
    font('newsreader-latin-500-italic.woff'),
    font('geist-mono-latin-500-normal.woff'),
  ]);

  const list = words(roast.headline);
  const size = list.length > 16 ? 50 : 58;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#FFFFFF', color: '#111111', padding: '60px 72px', fontFamily: 'Serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #111111', paddingBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', fontSize: 40 }}>
            <span style={{ fontStyle: 'italic' }}>Site</span>
            <span>Roast</span>
            <span style={{ color: '#D9301C' }}>.</span>
          </div>
          <div style={{ display: 'flex', fontFamily: 'Mono', fontSize: 20, letterSpacing: 3, color: '#686868' }}>REVIEW · {roast.host.toUpperCase()}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 56 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', flex: 1, fontSize: size, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            {list.map(({ w, em }, i) => (
              <span key={i} style={{ marginRight: '0.24em', fontStyle: em ? 'italic' : 'normal', color: em ? '#D9301C' : '#111111' }}>{w}</span>
            ))}
          </div>
          <div style={{ display: 'flex', width: 230, height: 230, borderRadius: 999, border: '3px solid #111111', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', transform: 'rotate(-6deg)' }}>
            <div style={{ display: 'flex', fontFamily: 'Mono', fontSize: 16, letterSpacing: 3, color: '#686868' }}>THE VERDICT</div>
            <div style={{ display: 'flex', fontSize: 104, lineHeight: 1 }}>{roast.score}</div>
            <div style={{ display: 'flex', fontFamily: 'Mono', fontSize: 18, color: '#686868' }}>/ 100</div>
          </div>
        </div>

        <div style={{ display: 'flex', fontFamily: 'Mono', fontSize: 22, letterSpacing: 2, color: '#686868' }}>
          GET YOUR WEBSITE REVIEWED FREE AT&nbsp;<span style={{ color: '#D9301C' }}>{domain.toUpperCase()}</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Serif', data: serif, weight: 500, style: 'normal' },
        { name: 'Serif', data: serifItalic, weight: 500, style: 'italic' },
        { name: 'Mono', data: mono, weight: 500, style: 'normal' },
      ],
      headers: { 'cache-control': 'public, max-age=86400' },
    }
  );
}
