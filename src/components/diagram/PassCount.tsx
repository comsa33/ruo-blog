'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './PassCount.module.css';

type Props = {
  caption: string;
  /** What both models are asked, shown above the two lanes. */
  question: string;
  llm: { label: string; note: string; tokens: string[] };
  jev: { label: string; note: string; answers: { label: string; p: number }[] };
  /** "계산 {n}번" */
  passText: string;
  stepLabel: string;
  runLabel: string;
  resetLabel: string;
};

const RUN_MS = 70;

/*
 * The reader is the clock. One press is one forward pass: the generating model
 * gets one more token out of it, the scoring model is done after the first.
 * The LLM tokens are an illustration of the mechanism, not a recorded output;
 * the scoring answers are the caller's real numbers.
 */
export function PassCount({
  caption,
  question,
  llm,
  jev,
  passText,
  stepLabel,
  runLabel,
  resetLabel,
}: Props) {
  const [passes, setPasses] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef<number | null>(null);
  const total = llm.tokens.length;
  const done = passes >= total;

  useEffect(() => {
    if (!running) return;
    if (passes >= total) {
      setRunning(false);
      return;
    }
    timer.current = window.setTimeout(() => setPasses((p) => p + 1), RUN_MS);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [running, passes, total]);

  const reset = () => {
    setRunning(false);
    setPasses(0);
  };

  return (
    <figure className={styles.wrap}>
      <div className={styles.head}>
        <div className={styles.caption}>{caption}</div>
        <div className={styles.question}>{question}</div>
      </div>

      <div className={styles.lanes}>
        <div className={styles.lane}>
          <div className={styles.laneHead}>
            <span className={styles.laneLabel}>{llm.label}</span>
            <span className={styles.passes}>{passText.replace('{n}', String(passes))}</span>
          </div>
          <div className={styles.tokens} aria-live="polite">
            {llm.tokens.slice(0, passes).map((t, i) => (
              <span
                key={i}
                className={`${styles.token} ${i === passes - 1 ? styles.tokenNew : ''}`}
              >
                {t}
              </span>
            ))}
            {!done && <span className={styles.caret} />}
          </div>
          <div className={styles.note}>{llm.note}</div>
        </div>

        <div className={styles.lane}>
          <div className={styles.laneHead}>
            <span className={styles.laneLabel}>{jev.label}</span>
            <span className={styles.passes}>
              {passText.replace('{n}', String(Math.min(passes, 1)))}
            </span>
          </div>
          <div className={`${styles.answers} ${passes > 0 ? styles.answersOn : ''}`}>
            {jev.answers.map((a) => (
              <div key={a.label} className={styles.answer}>
                <span className={styles.answerLabel}>{a.label}</span>
                <span className={styles.answerTrack}>
                  <span className={styles.answerFill} style={{ width: `${a.p * 100}%` }} />
                </span>
                <span className={styles.answerValue}>{a.p.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className={styles.note}>{jev.note}</div>
        </div>
      </div>

      <div className={styles.control}>
        {done ? (
          <button className={styles.button} onClick={reset}>
            {resetLabel}
          </button>
        ) : (
          <>
            <button
              className={`${styles.button} ${styles.primary}`}
              onClick={() => setPasses((p) => p + 1)}
              disabled={running}
            >
              {stepLabel}
            </button>
            <button className={styles.button} onClick={() => setRunning(true)} disabled={running}>
              {runLabel}
            </button>
          </>
        )}
      </div>
    </figure>
  );
}
