'use client';

import { useState } from 'react';
import styles from './Legibility.module.css';

export type Shape = {
  key: string;
  name: string;
  viewBox: string;
  /** Outline simplified for each display size — the detail differs on purpose. */
  outline: { rest: string; open: string };
  /** Route between consecutive stops. Gaps are real: the journey left and came back. */
  legs: string;
  stops: [number, number][];
  /** Measured long side of the route's bounding box, in px, at each size. */
  span: { rest: number; open: number };
};

type Props = {
  caption: string;
  shapes: Shape[];
  /** Display sizes in CSS px, as shipped. */
  sizes: { rest: number; open: number };
  restLabel: string;
  openLabel: string;
  /** Below this many px the route is not readable. Stated, not computed. */
  readableAt: number;
  note?: string;
};

export function Legibility({
  caption,
  shapes,
  sizes,
  restLabel,
  openLabel,
  readableAt,
  note,
}: Props) {
  const [key, setKey] = useState(shapes[0].key);
  const shape = shapes.find((s) => s.key === key) ?? shapes[0];

  const panels = [
    {
      id: 'rest' as const,
      label: restLabel,
      px: sizes.rest,
      d: shape.outline.rest,
      span: shape.span.rest,
    },
    {
      id: 'open' as const,
      label: openLabel,
      px: sizes.open,
      d: shape.outline.open,
      span: shape.span.open,
    },
  ];

  return (
    <figure className={styles.wrap}>
      <div className={styles.head}>
        <div className={styles.caption}>{caption}</div>
        <div className={styles.tabs}>
          {shapes.map((s) => (
            <button
              key={s.key}
              className={`${styles.tab} ${s.key === key ? styles.tabOn : ''}`}
              onClick={() => setKey(s.key)}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.row}>
        {panels.map((p) => (
          <div key={p.id} className={styles.panel}>
            <div className={styles.frame} style={{ width: p.px, height: p.px }}>
              <svg className={styles.map} viewBox={shape.viewBox} aria-hidden="true">
                <path className={styles.outline} d={p.d} />
                <path className={styles.legs} d={shape.legs} />
                {shape.stops.map(([x, y], i) => (
                  <circle key={i} className={styles.stop} cx={x} cy={y} r={7} />
                ))}
              </svg>
            </div>
            <div className={styles.meta}>
              <span className={styles.metaLabel}>{p.label}</span>
              <span className={styles.metaPx}>{p.px}px</span>
            </div>
            <div className={`${styles.verdict} ${p.span < readableAt ? styles.unreadable : ''}`}>
              경로 {p.span.toFixed(1)}px · {p.span < readableAt ? '안 읽힘' : '읽힘'}
            </div>
          </div>
        ))}
      </div>

      {note && <figcaption className={styles.note}>{note}</figcaption>}
    </figure>
  );
}
