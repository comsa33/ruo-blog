import Link from 'next/link';
import type { Metadata } from 'next';
import { getPosts, groupByType, formatDate, type PostMeta } from '@/lib/posts';
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

function PostRow({ post, lang, i }: { post: PostMeta; lang: Lang; i: number }) {
  return (
    <li className="rise" style={{ '--i': i } as React.CSSProperties}>
      <Link href={`/${lang}/${post.slug}`} className={styles.row}>
        <div>
          {post.topic && <span className={styles.rowTopic}>{post.topic}</span>}
          <h3 className={styles.rowTitle}>
            {post.title}
            <span className={styles.arrow} aria-hidden>
              →
            </span>
          </h3>
          {post.description && <p className={styles.rowDesc}>{post.description}</p>}
        </div>
        <span className={styles.meta}>{formatDate(post.date, lang)}</span>
      </Link>
    </li>
  );
}

export default async function IndexPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const { note, log } = groupByType(getPosts(lang));

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <h1 className={`${styles.title} rise`}>{site.title[lang]}</h1>
        <p className={`${styles.subtitle} rise`} style={{ '--i': 1 } as React.CSSProperties}>
          {site.description[lang]}
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.notesHeading[lang]}</h2>
        {note.length ? (
          <ul className={styles.list}>
            {note.map((p, i) => (
              <PostRow key={p.slug} post={p} lang={lang} i={i + 2} />
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>{t.empty[lang]}</p>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.logHeading[lang]}</h2>
        {log.length ? (
          <ul className={styles.list}>
            {log.map((p, i) => (
              <PostRow key={p.slug} post={p} lang={lang} i={i + 2} />
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>{t.empty[lang]}</p>
        )}
      </section>
    </main>
  );
}
