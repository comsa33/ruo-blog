import styles from './Blocks.module.css';

export function Callout({
  children,
  label,
  accent,
}: {
  children: React.ReactNode;
  label?: string;
  accent?: boolean;
}) {
  return (
    <aside className={`${styles.callout} ${accent ? styles.accent : ''}`}>
      {label && <span className={styles.calloutLabel}>{label}</span>}
      {children}
    </aside>
  );
}

export function Metrics({ children }: { children: React.ReactNode }) {
  return <div className={styles.metrics}>{children}</div>;
}

export function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className={styles.metric}>
      <div className={styles.metricValue}>{value}</div>
      <div className={styles.metricLabel}>{label}</div>
    </div>
  );
}

export function Figure({
  src,
  alt,
  caption,
  screens,
}: {
  src?: string;
  alt?: string;
  caption?: string;
  /** Phone screenshots, each a third of the frame, in one centred row. */
  screens?: { src: string; alt: string }[];
}) {
  return (
    <figure className={styles.figure}>
      {/* Plain <img>: screen readers announce it and right-click copy works. */}
      {screens ? (
        <div className={styles.screens}>
          {screens.map((s) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={s.src} src={s.src} alt={s.alt} loading="lazy" />
          ))}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" />
      )}
      {caption && <figcaption className={styles.figcaption}>{caption}</figcaption>}
    </figure>
  );
}
