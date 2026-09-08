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

export function ReadingRuler() {
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [active, setActive] = useState(0);

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

      const row = ruler.children[idx] as HTMLElement | undefined;
      if (row) {
        const y = row.getBoundingClientRect().top + 0.5;
        rootRef.current?.style.setProperty('--line-y', `${Math.round(y)}px`);
      }
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

    ruler.addEventListener('pointermove', onMove);
    ruler.addEventListener('pointerleave', onLeave);
    return () => {
      ruler.removeEventListener('pointermove', onMove);
      ruler.removeEventListener('pointerleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ticks.length]);

  const enough = ticks.length >= 3;

  return (
    <div className={styles.root} ref={rootRef} aria-hidden data-ready={enough || undefined}>
      <nav className={styles.ruler} ref={rulerRef as React.RefObject<HTMLElement>}>
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
    </div>
  );
}
