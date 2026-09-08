import styles from './Term.module.css';

/** Inline jargon with a definition on hover. Keyboard reachable by design. */
export function Term({ children, def }: { children: React.ReactNode; def: string }) {
  return (
    <span className={styles.term} tabIndex={0}>
      {children}
      <span className={styles.pop} role="tooltip">
        {def}
      </span>
    </span>
  );
}
