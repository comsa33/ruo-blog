'use client';

import { useMemo, useState } from 'react';
import styles from './Structure.module.css';

export type StructureNode = {
  id: string;
  label: string;
  /** Small mono line under the label — a role, a store type, a protocol. */
  sub?: string;
  col: number;
  row: number;
  /** Explanation shown in the panel when the node is focused. */
  note?: string;
  /** Draw with the accent wash — use for the piece the post is about. */
  accent?: boolean;
};

export type StructureEdge = {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
};

type Props = {
  nodes: StructureNode[];
  edges: StructureEdge[];
  hint?: string;
};

const W = 760;
const NODE_W = 132;
const NODE_H = 50;
const COL_GAP = 58;
const ROW_GAP = 40;
const PAD = 12;

export function Structure({ nodes, edges, hint }: Props) {
  const [focus, setFocus] = useState<string | null>(null);

  const cols = Math.max(...nodes.map((n) => n.col)) + 1;
  const rows = Math.max(...nodes.map((n) => n.row)) + 1;

  const stepX = (W - PAD * 2 - NODE_W) / Math.max(1, cols - 1);
  const height = PAD * 2 + rows * NODE_H + (rows - 1) * ROW_GAP;

  const pos = useMemo(() => {
    const m = new Map<string, { x: number; y: number; cx: number; cy: number }>();
    for (const n of nodes) {
      const x = PAD + n.col * (cols > 1 ? stepX : 0);
      const y = PAD + n.row * (NODE_H + ROW_GAP);
      m.set(n.id, { x, y, cx: x + NODE_W / 2, cy: y + NODE_H / 2 });
    }
    return m;
  }, [nodes, cols, stepX]);

  // An edge is lit when the focused node sits at either end.
  const isEdgeLit = (e: StructureEdge) => focus !== null && (e.from === focus || e.to === focus);
  const neighbours = useMemo(() => {
    if (!focus) return new Set<string>();
    const s = new Set<string>([focus]);
    for (const e of edges) {
      if (e.from === focus) s.add(e.to);
      if (e.to === focus) s.add(e.from);
    }
    return s;
  }, [focus, edges]);

  const focused = nodes.find((n) => n.id === focus);

  return (
    <figure className={styles.wrap} onMouseLeave={() => setFocus(null)}>
      <div className={styles.stage}>
        <svg className={styles.svg} viewBox={`0 0 ${W} ${height}`} role="img"
          aria-label="Architecture diagram">
          {edges.map((e, i) => {
            const a = pos.get(e.from);
            const b = pos.get(e.to);
            if (!a || !b) return null;

            const sameRow = Math.abs(a.cy - b.cy) < 1;
            const dir = b.cx > a.cx ? 1 : -1;
            const x1 = sameRow ? a.x + (dir > 0 ? NODE_W : 0) : a.cx;
            const y1 = sameRow ? a.cy : a.y + (b.cy > a.cy ? NODE_H : 0);
            const x2 = sameRow ? b.x + (dir > 0 ? 0 : NODE_W) : b.cx;
            const y2 = sameRow ? b.cy : b.y + (b.cy > a.cy ? 0 : NODE_H);

            const d = sameRow
              ? `M ${x1} ${y1} H ${x2 - dir * 6}`
              : `M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${
                  y2 + (y2 > y1 ? -6 : 6)
                }`;

            const head = sameRow
              ? `M ${x2 - dir * 6} ${y2} l ${-dir * 6} -3.5 v 7 z`
              : `M ${x2} ${y2 + (y2 > y1 ? -6 : 6)} l -3.5 ${y2 > y1 ? -6 : 6} h 7 z`;

            const lit = isEdgeLit(e);
            return (
              <g
                key={i}
                className={[lit ? styles.lit : '', focus && !lit ? styles.faded : ''].join(' ')}
              >
                <path className={styles.edge} d={d}
                  strokeDasharray={e.dashed ? '4 4' : undefined} />
                <path className={styles.edgeHead} d={head} />
                {e.label && (
                  <text className={styles.edgeLabel} x={(x1 + x2) / 2}
                    y={sameRow ? y1 - 7 : (y1 + y2) / 2 - 4} textAnchor="middle">
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}

          {nodes.map((n) => {
            const p = pos.get(n.id)!;
            const lit = focus === n.id;
            const dim = focus !== null && !neighbours.has(n.id);
            return (
              <g
                key={n.id}
                className={[styles.node, lit ? styles.lit : '', dim ? styles.faded : ''].join(' ')}
                onMouseEnter={() => setFocus(n.id)}
                onFocus={() => setFocus(n.id)}
                tabIndex={0}
              >
                <rect
                  className={`${styles.nodeBox} ${n.accent ? styles.accentBox : ''}`}
                  x={p.x}
                  y={p.y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={8}
                />
                <text className={styles.nodeLabel} x={p.cx} y={n.sub ? p.cy : p.cy + 4}
                  textAnchor="middle">
                  {n.label}
                </text>
                {n.sub && (
                  <text className={styles.nodeSub} x={p.cx} y={p.cy + 14} textAnchor="middle">
                    {n.sub}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className={styles.detail}>
        {focused?.note ? (
          <p className={styles.detailBody} key={focused.id}>
            <span className={styles.detailName}>{focused.label}</span>
            {focused.note}
          </p>
        ) : (
          <p className={styles.hint}>{hint ?? '노드에 커서를 올리면 연결과 설명이 나타납니다.'}</p>
        )}
      </div>
    </figure>
  );
}
