import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPost, getAllParams, formatDate } from '@/lib/posts';
import { ReadingRuler } from '@/components/ReadingRuler';
import { TravelingDot } from '@/components/TravelingDot';
import { Views } from '@/components/Views';
import { site, t, type Lang } from '@/lib/site';
import styles from './post.module.css';

type Params = { lang: Lang; slug: string };

export function generateStaticParams() {
  return getAllParams();
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang, slug } = await params;
  const post = getPost(slug, lang);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/${lang}/${slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      url: `${site.url}/${lang}/${slug}`,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const { lang, slug } = await params;
  const post = getPost(slug, lang);
  if (!post) notFound();

  // Webpack resolves this template literal into a context module, so every
  // post under content/posts is statically discoverable at build time.
  const { default: Body } = await import(`../../../../content/posts/${slug}/${lang}.mdx`);

  return (
    <main className={styles.main}>
      <ReadingRuler nextLabel={t.nextSection[lang]} topLabel={t.backToTop[lang]} />

      <article className={styles.article}>
        <TravelingDot />
        <header className={`${styles.header} rise`}>
          <div className={styles.kicker}>
            {post.topic && <span className={styles.topic}>{post.topic}</span>}
            {/* A tag is a link into the index search — there is no tag wall. */}
            {post.tags.map((tag) => (
              <Link key={tag} href={`/${lang}?q=${encodeURIComponent(tag)}`} className={styles.tag}>
                {tag}
              </Link>
            ))}
          </div>
          <h1 className={styles.title}>{post.title}</h1>
          {post.description && <p className={styles.description}>{post.description}</p>}
          <div className={styles.meta}>
            <span>{formatDate(post.date, lang)}</span>
            <span aria-hidden>·</span>
            <span>
              {post.readingTime}
              {t.minutes[lang]}
            </span>
            <Views slug={slug} lang={lang} />
          </div>
        </header>

        <div
          data-prose
          className={`${styles.prose} rise`}
          style={{ '--i': 1 } as React.CSSProperties}
        >
          <Body />
        </div>
      </article>

      <footer className={styles.footer}>
        <Link href={`/${lang}`} className={styles.back}>
          ← {t.backToIndex[lang]}
        </Link>
        <span>{lang === 'ko' ? site.authorKo : site.author}</span>
      </footer>
    </main>
  );
}
