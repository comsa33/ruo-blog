'use client';

import { useMemo, useState } from 'react';
import { t, type Lang } from '@/lib/site';
import styles from './PostAxis.module.css';

type AxisPost = { slug: string; date: string; title: string };

const DAY = 86_400_000;
/** Farther than this from any tick, the pointer is over nothing. */
const REACH_PX = 60;
/** Ticks this close to the pointer grow towards it; same falloff as the ruler. */
const FALLOFF_PX = 48;

const utc = (date: string) => Date.parse(`${date}T00:00:00Z`);

/**
 * One tick per post on a year axis, under the hero. The month rail says which
 * month a post belongs to; this says when, and how often, in one line.
 *
 * Pointer only. Ticks near the pointer grow, the nearest turns to the accent
 * and names its post, and a click hands that post to the list, which scrolls
 * to the row and sends the dot there. The list stays the accessible thing —
 * this is `aria-hidden`, and keyboard readers already have ↑↓ in the search.
 */
export function PostAxis({
  posts,
  shown,
  lang,
  onPick,
}: {
  posts: AxisPost[];
  /** Slugs currently in the list; the rest are drawn as dimmed ticks. */
  shown: Set<string>;
  lang: Lang;
  onPick: (slug: string) => void;
}) {
  const [near, setNear] = useState(-1);

  // From the first of the earliest month to the first of the month after the
  // latest, so the last tick never sits on the edge.
  const model = useMemo(() => {
    const dates = posts.map((p) => utc(p.date));
    const lo = new Date(Math.min(...dates));
    const hi = new Date(Math.max(...dates));
    const start = Date.UTC(lo.getUTCFullYear(), lo.getUTCMonth(), 1);
    const end = Date.UTC(hi.getUTCFullYear(), hi.getUTCMonth() + 1, 1);
    const span = end - start;
    const at = (ms: number) => ((ms - start) / span) * 100;

    const months: { x: number; label: string; quarter: boolean }[] = [];
    for (let i = 0, m = start; m < end; i++) {
      const d = new Date(m);
      months.push({
        x: at(m),
        label: `${String(d.getUTCFullYear()).slice(2)}·${String(d.getUTCMonth() + 1).padStart(2, '0')}`,
        quarter: i % 3 === 0,
      });
      m = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
    }
    const weeks: number[] = [];
    for (let w = start + 7 * DAY; w < end; w += 7 * DAY) weeks.push(at(w));

    const ticks = posts.map((p, i) => ({ x: at(dates[i]), ...p }));
    const first = new Date(start);
    const last = new Date(end - DAY);
    const range = `${first.getUTCFullYear()}.${String(first.getUTCMonth() + 1).padStart(2, '0')} – ${last.getUTCFullYear()}.${String(last.getUTCMonth() + 1).padStart(2, '0')}`;
    return { months, weeks, ticks, range };
  }, [posts]);

  /**
   * Proximity is written straight to the DOM: it is a per-frame value and
   * routing it through React would cost frames for nothing. Only the nearest
   * tick — a thing the label needs — is state.
   */
  const track = (e: React.PointerEvent<HTMLDivElement>) => {
    const axis = e.currentTarget;
    const x = e.clientX - axis.getBoundingClientRect().left;
    const ticks = axis.querySelectorAll<HTMLElement>('[data-tick]');
    let best = -1;
    let bestD = Infinity;
    ticks.forEach((el, i) => {
      const d = Math.abs(el.offsetLeft - x);
      el.style.setProperty('--near', Math.max(0, 1 - (d / FALLOFF_PX) ** 2).toFixed(3));
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    setNear(bestD <= REACH_PX ? best : -1);
  };

  const leave = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget
      .querySelectorAll<HTMLElement>('[data-tick]')
      .forEach((el) => el.style.setProperty('--near', '0'));
    setNear(-1);
  };

  const pick = () => {
    const tick = model.ticks[near];
    if (tick && shown.has(tick.slug)) onPick(tick.slug);
  };

  if (posts.length < 3) return null;

  const current = model.ticks[near];

  return (
    <div className={styles.root} aria-hidden>
      <div
        className={styles.axis}
        onPointerMove={track}
        onPointerDown={track}
        onPointerLeave={leave}
        onClick={pick}
      >
        {model.weeks.map((x, i) => (
          <span key={i} className={styles.week} style={{ left: `${x}%` }} />
        ))}
        {model.months.map((m) => (
          <span
            key={m.label}
            className={styles.month}
            data-quarter={m.quarter || undefined}
            style={{ left: `${m.x}%` }}
          >
            {m.label}
          </span>
        ))}
        {model.ticks.map((tick, i) => (
          <span
            key={tick.slug}
            data-tick
            className={styles.tick}
            data-on={i === near || undefined}
            data-dim={!shown.has(tick.slug) || undefined}
            style={{ left: `${tick.x}%` }}
          />
        ))}
      </div>
      <span className={styles.label} data-on={current ? '' : undefined}>
        {current
          ? `${current.date.replace(/-/g, '.')} · ${current.title}`
          : `${posts.length}${t.posts[lang]} · ${model.range} · ${t.axisHint[lang]}`}
      </span>
    </div>
  );
}
