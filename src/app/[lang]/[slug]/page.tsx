import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getPost,
  getAllParams,
  getAvailableLangs,
  getNeighbours,
  formatDate,
  type PostMeta,
} from '@/lib/posts';
import { ReadingRuler } from '@/components/ReadingRuler';
import { TravelingDot } from '@/components/TravelingDot';
import { Views } from '@/components/Views';
import { PostNav } from '@/components/PostNav';
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
    alternates: {
      canonical: `/${lang}/${slug}`,
      // Without these the two translations look like duplicates of each other.
      languages: Object.fromEntries(
        getAvailableLangs(slug).map((l) => [l, `${site.url}/${l}/${slug}`]),
      ),
    },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      url: `${site.url}/${lang}/${slug}`,
    },
  };
}

/**
 * Structured data. Unlike llms.txt this is consumed today — by Search, by AI
 * Overviews, and by anything that reads schema.org — and it is what lets a
 * model state who wrote a post and when without inferring it from layout.
 */
function articleSchema(post: PostMeta, lang: Lang) {
  const url = `${site.url}/${lang}/${post.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: lang === 'ko' ? 'ko-KR' : 'en',
    about: post.topic,
    keywords: post.tags.join(', '),
    timeRequired: `PT${post.readingTime}M`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    author: {
      '@type': 'Person',
      name: lang === 'ko' ? site.authorKo : site.author,
      url: site.portfolio,
      sameAs: [site.portfolio, site.github],
    },
    publisher: {
      '@type': 'Person',
      name: lang === 'ko' ? site.authorKo : site.author,
      url: site.portfolio,
    },
    isPartOf: {
      '@type': 'Blog',
      name: site.title[lang],
      url: `${site.url}/${lang}`,
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema(post, lang)) }}
      />
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
          {/* The close, on every post — see .end in post.module.css. */}
          <p className={styles.end}>
            {t.theEnd[lang as Lang]}
            <span className={styles.endDot} data-dot-end aria-hidden />
          </p>
        </div>
      </article>

      {/* What to read next, before the way out. */}
      <PostNav neighbours={getNeighbours(slug, lang as Lang)} lang={lang as Lang} />

      <footer className={styles.footer}>
        <Link href={`/${lang}`} className={styles.back}>
          ← {t.backToIndex[lang]}
        </Link>
        <span>{lang === 'ko' ? site.authorKo : site.author}</span>
      </footer>
    </main>
  );
}
