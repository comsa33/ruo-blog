import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { site, LANGS, type Lang } from '@/lib/site';
import '../globals.css';

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

/**
 * Only the two languages exist. Without this a segment like `/fr` is treated
 * as a page to render, and the index crashes on `site.title.fr` before this
 * layout's notFound() runs — a 500 where Search should see a 404.
 */
export const dynamicParams = false;

/**
 * This is the root layout, and it sits under `[lang]` rather than at the top
 * of `app/` for one reason: `<html lang>` has to say which language the page
 * is written in, and only a layout inside the language segment knows that.
 * With a single root layout above it, every English page claimed `lang="ko"`,
 * which told Search the two translations were the same language and left the
 * hreflang pair looking like duplicates of each other.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const requested = (await params).lang as Lang;
  // An unknown segment still reaches generateMetadata before the layout gets
  // to call notFound(), so fall back rather than index into site.title with it.
  const lang = LANGS.includes(requested) ? requested : 'ko';
  return {
    metadataBase: new URL(site.url),
    title: { default: site.title[lang], template: `%s — ${site.author}` },
    description: site.description[lang],
    authors: [{ name: site.author, url: site.portfolio }],
    alternates: { types: { 'application/rss+xml': `${site.url}/rss.xml` } },
    openGraph: { type: 'website', siteName: site.title[lang], url: `${site.url}/${lang}` },
    robots: { index: true, follow: true },
    /**
     * Search console ownership. Google is verified by the static file in
     * `public/`, so only Naver needs a tag — its downloadable HTML file was
     * never saved, and the tag is the same check by another route.
     */
    verification: {
      other: { 'naver-site-verification': '94cacbe4676230a74e45d04984e7e8137bae023f' },
    },
  };
}

/**
 * Set the theme before first paint. Anything React-driven here would flash.
 */
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
  }
})();
`;

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!LANGS.includes(lang as Lang)) notFound();

  return (
    <html lang={lang === 'ko' ? 'ko-KR' : 'en'} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        {/* Serif, for the prose of an article and the index list's excerpt.
            Weight 500 is all the emphasis needs — .prose strong carries it
            with an underline rather than by getting heavier — so no 700 is
            fetched. Google serves the face as unicode-range subsets, so a page
            pulls only the slices its own characters need. */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500&display=swap"
        />
      </head>
      <body>
        {/* The footer waits on the page behind the sheet; the sheet slides up off it. */}
        <div className="sheet">
          <Header lang={lang as Lang} />
          {children}
        </div>
        <SiteFooter lang={lang as Lang} />
      </body>
    </html>
  );
}
