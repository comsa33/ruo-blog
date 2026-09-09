import type { Metadata } from 'next';
import { getPosts } from '@/lib/posts';
import { PostList } from '@/components/PostList';
import { site, t, LANGS, type Lang } from '@/lib/site';
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
    alternates: {
      canonical: `/${lang}`,
      languages: Object.fromEntries(LANGS.map((l) => [l, `${site.url}/${l}`])),
    },
  };
}

/**
 * Blog + Person for the index. The Person node is what ties the posts to an
 * identity a model can resolve — without `sameAs` the author is just a string
 * and nothing connects it to the portfolio or the code.
 */
function blogSchema(lang: Lang, posts: { slug: string; title: string; date: string }[]) {
  const author = {
    '@type': 'Person',
    name: lang === 'ko' ? site.authorKo : site.author,
    alternateName: lang === 'ko' ? site.author : site.authorKo,
    url: site.portfolio,
    sameAs: [site.portfolio, site.github],
    jobTitle: lang === 'ko' ? 'AI 엔지니어' : 'AI Engineer',
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: site.title[lang],
    description: site.description[lang],
    url: `${site.url}/${lang}`,
    inLanguage: lang === 'ko' ? 'ko-KR' : 'en',
    author,
    publisher: author,
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      datePublished: post.date,
      url: `${site.url}/${lang}/${post.slug}`,
    })),
  };
}

export default async function IndexPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const posts = getPosts(lang);

  return (
    <main className={styles.main}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema(lang, posts)) }}
      />
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
