'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { formatDate } from '@/lib/date';
import { TravelingDot } from './TravelingDot';
import { PostAxis } from './PostAxis';
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

/** Between one letter leaving and the next. Tight, so a word is gone in ~300ms. */
const VANISH_STEP_MS = 16;

/** Words past this all move together; the stagger stays under half a second. */
const WORD_CAP = 30;
/** The pointer has to rest on a row this long before its text turns. */
const HOVER_INTENT_MS = 200;
/** Where in the viewport a row counts as "being read" — the dot's own line. */
const READ_AT = 0.44;
/** How long the edge takes to cross the row. */
const EDGE_MS = 840;
/** On a touch device the row has to sit on the line this long before it turns.
 *  Without it the swap fires every frame of a flick, row after row, and reads
 *  as a glitch rather than as an answer to where the reader stopped. */
const SCROLL_INTENT_MS = 180;

/** The site's ease-out, as a function — the edge decelerates like everything
 *  else here does. */
const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);

/**
 * A run of text as words, each its own inline-block with an order, so the
 * summary and the opening can trade places one word at a time. A multi-word
 * query is marked word by word — the line is split anyway.
 */
function Words({ text, q }: { text: string; q?: string }) {
  const tokens = q ? q.toLowerCase().split(/\s+/).filter(Boolean) : [];
  return text.split(' ').map((word, i) => {
    const lower = word.toLowerCase();
    const hit = tokens.find((t) => lower.includes(t));
    return (
      <Fragment key={i}>
        {i > 0 && ' '}
        <span className={styles.w} style={{ '--i': Math.min(i, WORD_CAP) } as React.CSSProperties}>
          {hit ? <Marked text={word} q={hit} /> : word}
        </span>
      </Fragment>
    );
  });
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
  index,
  i,
  entering,
  onHover,
}: {
  post: PostMeta;
  lang: Lang;
  q: string;
  active: boolean;
  /** Position in the list — what the hover reports. */
  index: number;
  /** Entrance order; the rows follow the hero and the axis in. */
  i: number;
  entering: boolean;
  /** Absent on devices without hover, so a tap never leaves a row "hovered". */
  onHover?: (i: number) => void;
}) {
  // One edge crosses the box: ahead of it the summary, behind it the opening.
  // It is driven here rather than by a CSS transition because the masks, the
  // blur band and the accent line all read the same position, and a class
  // change cannot keep three of them in step through a reversal.
  const rowRef = useRef<HTMLAnchorElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const row = rowRef.current;
    const slot = slotRef.current;
    if (!row || !slot) return;
    // A row that has never been active must not animate its way to a standstill
    // on mount — it simply is at rest.
    if (!active && !started.current) return;
    started.current = true;

    row.setAttribute('data-dir', active ? 'fwd' : 'back');
    row.setAttribute('data-run', '');

    const from = parseFloat(getComputedStyle(slot).getPropertyValue('--edge')) || 0;
    const to = active ? 100 : 0;

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      slot.style.setProperty('--edge', String(to));
      if (!active) row.removeAttribute('data-run');
      return;
    }

    let frame = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / EDGE_MS);
      slot.style.setProperty('--edge', String(from + (to - from) * easeOut(k)));
      if (k < 1) frame = requestAnimationFrame(tick);
      // The row is only "running" while the edge is somewhere in the middle of
      // it; once home again it goes back to being an ordinary row.
      else if (!active) row.removeAttribute('data-run');
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  // The opening is clamped to exactly as many lines as the summary takes, so
  // the row never changes height. Measured, since that depends on the width.
  const descRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    const measure = () => {
      const lh = parseFloat(getComputedStyle(el).lineHeight) || 22.4;
      el.parentElement?.style.setProperty(
        '--lines',
        String(Math.max(1, Math.round(el.offsetHeight / lh))),
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <li
      id={`post-${post.slug}`}
      data-row={index}
      className={entering ? 'rise' : undefined}
      style={{ '--i': i } as React.CSSProperties}
    >
      <Link
        ref={rowRef}
        href={`/${lang}/${post.slug}`}
        className={styles.row}
        data-active={active || undefined}
        onPointerEnter={onHover && (() => onHover(index))}
      >
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
            <div ref={slotRef} className={styles.slot}>
              <p ref={descRef} className={styles.rowDesc}>
                <Words text={post.description} q={q} />
              </p>
              {/* The post's first paragraphs, in the summary's place while the
                  row holds the dot. Same lines, same height. */}
              {post.excerpt && (
                <>
                  <p className={styles.rowPeek} aria-hidden>
                    <Words text={post.excerpt} />
                  </p>
                  {/* The band blurs whatever is behind it; the line is the
                      boundary itself. Both ride --edge. */}
                  <span className={styles.blurBand} aria-hidden />
                  <span className={styles.edge} aria-hidden />
                </>
              )}
            </div>
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
  // The row under the pointer, and the one the axis was clicked on. Either
  // takes the dot; the keyboard cursor has it otherwise.
  const [hover, setHover] = useState(-1);
  const [pinned, setPinned] = useState(-1);
  const pinTimer = useRef(0);
  // Esc does not blank the field — the letters leave one at a time first.
  const [vanishing, setVanishing] = useState(false);
  const vanishTimer = useRef(0);
  // Which pointer this device has. With a hover, the pointer is the mouse and
  // a row has to be rested on for a moment. Without one, the pointer is the
  // scroll: the row on the reading line is the one that holds the dot.
  const [hoverable, setHoverable] = useState<boolean | null>(null);
  const hoverTimer = useRef(0);
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    setHoverable(matchMedia('(hover: hover)').matches);
    return () => {
      window.clearTimeout(pinTimer.current);
      window.clearTimeout(vanishTimer.current);
      window.clearTimeout(hoverTimer.current);
    };
  }, []);

  const hoverAt = (i: number) => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setHover(i), HOVER_INTENT_MS);
  };
  const hoverOff = () => {
    window.clearTimeout(hoverTimer.current);
    setHover(-1);
  };

  useEffect(() => {
    if (hoverable !== false) return;
    let frame = 0;
    // The row the line is over right now, which is not yet the row that turns.
    let candidate = -1;
    let settle = 0;
    const place = () => {
      frame = 0;
      const list = listRef.current;
      if (!list) return;
      const lineY = window.innerHeight * READ_AT;
      let found = -1;
      for (const el of list.querySelectorAll<HTMLElement>('[data-row]')) {
        const r = el.getBoundingClientRect();
        if (r.top <= lineY && lineY < r.bottom) {
          found = Number(el.dataset.row);
          break;
        }
      }
      if (found === candidate) return;
      candidate = found;
      // The mouse has to rest on a row before it turns; a finger should not be
      // held to a lesser standard. Rows crossed mid-flick never come up at all,
      // so the text only changes where the reader actually stopped.
      window.clearTimeout(settle);
      settle = window.setTimeout(() => setHover(found), SCROLL_INTENT_MS);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(place);
    };
    place();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(settle);
    };
  }, [hoverable]);

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
  // Where the dot goes: the pointer wins, then an axis pick, then the keyboard.
  const cursor = hover >= 0 ? hover : pinned >= 0 ? pinned : active;
  const shownSlugs = useMemo(() => new Set(shown.map((p) => p.slug)), [shown]);

  /** From the axis: bring the row into view and send the dot to it. */
  const pick = (slug: string) => {
    const i = shown.findIndex((p) => p.slug === slug);
    if (i < 0) return;
    document
      .getElementById(`post-${slug}`)
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setPinned(i);
    window.clearTimeout(pinTimer.current);
    pinTimer.current = window.setTimeout(() => setPinned(-1), 1600);
  };

  /** Esc with a query: the letters leave in order, then the field is empty. */
  const vanish = () => {
    if (vanishing) return;
    setVanishing(true);
    const n = Array.from(q).length;
    vanishTimer.current = window.setTimeout(
      () => {
        setQ('');
        setSel(0);
        setVanishing(false);
      },
      VANISH_STEP_MS * (n - 1) + 200,
    );
  };

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
    // A Korean syllable is still composing after its first jamo. Chrome then
    // delivers an arrow twice — once to end the composition (keyCode 229), once
    // for real — and the cursor jumped two rows. Only the real one counts.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, Math.max(0, shown.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      router.push(`/${lang}/${shown[active].slug}`);
    } else if (e.key === 'Escape') {
      if (q) vanish();
      else inputRef.current?.blur();
    }
  };

  let n = 0;

  return (
    <div className={styles.root}>
      <TravelingDot mode="cursor" />
      <div className="rise" style={{ '--i': 2 } as React.CSSProperties}>
        <PostAxis posts={posts} shown={shownSlugs} lang={lang} onPick={pick} />
      </div>
      <div className={`${styles.search} rise`} style={{ '--i': 3 } as React.CSSProperties}>
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
        <span className={styles.field}>
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            value={q}
            data-vanishing={vanishing || undefined}
            onChange={(e) => {
              if (vanishing) return;
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
          {/* The letters, laid over the (now invisible) input, leaving in order. */}
          {vanishing && (
            <span className={styles.ghost} aria-hidden>
              {Array.from(q).map((c, i) => (
                <span
                  key={i}
                  className={styles.letter}
                  style={{ '--d': `${i * VANISH_STEP_MS}ms` } as React.CSSProperties}
                >
                  {c === ' ' ? '\u00A0' : c}
                </span>
              ))}
            </span>
          )}
        </span>
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
        <ul ref={listRef} className={styles.list} onPointerLeave={hoverable ? hoverOff : undefined}>
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
                      active={i === cursor}
                      index={i}
                      i={i + 4}
                      entering={!touched}
                      onHover={hoverable ? hoverAt : undefined}
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
