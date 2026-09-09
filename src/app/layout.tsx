import type { Metadata } from 'next';
import { site } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title.ko, template: `%s — ${site.author}` },
  description: site.description.ko,
  authors: [{ name: site.author, url: site.portfolio }],
  alternates: { types: { 'application/rss+xml': `${site.url}/rss.xml` } },
  openGraph: { type: 'website', siteName: site.title.ko, url: site.url },
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
