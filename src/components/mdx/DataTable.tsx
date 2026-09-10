import styles from './DataTable.module.css';

/**
 * Markdown tables render in the reading column, aligned with the prose — the
 * same call as code blocks, and for the same reason: a table is read as part of
 * the sentence that introduces it, not as a figure that breaks out to the
 * frame. A table too wide for the column scrolls inside this wrapper instead of
 * overhanging the text or having its last column cut off.
 *
 * `tabIndex` makes the scroll box reachable by keyboard, which a scrollable
 * element needs to be. No `role="region"` with it: an unnamed region is an
 * empty landmark that assistive tech drops anyway.
 */
export function DataTable(props: React.ComponentProps<'table'>) {
  return (
    <div className={styles.wrap} tabIndex={0}>
      <table {...props} />
    </div>
  );
}
