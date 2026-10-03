'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './Calibration.module.css';

export type CalibrationRow = {
  /** The confidence band, e.g. "0.70–0.90". */
  band: string;
  /** Average confidence the model reported in that band, 0–1. */
  said: number;
  /** Share of those answers that were right, 0–1. */
  right: number;
};

type Props = {
  caption: string;
  rows: CalibrationRow[];
  saidLabel: string;
  rightLabel: string;
  source: string;
};

/*
 * A reliability table drawn as paired bars: what the model said against how
 * often it was right. A calibrated model's two bars end at the same place; the
 * gap between them is the overconfidence.
 */
export function Calibration({ caption, rows, saidLabel, rightLabel, source }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <figure ref={ref} className={`${styles.wrap} ${shown ? styles.shown : ''}`}>
      <div className={styles.head}>
        <div className={styles.caption}>{caption}</div>
        <div className={styles.legend}>
          <span className={styles.keySaid} /> {saidLabel}
          <span className={styles.keyRight} /> {rightLabel}
        </div>
      </div>

      <div className={styles.rows}>
        {rows.map((r, i) => (
          <div key={r.band} className={styles.row} style={{ ['--i' as string]: i }}>
            <div className={styles.band}>{r.band}</div>
            <div className={styles.bars}>
              <div className={styles.track}>
                <span className={styles.said} style={{ width: `${r.said * 100}%` }} />
                <span className={styles.right} style={{ width: `${r.right * 100}%` }} />
              </div>
            </div>
            <div className={styles.values}>
              <span>{Math.round(r.said * 100)}%</span>
              <span className={styles.arrow}>→</span>
              <span className={styles.rightValue}>
                {(r.right * 100).toFixed((r.right * 100) % 1 ? 1 : 0)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.source}>{source}</div>
    </figure>
  );
}
