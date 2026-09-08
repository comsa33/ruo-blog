'use client';

import { useState } from 'react';
import styles from './Threshold.module.css';

export type Cluster = {
  key: string;
  name: string;
  n: number;
  min: number;
  max: number;
  mean: number;
  /** Where this cluster *should* land relative to the threshold. */
  want: 'above' | 'below';
};

export type SweepPoint = {
  at: number;
  /** Measured count at or above `at`, keyed by cluster key. */
  counts: Record<string, number>;
};

type Props = {
  caption: string;
  clusters: Cluster[];
  sweep: SweepPoint[];
  /** The threshold that shipped. */
  chosen: number;
  chosenNote?: string;
};

const W = 700;
const ROW = 34;
const L = 96;
const R = 16;
const TOP = 22;

export function Threshold({ caption, clusters, sweep, chosen, chosenNote }: Props) {
  const [at, setAt] = useState(chosen);
  const point = sweep.find((s) => s.at === at) ?? sweep[0];

  const H = TOP + clusters.length * ROW + 26;
  const x = (v: number) => L + v * (W - L - R);

  return (
    <figure className={styles.wrap}>
      <div className={styles.head}>
        <div className={styles.caption}>{caption}</div>
      </div>

      <div className={styles.plot}>
        <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={caption}>
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <g key={v}>
              <line className={styles.axisLine} x1={x(v)} y1={TOP - 8} x2={x(v)} y2={H - 22} />
              <text className={styles.axisText} x={x(v)} y={H - 8} textAnchor="middle">
                {v.toFixed(2)}
              </text>
            </g>
          ))}

          {clusters.map((c, i) => {
            const y = TOP + i * ROW;
            return (
              <g key={c.key}>
                <text className={styles.groupLabel} x={L - 10} y={y + 10} textAnchor="end">
                  {c.key} {c.name} · {c.n}
                </text>
                <rect
                  className={`${styles.range} ${
                    c.want === 'above' ? styles.wantAbove : styles.wantBelow
                  }`}
                  x={x(c.min)}
                  y={y}
                  width={Math.max(2, x(c.max) - x(c.min))}
                  height={12}
                  rx={6}
                />
                <circle className={styles.mean} cx={x(c.mean)} cy={y + 6} r={2.5} />
              </g>
            );
          })}

          {/* threshold */}
          <g style={{ transform: `translateX(${x(at) - x(0)}px)` }} className={styles.thresholdLine}>
            <line x1={x(0)} y1={TOP - 12} x2={x(0)} y2={H - 22} stroke="var(--accent)"
              strokeWidth={1.5} />
            <rect className={styles.thresholdFlag} x={x(0) - 19} y={TOP - 26} width={38} height={15}
              rx={4} />
            <text className={styles.thresholdText} x={x(0)} y={TOP - 15} textAnchor="middle">
              {at.toFixed(2)}
            </text>
          </g>
        </svg>
      </div>

      <div className={styles.control}>
        {sweep.map((s) => (
          <button
            key={s.at}
            className={`${styles.stop} ${s.at === at ? styles.stopOn : ''}`}
            onClick={() => setAt(s.at)}
          >
            {s.at.toFixed(2)}
          </button>
        ))}
        <span className={styles.chosenTag}>
          {chosenNote ?? `채택 ${chosen.toFixed(2)}`}
        </span>
      </div>

      <div className={styles.verdict}>
        {clusters.map((c) => {
          const hit = point.counts[c.key] ?? 0;
          // For a "below" cluster, anything above the line is a false merge.
          const bad = c.want === 'below' && hit > 0;
          return (
            <div key={c.key} className={`${styles.cell} ${bad ? styles.bad : ''}`}>
              <div className={styles.cellName}>
                {c.key} {c.name}
              </div>
              <div className={styles.cellValue}>
                {hit} / {c.n}
              </div>
              <div className={styles.cellNote}>
                {c.want === 'above' ? '잡힘' : bad ? '잘못 덮어씀' : '안 건드림'}
              </div>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
