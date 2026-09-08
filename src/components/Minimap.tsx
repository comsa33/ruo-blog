'use client';

import { useEffect, useState } from 'react';
import styles from './Minimap.module.css';

type Heading = { id: string; text: string; level: 2 | 3 };

export function Minimap({ label }: { label: string }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLHeadingElement>('article h2[id], article h3[id]'),
    );
    setHeadings(
      nodes.map((n) => ({
        id: n.id,
        text: n.textContent ?? '',
        level: n.tagName === 'H2' ? 2 : 3,
      })),
    );

    // Track the heading nearest the top of the viewport rather than whichever
    // one happens to intersect: with short sections several are visible at once.
    const onScroll = () => {
      const offset = 120;
      let current = nodes[0]?.id ?? '';
      for (const n of nodes) {
        if (n.getBoundingClientRect().top <= offset) current = n.id;
        else break;
      }
      setActiveId(current);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (headings.length < 2) return null;

  return (
    <nav className={styles.wrap} aria-label={label}>
      {headings.map((h) => (
        <a
          key={h.id}
          href={`#${h.id}`}
          className={[
            styles.item,
            h.level === 2 ? styles.h2 : styles.h3,
            activeId === h.id ? styles.active : '',
          ].join(' ')}
        >
          <span className={styles.label}>{h.text}</span>
          <span className={styles.line} />
        </a>
      ))}
    </nav>
  );
}
