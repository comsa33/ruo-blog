import { NextResponse, type NextRequest } from 'next/server';

/**
 * The root layout lives at `app/[lang]/layout.tsx` so that `<html lang>` can
 * name the language the page is actually written in. That leaves `/` without
 * a page to render — a page needs a root layout and there is none above the
 * language segment — so the redirect that used to be `app/page.tsx` happens
 * here instead, before routing.
 */
export function middleware(request: NextRequest) {
  return NextResponse.redirect(new URL('/ko', request.url));
}

export const config = { matcher: '/' };
