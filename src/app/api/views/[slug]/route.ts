import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getViews, hashVisitor, kstDay, recordView, viewsConfigured } from '@/lib/views';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ slug: string }> };

const SLUG = /^[a-z0-9-]{1,80}$/;

/** Only real posts get a counter; otherwise any URL could mint keys. */
function isPost(slug: string) {
  return SLUG.test(slug) && fs.existsSync(path.join(process.cwd(), 'content', 'posts', slug));
}

const NO_STORE = { headers: { 'Cache-Control': 'no-store' } };

function unavailable() {
  return NextResponse.json({ error: 'views not configured' }, { status: 503, ...NO_STORE });
}

export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = await params;
  if (!viewsConfigured) return unavailable();
  if (!isPost(slug)) return NextResponse.json({ error: 'unknown post' }, { status: 404 });
  try {
    return NextResponse.json(await getViews(slug), NO_STORE);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'store unreachable' }, { status: 502, ...NO_STORE });
  }
}

export async function POST(req: Request, { params }: Ctx) {
  const { slug } = await params;
  if (!viewsConfigured) return unavailable();
  if (!isPost(slug)) return NextResponse.json({ error: 'unknown post' }, { status: 404 });

  try {
    const ua = req.headers.get('user-agent') ?? '';
    // Crawlers open every page; they are not readers.
    if (!ua || /bot|crawl|spider|preview|fetch|curl/i.test(ua)) {
      return NextResponse.json(await getViews(slug), NO_STORE);
    }
    const ip =
      (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '';
    const visitor = await hashVisitor([ip, ua, kstDay()]);
    return NextResponse.json(await recordView(slug, visitor), NO_STORE);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'store unreachable' }, { status: 502, ...NO_STORE });
  }
}
