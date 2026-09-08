'use client';

import { useState } from 'react';
import styles from './Playground.module.css';

export type Result = { label: string; value: string; highlight?: boolean };
export type Row = { value: number; results: Result[] };

type Props = {
  caption: string;
  param: {
    label: string;
    initial: number;
    /** Rendered after the value in the big readout. */
    unit?: string;
  };
  /**
   * Every reachable state, precomputed. Functions cannot cross the server /
   * client boundary, so the author hands over plain data instead — which also
   * means nothing is computed on the reader's machine while they drag.
   */
  rows: Row[];
};

export function Playground({ caption, param, rows }: Props) {
  const [i, setI] = useState(() => {
    const found = rows.findIndex((r) => r.value === param.initial);
    return found >= 0 ? found : 0;
  });

  const row = rows[i];

  return (
    <figure className={styles.wrap}>
      <div className={styles.head}>
        <div className={styles.caption}>{caption}</div>
      </div>

      <div className={styles.control}>
        <div>
          <div className={styles.paramLabel}>{param.label}</div>
          <input
            className={styles.slider}
            type="range"
            min={0}
            max={rows.length - 1}
            step={1}
            value={i}
            onChange={(e) => setI(Number(e.target.value))}
            aria-label={param.label}
          />
        </div>
        <div className={styles.readout}>
          {row.value}
          {param.unit ?? ''}
        </div>
      </div>

      <div className={styles.results}>
        {row.results.map((r) => (
          <div key={r.label} className={`${styles.cell} ${r.highlight ? styles.highlight : ''}`}>
            <div className={styles.cellValue}>{r.value}</div>
            <div className={styles.cellLabel}>{r.label}</div>
          </div>
        ))}
      </div>
    </figure>
  );
}
