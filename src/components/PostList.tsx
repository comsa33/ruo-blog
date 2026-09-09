'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDate } from '@/lib/date';
import { TravelingDot } from './TravelingDot';
import type { PostMeta } from '@/lib/posts';
import { t, type Lang } from '@/lib/site';
import styles from './PostList.module.css';

/**
 * The index list with search folded in.
 *
 * The field is not a box: it is the hairline that already sat above the first
 * row, and focus lights that line. Filtering runs over the frontmatter the
 * page already carries — title, description, topic, tags — so there is no
 * index to fetch and nothing to wait for. Body text is deliberately not
 * searched; that would need a real index and a server.
 *
 * The URL is the state. A tag on a post page links to `/ko?q=설계`, and typing
 * here rewrites the query string, so a search survives reload and back.
 */

function matches(post: PostMeta, q: string) {
  const hay = [post.title, post.description, post.topic, ...post.tags].join(' ').toLowerCase();
  return hay.includes(q.toLowerCase());
}

/** The query is marked, not bolded — a weight change would shift the line. */
function Marked({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className={styles.mark}>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

/** `2026 · 09` — the rail marker. Digits only, so it reads in both languages. */
function monthOf(date: string) {
  return `${date.slice(0, 4)} · ${date.slice(5, 7)}`;
}

function Row({
  post,
  lang,
  q,
  active,
  i,
  entering,
}: {
  post: PostMeta;
  lang: Lang;
  q: string;
  active: boolean;
  i: number;
  entering: boolean;
}) {
  return (
    <li className={entering ? 'rise' : undefined} style={{ '--i': i } as React.CSSProperties}>
      <Link href={`/${lang}/${post.slug}`} className={styles.row} data-active={active || undefined}>
        <div>
          {post.topic && (
            <span className={styles.rowTopic}>
              <Marked text={post.topic} q={q} />
            </span>
          )}
          {/* The keyboard cursor is the travelling dot; the title opens its slot. */}
          <h3 className={styles.rowTitle} data-dot="" data-dot-active={active || undefined}>
            <Marked text={post.title} q={q} />
            <span className={styles.arrow} aria-hidden>
              →
            </span>
          </h3>
          {post.description && (
            <p className={styles.rowDesc}>
              <Marked text={post.description} q={q} />
            </p>
          )}
        </div>
        <span className={styles.meta}>{formatDate(post.date, lang)}</span>
      </Link>
    </li>
  );
}

export function PostList({ posts, lang }: { posts: PostMeta[]; lang: Lang }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  // Rows stagger in once, on arrival. Once the reader has touched the list
  // they must not re-enter on every keystroke.
  const [touched, setTouched] = useState(false);

  // Arriving with ?q= — from a tag on a post page, or a shared link.
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('q');
    if (initial) {
      setQ(initial);
      setTouched(true);
    }
  }, []);

  // Mirror the query into the URL without adding history entries.
  useEffect(() => {
    if (!touched) return;
    const url = new URL(window.location.href);
    const query = q.trim();
    if (query) url.searchParams.set('q', query);
    else url.searchParams.delete('q');
    window.history.replaceState(window.history.state, '', url);
  }, [q, touched]);

  // ⌘K / Ctrl+K reaches the field from anywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const query = q.trim();
  const shown = useMemo(
    () => (query ? posts.filter((p) => matches(p, query)) : posts),
    [posts, query],
  );
  const active = query && shown.length ? Math.min(sel, shown.length - 1) : -1;

  // Consecutive posts sharing a month share a rail marker. Posts arrive newest
  // first, so grouping in order is grouping by month.
  const groups = useMemo(() => {
    const out: { month: string; posts: PostMeta[] }[] = [];
    for (const post of shown) {
      const month = monthOf(post.date);
      const last = out[out.length - 1];
      if (last && last.month === month) last.posts.push(post);
      else out.push({ month, posts: [post] });
    }
    return out;
  }, [shown]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, Math.max(0, shown.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      router.push(`/${lang}/${shown[active].slug}`);
    } else if (e.key === 'Escape') {
      if (q) setQ('');
      else inputRef.current?.blur();
      setSel(0);
    }
  };

  let n = 0;

  return (
    <div className={styles.root}>
      <TravelingDot mode="cursor" />
      <div className={`${styles.search} rise`} style={{ '--i': 2 } as React.CSSProperties}>
        <svg
          className={styles.glyph}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5 14 14" />
        </svg>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSel(0);
            setTouched(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={t.search[lang]}
          aria-label={t.search[lang]}
          autoComplete="off"
          spellCheck={false}
        />
        {query ? (
          <span className={styles.count} aria-live="polite">
            {shown.length}
            {t.found[lang]}
          </span>
        ) : (
          <kbd className={styles.kbd}>⌘K</kbd>
        )}
      </div>

      {query && <p className={styles.scope}>{t.searchScope[lang]}</p>}

      {shown.length ? (
        <ul className={styles.list}>
          {groups.map((g) => (
            <li key={g.month} className={styles.group}>
              <span className={styles.rail} aria-hidden>
                {g.month}
              </span>
              <ul className={styles.rows}>
                {g.posts.map((post) => {
                  const i = n++;
                  return (
                    <Row
                      key={post.slug}
                      post={post}
                      lang={lang}
                      q={query}
                      active={i === active}
                      i={i + 3}
                      entering={!touched}
                    />
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>{t.noMatch[lang]}</p>
      )}
    </div>
  );
}
