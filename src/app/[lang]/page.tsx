import { Fragment } from 'react';
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

/**
 * The hero arrives a word at a time. Each word is its own `.rise`, so the
 * house entrance runs unchanged, just closer together — the hero sets
 * `--stagger` for that. Korean breaks at spaces anyway (keep-all), so a word
 * is a real unit here, and inline-block keeps one from wrapping mid-way.
 */
function Words({ text, from }: { text: string; from: number }) {
  return text.split(' ').map((word, i) => (
    <Fragment key={i}>
      {i > 0 && ' '}
      <span className={`${styles.word} rise`} style={{ '--i': from + i } as React.CSSProperties}>
        {word}
      </span>
    </Fragment>
  ));
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
      <section className={styles.hero} style={{ '--stagger': '40ms' } as React.CSSProperties}>
        <h1 className={styles.title}>
          <Words text={site.title[lang]} from={0} />
        </h1>
        <p className={styles.subtitle}>
          <Words text={site.description[lang]} from={site.title[lang].split(' ').length} />
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
