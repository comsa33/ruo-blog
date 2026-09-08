'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ReadingRuler.module.css';

type Tick = {
  /** Absolute document offset of the block this tick stands for. */
  top: number;
  height: number;
  major: boolean;
  label: string;
  id: string;
};

/** Ruler ticks stay legible up to roughly this many; beyond it we sample. */
const MAX_TICKS = 42;

export function ReadingRuler() {
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [active, setActive] = useState(0);
  const ticksRef = useRef<Tick[]>([]);

  useEffect(() => {
    const article = document.querySelector('article');
    if (!article) return;

    const build = () => {
      // Direct children of the prose container are the blocks a reader moves
      // through: paragraphs, figures, lists, headings.
      const prose = article.querySelector<HTMLElement>('[data-prose]') ?? article;
      const blocks = Array.from(prose.children) as HTMLElement[];

      let current = '';
      const all: Tick[] = [];
      for (const el of blocks) {
        const isHeading = el.tagName === 'H2';
        if (isHeading) current = el.textContent ?? '';
        const rect = el.getBoundingClientRect();
        all.push({
          top: rect.top + window.scrollY,
          height: rect.height,
          major: isHeading,
          label: isHeading ? (el.textContent ?? '') : current,
          id: el.id || '',
        });
      }

      // Keep every heading; thin the paragraphs if the ruler would overflow.
      let kept = all;
      if (all.length > MAX_TICKS) {
        const minors = all.filter((t) => !t.major);
        const keepEvery = Math.ceil(minors.length / (MAX_TICKS - all.filter((t) => t.major).length));
        let seen = 0;
        kept = all.filter((t) => (t.major ? true : seen++ % keepEvery === 0));
      }

      ticksRef.current = kept;
      setTicks(kept);
    };

    build();

    const onScroll = () => {
      const list = ticksRef.current;
      if (!list.length) return;
      // The reading line is where the eye is; find the block sitting under it.
      const lineY = window.scrollY + window.innerHeight * 0.44;
      let idx = 0;
      for (let i = 0; i < list.length; i++) {
        if (list[i].top <= lineY) idx = i;
        else break;
      }
      setActive(idx);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const ro = new ResizeObserver(() => {
      build();
      onScroll();
    });
    ro.observe(document.body);

    return () => {
      window.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, []);

  if (ticks.length < 3) return null;

  return (
    <div className={styles.root} aria-hidden>
      <nav className={styles.ruler}>
        {ticks.map((t, i) => (
          <span
            key={i}
            className={[
              styles.tick,
              t.major ? styles.major : '',
              i === active ? styles.active : '',
            ].join(' ')}
            onClick={() =>
              window.scrollTo({ top: t.top - window.innerHeight * 0.36, behavior: 'smooth' })
            }
          >
            <span className={styles.bar} />
            {t.major && <span className={styles.label}>{t.label}</span>}
          </span>
        ))}
      </nav>
      <span className={styles.marker} />
      <span className={styles.line} />
    </div>
  );
}
