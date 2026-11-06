import { db, isValidId } from '@/lib/supabase';

export const runtime = 'nodejs';

// Serves a report's stored screenshot as a real image file,
// so report pages stay light and browsers can cache the picture.
export async function GET(_request, { params }) {
  const { id, kind } = await params;
  const column = kind === 'mobile' ? 'shot_mobile' : kind === 'desktop' ? 'shot_desktop' : null;
  if (!column || !isValidId(id)) return new Response('Not found', { status: 404 });

  const { data } = await db().from('roasts').select(column).eq('id', id).maybeSingle();
  const dataUrl = data?.[column];
  const match = typeof dataUrl === 'string' && dataUrl.match(/^data:(image\/(?:jpeg|webp|png));base64,(.+)$/);
  if (!match) return new Response('Not found', { status: 404 });

  return new Response(Buffer.from(match[2], 'base64'), {
    headers: {
      'content-type': match[1],
      'cache-control': 'public, max-age=31536000, immutable',
    },
  });
}
