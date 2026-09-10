import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { SiteFooter } from '@/components/SiteFooter';
import { LANGS, type Lang } from '@/lib/site';

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!LANGS.includes(lang as Lang)) notFound();

  // The footer waits on the page behind the sheet; the sheet slides up off it.
  return (
    <>
      <div className="sheet">
        <Header lang={lang as Lang} />
        {children}
      </div>
      <SiteFooter lang={lang as Lang} />
    </>
  );
}
