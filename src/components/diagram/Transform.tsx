'use client';

import { useState } from 'react';
import styles from './Transform.module.css';

export type OutLine = { text: string; attr?: string };

export type Variant = {
  key: string;
  label: string;
  output: OutLine[];
  verdict: string;
  bad?: boolean;
};

type Props = {
  caption: string;
  inputLabel?: string;
  input: { speaker?: string; text: string }[];
  outputLabel?: string;
  variants: Variant[];
};

export function Transform({
  caption,
  inputLabel = '입력',
  input,
  outputLabel = '추출된 기억',
  variants,
}: Props) {
  const [key, setKey] = useState(variants[0].key);
  const active = variants.find((v) => v.key === key) ?? variants[0];

  return (
    <figure className={styles.wrap}>
      <div className={styles.caption}>{caption}</div>

      <div className={styles.panel}>
        <div className={styles.panelLabel}>{inputLabel}</div>
        <div className={styles.block}>
          {input.map((l, i) => (
            <div key={i}>
              {l.speaker && <span className={styles.speaker}>{l.speaker}</span>}
              {l.text}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.switch}>
        <span className={styles.arrow}>↓</span>
        {variants.map((v) => (
          <button
            key={v.key}
            className={`${styles.opt} ${v.key === key ? styles.optOn : ''}`}
            onClick={() => setKey(v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className={styles.outWrap}>
        <div className={styles.out} key={key}>
          <div className={styles.panelLabel}>{outputLabel}</div>
          <div className={styles.outBlock}>
            {active.output.map((o, i) => (
              <div key={i} className={styles.line}>
                {o.attr && <span className={styles.attr}>{o.attr}</span>}
                {o.text}
              </div>
            ))}
          </div>
          <div className={styles.verdict}>
            <span className={`${styles.badge} ${active.bad ? styles.badgeBad : styles.badgeGood}`}>
              {active.bad ? '실패' : '통과'}
            </span>
            {active.verdict}
          </div>
        </div>
      </div>
    </figure>
  );
}
