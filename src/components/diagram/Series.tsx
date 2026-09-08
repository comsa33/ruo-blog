'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './Series.module.css';

export type Line = { name: string; values: number[]; accent?: boolean };

type Props = {
  caption: string;
  series: Line[];
  xLabel?: string;
  yLabel?: string;
};

const W = 700;
const H = 240;
const L = 38;
const R = 12;
const T = 10;
const B = 30;

export function Series({ caption, series, xLabel, yLabel }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const [hoverX, setHoverX] = useState<number | null>(null);

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

  const n = Math.max(...series.map((s) => s.values.length));
  const maxY = Math.max(...series.flatMap((s) => s.values));
  const niceMax = Math.ceil(maxY / 5) * 5 || 5;

  const px = (i: number) => L + (i / Math.max(1, n - 1)) * (W - L - R);
  const py = (v: number) => T + (1 - v / niceMax) * (H - T - B);

  const pathOf = (values: number[]) =>
    values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ');

  const ticks = [0, niceMax / 2, niceMax];

  return (
    <figure className={styles.wrap} ref={ref} onMouseLeave={() => setHoverX(null)}>
      <div className={styles.caption}>{caption}</div>

      <svg
        className={styles.svg}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={caption}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const rel = ((e.clientX - rect.left) / rect.width) * W;
          const i = Math.round(((rel - L) / (W - L - R)) * (n - 1));
          setHoverX(Math.max(0, Math.min(n - 1, i)));
        }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line className={styles.grid} x1={L} y1={py(t)} x2={W - R} y2={py(t)} />
            <text className={styles.axisText} x={L - 8} y={py(t) + 3} textAnchor="end">
              {t}
            </text>
          </g>
        ))}

        {xLabel && (
          <text className={styles.axisText} x={W - R} y={H - 6} textAnchor="end">
            {xLabel}
          </text>
        )}
        {yLabel && (
          <text className={styles.axisText} x={L - 8} y={T - 1} textAnchor="end">
            {yLabel}
          </text>
        )}

        {hoverX !== null && (
          <line className={styles.cursorLine} x1={px(hoverX)} y1={T} x2={px(hoverX)} y2={H - B} />
        )}

        {series.map((s, i) => {
          // Rough path length: enough for a dash animation, cheap to compute.
          const len = Math.round((W - L - R) * 1.35);
          return (
            <path
              key={s.name}
              className={[
                styles.path,
                s.accent ? styles.accent : '',
                shown ? styles.drawn : '',
              ].join(' ')}
              style={{ '--len': len, '--i': i } as React.CSSProperties}
              d={pathOf(s.values)}
            />
          );
        })}

        {hoverX !== null &&
          series.map((s) => (
            <circle
              key={s.name}
              className={styles.dot}
              cx={px(hoverX)}
              cy={py(s.values[hoverX] ?? 0)}
              r={3.5}
              fill={s.accent ? 'var(--accent)' : 'var(--ink-tertiary)'}
            />
          ))}

        <text className={styles.axisText} x={L} y={H - 12}>
          1
        </text>
        <text className={styles.axisText} x={px(n - 1)} y={H - 12} textAnchor="middle">
          {n}
        </text>
      </svg>

      <div className={styles.legend}>
        {series.map((s) => (
          <span
            key={s.name}
            className={`${styles.legendItem} ${s.accent ? styles.legendAccent : ''}`}
          >
            <span className={styles.legendSwatch} />
            {s.name}
            <span className={styles.legendValue}>
              {hoverX !== null ? s.values[hoverX] : s.values[s.values.length - 1]}
            </span>
          </span>
        ))}
      </div>
    </figure>
  );
}
