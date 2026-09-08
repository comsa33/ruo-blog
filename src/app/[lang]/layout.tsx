import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
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

  return (
    <>
      <Header lang={lang as Lang} />
      {children}
    </>
  );
}
