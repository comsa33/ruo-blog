'use client';

import { useState } from 'react';
import styles from './Spread.module.css';

export type SpreadValue = {
  /** The measured number. */
  v: number;
  /** What was measured — shown when the reader points at the tick. */
  label: string;
};

type Props = {
  caption: string;
  values: SpreadValue[];
  /** Cuts the reader can try. Only values that were actually considered. */
  cuts: number[];
  /** The cut that shipped. */
  chosen: number;
  /** Wording for the two sides of the cut. */
  belowLabel: string;
  aboveLabel: string;
  /** Axis ticks, in the same unit as `v`. */
  ticks: number[];
  unit?: string;
};

const W = 700;
const TOP = 30;
const LANE = 54;
const H = TOP + LANE + 38;
const L = 18;
const R = 18;

export function Spread({
  caption,
  values,
  cuts,
  chosen,
  belowLabel,
  aboveLabel,
  ticks,
  unit,
}: Props) {
  const [at, setAt] = useState(chosen);
  const [near, setNear] = useState<SpreadValue | null>(null);

  const lo = Math.min(...values.map((d) => d.v));
  const hi = Math.max(...values.map((d) => d.v));
  const span = Math.log(hi) - Math.log(lo);
  // Rounded, because the server and the browser stringify the same float
  // differently and React reports that as a hydration mismatch.
  const x = (v: number) =>
    Number((L + ((Math.log(v) - Math.log(lo)) / span) * (W - L - R)).toFixed(2));

  const below = values.filter((d) => d.v <= at);
  const sorted = [...values].sort((a, b) => a.v - b.v);

  // The widest stretch of the axis with nothing in it. This is the figure's
  // whole point: where the gap is, the cut has no decision left to make.
  let gapFrom = sorted[0].v;
  let gapTo = sorted[0].v;
  for (let i = 1; i < sorted.length; i++) {
    if (Math.log(sorted[i].v) - Math.log(sorted[i - 1].v) > Math.log(gapTo) - Math.log(gapFrom)) {
      gapFrom = sorted[i - 1].v;
      gapTo = sorted[i].v;
    }
  }

  return (
    <figure className={styles.wrap}>
      <div className={styles.head}>
        <div className={styles.caption}>{caption}</div>
      </div>

      <div className={styles.plot}>
        <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={caption}>
          <rect
            className={styles.gap}
            x={x(gapFrom)}
            y={TOP - 6}
            width={Math.max(1, x(gapTo) - x(gapFrom))}
            height={LANE + 12}
          />

          {ticks.map((t) => (
            <g key={t}>
              <line
                className={styles.axisLine}
                x1={x(t)}
                y1={TOP - 6}
                x2={x(t)}
                y2={TOP + LANE + 6}
              />
              <text className={styles.axisText} x={x(t)} y={H - 14} textAnchor="middle">
                {t}
                {unit && t === ticks[ticks.length - 1] ? unit : ''}
              </text>
            </g>
          ))}

          {values.map((d, i) => (
            <line
              key={`${d.label}-${i}`}
              className={`${styles.tick} ${d.v <= at ? styles.tickBelow : ''} ${
                near === d ? styles.tickNear : ''
              }`}
              x1={x(d.v)}
              y1={TOP}
              x2={x(d.v)}
              y2={TOP + LANE}
              onPointerEnter={() => setNear(d)}
              onPointerLeave={() => setNear(null)}
            />
          ))}

          <g className={styles.cutGroup} style={{ transform: `translateX(${x(at) - x(lo)}px)` }}>
            <line
              className={styles.cutLine}
              x1={x(lo)}
              y1={TOP - 14}
              x2={x(lo)}
              y2={TOP + LANE + 6}
            />
            <rect
              className={styles.cutFlag}
              x={x(lo) - 20}
              y={TOP - 28}
              width={40}
              height={15}
              rx={4}
            />
            <text className={styles.cutText} x={x(lo)} y={TOP - 17} textAnchor="middle">
              {at.toFixed(2)}
            </text>
          </g>
        </svg>
      </div>

      <div className={styles.control}>
        {cuts.map((c) => (
          <button
            key={c}
            className={`${styles.stop} ${c === at ? styles.stopOn : ''}`}
            onClick={() => setAt(c)}
          >
            {c.toFixed(2)}
          </button>
        ))}
        <span className={styles.chosenTag}>채택 {chosen.toFixed(2)}</span>
      </div>

      <div className={styles.verdict}>
        <div className={styles.cell}>
          <div className={styles.cellName}>{belowLabel}</div>
          <div className={styles.cellValue}>
            {below.length} / {values.length}
          </div>
          <div className={styles.cellNote}>
            {below.length ? below.map((d) => d.label).join(' · ') : '없음'}
          </div>
        </div>
        <div className={styles.cell}>
          <div className={styles.cellName}>{aboveLabel}</div>
          <div className={styles.cellValue}>
            {values.length - below.length} / {values.length}
          </div>
          <div className={styles.cellNote}>
            {near ? `${near.label} ${near.v.toFixed(2)}` : '가리키면 이름이 나온다'}
          </div>
        </div>
      </div>
    </figure>
  );
}
