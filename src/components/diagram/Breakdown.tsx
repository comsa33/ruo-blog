'use client';

import { useState } from 'react';
import styles from './Breakdown.module.css';

export type Segment = { label: string; value: number; note?: string };

type Props = {
  caption: string;
  segments: Segment[];
  unit?: string;
  /** Sentence shown before anything is hovered. */
  hint?: string;
};

export function Breakdown({ caption, segments, unit = '', hint }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const total = segments.reduce((s, x) => s + x.value, 0);
  const pct = (v: number) => (v / total) * 100;

  return (
    <figure className={styles.wrap} onMouseLeave={() => setActive(null)}>
      <div className={styles.caption}>
        {caption} · {total.toLocaleString()}
        {unit}
      </div>

      <div className={styles.bar}>
        {segments.map((s, i) => (
          <div
            key={s.label}
            className={[
              styles.seg,
              active === i ? styles.active : '',
              active !== null && active !== i ? styles.dimmed : '',
            ].join(' ')}
            style={{ width: `${pct(s.value)}%` }}
            onMouseEnter={() => setActive(i)}
            title={s.label}
          />
        ))}
      </div>

      <div className={styles.legend}>
        {segments.map((s, i) => (
          <div
            key={s.label}
            className={`${styles.row} ${active !== null && active !== i ? styles.dimmed : ''}`}
            onMouseEnter={() => setActive(i)}
          >
            <span className={styles.swatch} />
            <span className={styles.label}>{s.label}</span>
            <span className={styles.value}>
              {s.value.toLocaleString()}
              {unit}
            </span>
            <span className={styles.pct}>{pct(s.value).toFixed(1)}%</span>
          </div>
        ))}
      </div>

      <div className={styles.note}>
        {active !== null && segments[active].note ? (
          <p className={styles.noteBody} key={active}>
            {segments[active].note}
          </p>
        ) : (
          <p className={styles.noteBody}>{hint ?? ''}</p>
        )}
      </div>
    </figure>
  );
}
