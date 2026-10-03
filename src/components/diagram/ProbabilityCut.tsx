'use client';

import { useState } from 'react';
import styles from './ProbabilityCut.module.css';

export type CutCategory = {
  id: string;
  label: string;
  /** Count of answers per 0.05 step of probability, 20 bins from 0 to 1. */
  bins: number[];
  /** The line that shipped. A multiple of 0.05. */
  chosen: number;
};

type Props = {
  caption: string;
  categories: CutCategory[];
  /** "{n}장이 선 위" — {n} and {total} are filled in. */
  aboveText: string;
  chosenText: string;
  resetLabel: string;
};

const W = 700;
const H = 150;
const L = 8;
const R = 8;
const TOP = 18;
const BOTTOM = 22;
const STEPS = 20;

/* Bins are counted, never interpolated: the line moves in the same 0.05 steps
   the bins are cut at, so every count it shows is a count that exists. */
const step = (v: number) => Math.round(v * STEPS);

export function ProbabilityCut({ caption, categories, aboveText, chosenText, resetLabel }: Props) {
  const [catId, setCatId] = useState(categories[0].id);
  const cat = categories.find((c) => c.id === catId) ?? categories[0];
  const [cuts, setCuts] = useState<Record<string, number>>(() =>
    Object.fromEntries(categories.map((c) => [c.id, step(c.chosen)])),
  );
  const cut = cuts[cat.id];

  const total = cat.bins.reduce((a, b) => a + b, 0);
  const above = cat.bins.slice(cut).reduce((a, b) => a + b, 0);
  // Most answers sit near 0, so heights are square-rooted or the rest vanish.
  const peak = Math.sqrt(Math.max(...cat.bins, 1));
  const bw = (W - L - R) / STEPS;
  const x = (i: number) => L + i * bw;
  const h = (n: number) => (Math.sqrt(n) / peak) * (H - TOP - BOTTOM);

  return (
    <figure className={styles.wrap}>
      <div className={styles.head}>
        <div className={styles.caption}>{caption}</div>
        <div className={styles.tabs} role="tablist">
          {categories.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={c.id === cat.id}
              className={`${styles.tab} ${c.id === cat.id ? styles.tabOn : ''}`}
              onClick={() => setCatId(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.plot}>
        <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={caption}>
          {cat.bins.map((n, i) => (
            <rect
              key={i}
              className={`${styles.bar} ${i >= cut ? styles.barOn : ''}`}
              x={x(i) + 1}
              y={H - BOTTOM - h(n)}
              width={bw - 2}
              height={Math.max(n ? 1 : 0, h(n))}
            />
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <text
              key={v}
              className={styles.axisText}
              x={L + v * (W - L - R)}
              y={H - 6}
              textAnchor={v === 0 ? 'start' : v === 1 ? 'end' : 'middle'}
            >
              {v.toFixed(2)}
            </text>
          ))}
          <line
            className={styles.chosenLine}
            x1={x(step(cat.chosen))}
            x2={x(step(cat.chosen))}
            y1={TOP - 6}
            y2={H - BOTTOM}
          />
          <g className={styles.cutLine} style={{ transform: `translateX(${x(cut) - x(0)}px)` }}>
            <line x1={x(0)} x2={x(0)} y1={TOP - 12} y2={H - BOTTOM} />
          </g>
        </svg>
      </div>

      <div className={styles.control}>
        <input
          className={styles.range}
          type="range"
          min={1}
          max={STEPS - 1}
          step={1}
          value={cut}
          aria-label={caption}
          onChange={(e) => setCuts({ ...cuts, [cat.id]: Number(e.target.value) })}
        />
        <span className={styles.value}>{(cut / STEPS).toFixed(2)}</span>
      </div>

      <div className={styles.verdict}>
        <span className={styles.count}>
          {aboveText
            .replace('{n}', above.toLocaleString())
            .replace('{total}', total.toLocaleString())}
        </span>
        <button
          className={`${styles.reset} ${cut === step(cat.chosen) ? styles.resetAt : ''}`}
          onClick={() => setCuts({ ...cuts, [cat.id]: step(cat.chosen) })}
        >
          {cut === step(cat.chosen)
            ? chosenText.replace('{v}', cat.chosen.toFixed(2))
            : resetLabel.replace('{v}', cat.chosen.toFixed(2))}
        </button>
      </div>
    </figure>
  );
}
