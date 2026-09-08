'use client';

import { useEffect, useState } from 'react';
import { t, type Lang } from '@/lib/site';
import styles from './Views.module.css';

type Counts = { total: number; today: number };

/**
 * The view count in a post's meta line: `1,284회 · 오늘 32`.
 *
 * Date and reading time are in the HTML; this arrives after. So the space is
 * reserved at its final width and the number resolves into it with the house
 * entrance — no spinner, no layout shift. If the store is not configured the
 * whole clause, separator included, stays out of the line.
 */
export function Views({ slug, lang }: { slug: string; lang: Lang }) {
  // undefined: waiting · null: unavailable · Counts: arrived
  const [counts, setCounts] = useState<Counts | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/views/${slug}`, { method: 'POST' })
      .then((res) => (res.ok ? (res.json() as Promise<Counts>) : null))
      .then((c) => {
        if (!cancelled) setCounts(c);
      })
      .catch(() => {
        if (!cancelled) setCounts(null);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (counts === null) return null;

  const fmt = new Intl.NumberFormat(lang === 'ko' ? 'ko-KR' : 'en-US');

  return (
    <>
      <span aria-hidden>·</span>
      {counts === undefined ? (
        <span className={styles.reserved} aria-hidden />
      ) : (
        <span className={`${styles.views} rise`} tabIndex={0}>
          <span>
            {fmt.format(counts.total)}
            {t.views[lang]}
          </span>
          {/* Zero is not information; the clause goes rather than reading "오늘 0". */}
          {counts.today > 0 && (
            <span>
              · {t.today[lang]} {fmt.format(counts.today)}
            </span>
          )}
          <span className={styles.basis} role="tooltip">
            {t.viewsBasis[lang]}
          </span>
        </span>
      )}
    </>
  );
}
