'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Neighbour } from '@/lib/posts';
import { formatDate } from '@/lib/date';
import { t, type Lang } from '@/lib/site';
import { useEdgeReveal, useSameHeight } from './useEdgeReveal';
import rowStyles from './PostList.module.css';
import styles from './PostNav.module.css';

/** Where in the viewport a row counts as "being read" — the dot's own line. */
const READ_AT = 0.44;

function label(kind: Neighbour['kind'], lang: Lang) {
  if (kind === 'topic') return t.sameTopic[lang];
  return kind === 'prev' ? t.olderPost[lang] : t.newerPost[lang];
}

function NavRow({ neighbour, lang }: { neighbour: Neighbour; lang: Lang }) {
  const { post, kind } = neighbour;

  // With a pointer the row answers to hover. Without one it answers to the
  // scroll, exactly as the index does: the row resting on the reading line is
  // the one that opens.
  const [active, setActive] = useState(false);
  const { rowRef, slotRef } = useEdgeReveal<HTMLAnchorElement>(active);
  const descRef = useSameHeight(slotRef);

  useEffect(() => {
    if (matchMedia('(hover: hover)').matches) return;
    const el = rowRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), {
      rootMargin: `-${READ_AT * 100}% 0px -${100 - READ_AT * 100 - 10}% 0px`,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [rowRef]);

  return (
    <Link
      ref={rowRef}
      href={`/${lang}/${post.slug}`}
      className={rowStyles.row}
      data-nav-row=""
      onPointerEnter={() => matchMedia('(hover: hover)').matches && setActive(true)}
      onPointerLeave={() => matchMedia('(hover: hover)').matches && setActive(false)}
    >
      <div>
        <span className={rowStyles.rowTopic}>
          <span className={styles.kind}>{label(kind, lang)}</span>
          {post.topic}
        </span>
        {/* A span, not a heading: this sits outside the article and must not
            turn up as an anchor for the travelling dot or the ruler. */}
        <span className={rowStyles.rowTitle}>
          {post.title}
          <span className={rowStyles.arrow} aria-hidden>
            →
          </span>
        </span>
        {post.description && (
          <div ref={slotRef} className={rowStyles.slot}>
            <p ref={descRef} className={rowStyles.rowDesc}>
              {post.description}
            </p>
            {post.excerpt && (
              <>
                <p className={rowStyles.rowPeek} aria-hidden>
                  {post.excerpt}
                </p>
                <span className={rowStyles.blurBand} aria-hidden>
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
                <span className={rowStyles.edge} aria-hidden />
              </>
            )}
          </div>
        )}
      </div>
      <span className={rowStyles.meta}>{formatDate(post.date, lang)}</span>
    </Link>
  );
}

export function PostNav({ neighbours, lang }: { neighbours: Neighbour[]; lang: Lang }) {
  if (!neighbours.length) return null;
  return (
    <nav className={styles.nav} aria-label={t.readNext[lang]}>
      {neighbours.map((n) => (
        <NavRow key={n.post.slug} neighbour={n} lang={lang} />
      ))}
    </nav>
  );
}
