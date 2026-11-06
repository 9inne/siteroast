import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getRoast } from '@/lib/supabase';

export const runtime = 'nodejs';

// The 1200×630 share image for a report. It's what shows up as the big
// preview on WhatsApp, X, LinkedIn and iMessage when someone shares the link.

const domain = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://siteroast.app').hostname.replace(/^www\./, '');
const font = (file) => readFile(join(process.cwd(), 'assets', file));

export async function GET(_request, { params }) {
  const { id } = await params;
  const roast = await getRoast(id);
  if (!roast) return new Response('Not found', { status: 404 });

  const [bold, semi, body] = await Promise.all([
    font('space-grotesk-latin-700-normal.woff'),
    font('space-grotesk-latin-600-normal.woff'),
    font('inter-latin-500-normal.woff'),
  ]);

  const size = 230;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (roast.score / 100) * c;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#0A0B0D', color: '#F2F4F7', padding: '64px 72px', fontFamily: 'Inter' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'Grotesk', fontWeight: 700, fontSize: 40 }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#C8F031" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.5c.8 3.2 4.5 5 4.5 9.5a4.5 4.5 0 0 1-9 0c0-1.9.8-3.2 1.8-4.3.3 1.8 1.2 2.8 2.4 2.8 0-2.8-.6-5 .3-8z" />
              <path d="M12 21.5a2 2 0 0 0 2-2c0-1.4-2-2.8-2-2.8s-2 1.4-2 2.8a2 2 0 0 0 2 2z" />
            </svg>
            SiteRoast
          </div>
          <div style={{ display: 'flex', fontSize: 30, color: '#A9AFBA' }}>{roast.host}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 64 }}>
          <div style={{ display: 'flex', position: 'relative', width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2E323A" strokeWidth={stroke} />
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#C8F031" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${dash} ${c}`} />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', fontFamily: 'Grotesk', fontWeight: 700, fontSize: 92, lineHeight: 1 }}>{roast.score}</div>
              <div style={{ display: 'flex', fontSize: 26, color: '#8A909C' }}>/100</div>
            </div>
          </div>
          <div style={{ display: 'flex', flex: 1, fontFamily: 'Grotesk', fontWeight: 600, fontSize: 50, lineHeight: 1.18, letterSpacing: '-0.02em' }}>
            {roast.headline}
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 28, color: '#8A909C' }}>
          Get your free website roast at <span style={{ color: '#C8F031', marginLeft: 10 }}>{domain}</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Grotesk', data: bold, weight: 700, style: 'normal' },
        { name: 'Grotesk', data: semi, weight: 600, style: 'normal' },
        { name: 'Inter', data: body, weight: 500, style: 'normal' },
      ],
      headers: { 'cache-control': 'public, max-age=86400' },
    }
  );
}
