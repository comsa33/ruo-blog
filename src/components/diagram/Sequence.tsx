'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './Sequence.module.css';

export type SequenceStep = {
  /** Actor name, must match one entry in `actors`. */
  from: string;
  to: string;
  label: string;
  /** Prose shown under the diagram while this step is current. */
  note?: string;
  /** Dashed line — a signal or async hand-off rather than a call. */
  async?: boolean;
};

type Props = {
  actors: string[];
  steps: SequenceStep[];
  caption?: string;
  /** Advance automatically until the reader interacts. */
  autoPlay?: boolean;
};

const W = 760;
const PAD = 16;
const HEAD_H = 30;
/** Actor boxes end at HEAD_H + 4. The first label sits LABEL_DY above its
 *  arrow, so the first arrow has to clear both, not just the box. */
const TOP = 66;
const GAP = 56;
/** Baseline offset of a message label above its arrow. */
const LABEL_DY = 9;
const SELF_W = 46;
/** Length of the arrowhead. The shaft stops exactly where the head begins. */
const HEAD = 7;

export function Sequence({ actors, steps, caption, autoPlay = false }: Props) {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);

  const lane = (W - PAD * 2) / actors.length;
  const x = useCallback(
    (name: string) => PAD + (actors.indexOf(name) + 0.5) * lane,
    [actors, lane],
  );
  const height = TOP + steps.length * GAP + 18;

  const geometry = useMemo(
    () =>
      steps.map((s, i) => {
        const y = TOP + i * GAP;
        const x1 = x(s.from);
        const x2 = x(s.to);
        const self = s.from === s.to;
        const dir = x2 >= x1 ? 1 : -1;
        // The shaft stops at the base of the head so that the tip — not the
        // base — lands on the target lifeline. Leaving the 5px gap that was
        // here before made every arrow look short of its mark.
        const d = self
          ? `M ${x1} ${y} h ${SELF_W} v 18 h ${-(SELF_W - HEAD)}`
          : `M ${x1} ${y} H ${x2 - dir * HEAD}`;
        const len = self ? SELF_W * 2 + 18 : Math.abs(x2 - x1);
        return { ...s, y, x1, x2, self, dir, d, len };
      }),
    [steps, x],
  );

  const go = useCallback(
    (n: number) => {
      setPlaying(false);
      setCurrent(Math.max(0, Math.min(steps.length - 1, n)));
    },
    [steps.length],
  );

  // Auto-play stops at the end and never loops: looping animation next to prose
  // is a distraction, and the reader has already seen the whole sequence.
  useEffect(() => {
    if (!playing) return;
    if (current >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(() => setCurrent((c) => c + 1), 1400);
    return () => clearTimeout(id);
  }, [playing, current, steps.length]);

  const active = geometry[current];

  return (
    <figure className={styles.wrap}>
      <div className={styles.stage}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${W} ${height}`}
          role="img"
          aria-label={caption ?? 'Sequence diagram'}
        >
          {/* actors + lifelines */}
          {actors.map((a) => {
            const cx = x(a);
            const isActive = active && (active.from === a || active.to === a);
            const boxW = Math.min(lane - 10, 132);
            return (
              <g key={a} className={isActive ? styles.actorActive : undefined}>
                <rect
                  className={styles.actorBox}
                  x={cx - boxW / 2}
                  y={4}
                  width={boxW}
                  height={HEAD_H}
                  rx={6}
                />
                <text
                  className={styles.actorLabel}
                  x={cx}
                  y={4 + HEAD_H / 2 + 4}
                  textAnchor="middle"
                >
                  {a}
                </text>
                <line className={styles.lifeline} x1={cx} y1={HEAD_H + 6} x2={cx} y2={height - 8} />
              </g>
            );
          })}

          {/* messages */}
          {geometry.map((g, i) => {
            const isCurrent = i === current;
            return (
              <g
                key={`${i}-${isCurrent}`}
                className={[styles.msg, isCurrent ? styles.current : styles.dim].join(' ')}
                style={{ '--len': g.len } as React.CSSProperties}
                onClick={() => go(i)}
              >
                <path
                  className={styles.msgLine}
                  d={g.d}
                  strokeDasharray={g.async && !isCurrent ? '4 4' : undefined}
                />
                <path
                  className={styles.msgHead}
                  d={
                    g.self
                      ? // tip on the lifeline, pointing back at it
                        `M ${g.x1} ${g.y + 18} l ${HEAD} -3.5 v 7 z`
                      : `M ${g.x2} ${g.y} l ${-g.dir * HEAD} -3.5 v 7 z`
                  }
                />
                <text
                  className={styles.msgLabel}
                  x={g.self ? g.x1 + SELF_W + 8 : (g.x1 + g.x2) / 2}
                  y={g.y - LABEL_DY}
                  textAnchor={g.self ? 'start' : 'middle'}
                >
                  {g.label}
                </text>
                {/* Invisible hit area so thin arrows are still easy to click. */}
                <rect
                  x={Math.min(g.x1, g.x2) - 10}
                  y={g.y - 20}
                  width={Math.abs(g.x2 - g.x1) + (g.self ? SELF_W + 90 : 20)}
                  height={GAP - 8}
                  fill="transparent"
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div className={styles.bar}>
        <button
          className={styles.btn}
          onClick={() => go(current - 1)}
          disabled={current === 0}
          aria-label="Previous step"
        >
          ←
        </button>
        <button
          className={styles.btn}
          onClick={() => go(current + 1)}
          disabled={current === steps.length - 1}
          aria-label="Next step"
        >
          →
        </button>
        <button
          className={styles.btn}
          onClick={() => {
            if (current >= steps.length - 1) setCurrent(0);
            setPlaying((p) => !p);
          }}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? '❙❙' : '▶'}
        </button>

        <div className={styles.ticks}>
          {steps.map((_, i) => (
            <button
              key={i}
              className={`${styles.tick} ${i === current ? styles.tickOn : ''}`}
              onClick={() => go(i)}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>

        <span className={styles.counter}>
          {current + 1} / {steps.length}
        </span>
      </div>

      {active?.note && (
        <div className={styles.note}>
          <p className={styles.noteBody} key={current}>
            <span className={styles.noteLabel}>{String(current + 1).padStart(2, '0')}</span>
            {active.note}
          </p>
        </div>
      )}
    </figure>
  );
}
