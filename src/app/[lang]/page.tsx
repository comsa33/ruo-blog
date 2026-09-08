import type { Metadata } from 'next';
import { getPosts } from '@/lib/posts';
import { PostList } from '@/components/PostList';
import { site, t, type Lang } from '@/lib/site';
import styles from './page.module.css';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Lang }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: site.title[lang],
    description: site.description[lang],
    alternates: { canonical: `/${lang}` },
  };
}

export default async function IndexPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const posts = getPosts(lang);

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <h1 className={`${styles.title} rise`}>{site.title[lang]}</h1>
        <p className={`${styles.subtitle} rise`} style={{ '--i': 1 } as React.CSSProperties}>
          {site.description[lang]}
        </p>
      </section>

      <section className={styles.section}>
        {posts.length ? (
          <PostList posts={posts} lang={lang} />
        ) : (
          <p className={styles.empty}>{t.empty[lang]}</p>
        )}
      </section>
    </main>
  );
}
