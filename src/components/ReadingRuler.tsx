'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ReadingRuler.module.css';

type Tick = {
  /** Absolute document offset of the block this tick stands for. */
  top: number;
  major: boolean;
  label: string;
};

/** Ruler ticks stay legible up to roughly this many; beyond it we sample. */
const MAX_TICKS = 42;
/** Where in the viewport a block counts as "being read". */
const READ_AT = 0.42;
/** Rows either side of the pointer that respond to it. */
const FALLOFF = 4.5;
/** Where the line sits when there is no ruler to anchor it to. */
const FIXED_LINE = 0.62;

export function ReadingRuler({ nextLabel, topLabel }: { nextLabel: string; topLabel: string }) {
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [active, setActive] = useState(0);
  const [atEnd, setAtEnd] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLElement>(null);
  const ticksRef = useRef<Tick[]>([]);

  useEffect(() => {
    const article = document.querySelector('article');
    if (!article) return;

    const build = () => {
      const prose = article.querySelector<HTMLElement>('[data-prose]') ?? article;
      const blocks = Array.from(prose.children) as HTMLElement[];

      let heading = '';
      const all: Tick[] = [];
      for (const el of blocks) {
        const isHeading = el.tagName === 'H2';
        if (isHeading) heading = el.textContent ?? '';
        all.push({
          top: el.getBoundingClientRect().top + window.scrollY,
          major: isHeading,
          label: heading,
        });
      }

      // Keep every heading; thin the paragraphs if the ruler would overflow.
      let kept = all;
      if (all.length > MAX_TICKS) {
        const majors = all.filter((t) => t.major).length;
        const every = Math.ceil((all.length - majors) / Math.max(1, MAX_TICKS - majors));
        let seen = 0;
        kept = all.filter((t) => (t.major ? true : seen++ % every === 0));
      }

      ticksRef.current = kept;
      setTicks(kept);
    };

    /**
     * The ruler stays put. The active tick descends through it as the reader
     * progresses, and the guide line is drawn at that tick's height — so the
     * line, the marker and the tick always meet.
     */
    const position = () => {
      const list = ticksRef.current;
      const ruler = rulerRef.current;
      if (!list.length || !ruler) return;

      const readY = window.scrollY + window.innerHeight * READ_AT;
      let idx = 0;
      for (let i = 0; i < list.length; i++) {
        if (list[i].top <= readY) idx = i;
        else break;
      }
      setActive(idx);

      // With a ruler on screen the line is drawn at the active tick, so the
      // two always meet. Without one — narrow screens hide it — there is
      // nothing to anchor to, and reading the hidden node would return 0 and
      // park the line off the top of the page. Fall back to a fixed height.
      const row = ruler.children[idx] as HTMLElement | undefined;
      // offsetParent is null for any position: fixed element, visible or not,
      // so it cannot answer this question — it silently reported the ruler as
      // hidden at every width and pinned the line to the fallback height.
      const visible = getComputedStyle(ruler).display !== 'none';
      // Measure the bar, not the row that holds it. The row carries the tick's
      // hit area and is several pixels tall with the 1px bar centred in it, so
      // anchoring to the row's top draws the line above the bar it is supposed
      // to meet. Taking the bar's own centre survives any change to that
      // padding — which is what went wrong when the hit area was introduced.
      const bar = (row?.firstElementChild as HTMLElement | null) ?? row ?? null;
      const rect = bar?.getBoundingClientRect();
      const y =
        visible && rect ? rect.top + rect.height / 2 : window.innerHeight * FIXED_LINE;
      // --line-y is the centre both the line and the marker sit on; each pulls
      // itself up by half its own height. Rounding it to a whole pixel put the
      // 1px line one pixel below the 1px bar, so the two ran as neighbours
      // rather than as one line. Half-pixel centres are what land a 1px rule on
      // an exact device pixel here, so the value is left alone.
      rootRef.current?.style.setProperty('--line-y', `${y}px`);

      // Once the last section is reached the action turns into "back to top".
      const doc = document.documentElement;
      setAtEnd(window.scrollY + window.innerHeight >= doc.scrollHeight - 240);
    };

    build();
    position();

    window.addEventListener('scroll', position, { passive: true });
    window.addEventListener('resize', position);
    const ro = new ResizeObserver(() => {
      build();
      position();
    });
    ro.observe(document.body);

    return () => {
      window.removeEventListener('scroll', position);
      window.removeEventListener('resize', position);
      ro.disconnect();
    };
  }, []);

  /**
   * Pointer proximity. Written straight to the DOM on every move: this is a
   * per-frame value and routing it through React state would only cost frames.
   */
  useEffect(() => {
    const ruler = rulerRef.current;
    if (!ruler) return;

    let frame = 0;
    let pointerY = 0;

    const paint = () => {
      frame = 0;
      const rows = Array.from(ruler.children) as HTMLElement[];
      for (const row of rows) {
        const r = row.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - pointerY) / 9; // 9px row pitch
        // Smooth, bounded falloff — 1 under the pointer, 0 by FALLOFF rows out.
        const near = Math.max(0, 1 - (d / FALLOFF) ** 2);
        row.style.setProperty('--near', near.toFixed(3));
      }
    };

    const onMove = (e: PointerEvent) => {
      pointerY = e.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const onLeave = () => {
      const rows = Array.from(ruler.children) as HTMLElement[];
      for (const row of rows) row.style.setProperty('--near', '0');
    };

    /* While the pointer is actually inside the ruler, the article steps back so
     * the section names read — the same move the index makes when one row is
     * hovered. The flag goes on the document because the ruler does not wrap
     * the article, so :has() cannot reach it; globals.css owns the rule.
     * Deliberately driven by enter/leave and not by --near: proximity is
     * continuous and would flicker the whole page for a pointer merely
     * crossing the gutter on its way somewhere else. */
    const setEngaged = (on: boolean) => {
      if (on) document.documentElement.dataset.rulerHover = '';
      else delete document.documentElement.dataset.rulerHover;
    };
    const onEnter = () => setEngaged(true);
    const onLeaveAll = () => {
      setEngaged(false);
      onLeave();
    };

    ruler.addEventListener('pointerenter', onEnter);
    ruler.addEventListener('pointermove', onMove);
    ruler.addEventListener('pointerleave', onLeaveAll);
    return () => {
      ruler.removeEventListener('pointerenter', onEnter);
      ruler.removeEventListener('pointermove', onMove);
      ruler.removeEventListener('pointerleave', onLeaveAll);
      if (frame) cancelAnimationFrame(frame);
      setEngaged(false);
    };
  }, [ticks.length]);

  const enough = ticks.length >= 3;

  /** The next heading after the one being read, if there is one. */
  const nextMajor = ticks.slice(active + 1).find((t) => t.major);

  const jump = () => {
    if (atEnd || !nextMajor) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.scrollTo({
      top: nextMajor.top - window.innerHeight * (READ_AT - 0.06),
      behavior: 'smooth',
    });
  };

  const showTop = atEnd || !nextMajor;

  return (
    <div className={styles.root} ref={rootRef} data-ready={enough || undefined}>
      <nav className={styles.ruler} ref={rulerRef as React.RefObject<HTMLElement>} aria-hidden>
        {ticks.map((t, i) => (
          <span
            key={i}
            className={[
              styles.tick,
              t.major ? styles.major : '',
              i === active ? styles.active : '',
            ].join(' ')}
            onClick={() =>
              window.scrollTo({ top: t.top - window.innerHeight * (READ_AT - 0.06), behavior: 'smooth' })
            }
          >
            <span className={styles.bar} />
            {t.major && <span className={styles.label}>{t.label}</span>}
          </span>
        ))}
      </nav>
      {enough && <span className={styles.marker} />}
      {enough && <span className={styles.line} />}
      {enough && (
        <button className={styles.action} onClick={jump} aria-hidden={false}>
          {showTop ? topLabel : nextLabel}
          <span className={styles.actionArrow} aria-hidden>
            {showTop ? '↑' : '↓'}
          </span>
        </button>
      )}
    </div>
  );
}
