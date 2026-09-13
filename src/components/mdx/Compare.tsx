'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './Compare.module.css';

type Props = {
  caption: string;
  beforeLabel: string;
  afterLabel: string;
  before: number;
  after: number;
  /** Display strings; fall back to the raw numbers. */
  beforeText?: string;
  afterText?: string;
  note?: string;
  /** Lower is better — flips which bar reads as the win. */
  lowerIsBetter?: boolean;
};

export function Compare({
  caption,
  beforeLabel,
  afterLabel,
  before,
  after,
  beforeText,
  afterText,
  note,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  // Bars fill when they enter the viewport, not on mount — otherwise the
  // animation is over before the reader scrolls to it.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const max = Math.max(before, after) || 1;
  const pct = (v: number) => `${Math.round((v / max) * 100)}%`;

  return (
    // A figure like every other diagram, so the media bleed in post.module.css
    // picks it up. As a div it silently stayed at prose width while the rest
    // of the kit ran to the frame.
    <figure
      className={`${styles.wrap} ${visible ? styles.visible : ''}`}
      ref={ref as React.RefObject<HTMLElement>}
    >
      <div className={styles.caption}>{caption}</div>

      <div className={styles.row}>
        <span className={styles.label}>{beforeLabel}</span>
        <div className={styles.track}>
          <div className={styles.fill} style={{ '--w': pct(before) } as React.CSSProperties} />
        </div>
        <span className={styles.value}>{beforeText ?? before.toLocaleString()}</span>
      </div>

      <div className={`${styles.row} ${styles.after}`}>
        <span className={styles.label}>{afterLabel}</span>
        <div className={styles.track}>
          <div className={styles.fill} style={{ '--w': pct(after) } as React.CSSProperties} />
        </div>
        <span className={styles.value}>{afterText ?? after.toLocaleString()}</span>
      </div>

      {note && <p className={styles.delta} dangerouslySetInnerHTML={{ __html: note }} />}
    </figure>
  );
}
