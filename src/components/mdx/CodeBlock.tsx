'use client';

import { useRef, useState } from 'react';
import styles from './CodeBlock.module.css';

/**
 * Wraps the <pre> emitted by rehype-pretty-code and shows an inline checkmark
 * on copy. Per interfaces.rauno.me: feedback belongs on the trigger, not in a
 * notification.
 */
export function CodeBlock(props: React.ComponentProps<'pre'>) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const text = ref.current?.querySelector('code')?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* Clipboard blocked — leave the label untouched rather than lying. */
    }
  };

  return (
    <div className={styles.wrap} ref={ref}>
      <pre {...props} />
      <button
        type="button"
        onClick={copy}
        className={`${styles.copy} ${copied ? styles.copied : ''}`}
        aria-label="Copy code"
      >
        {copied ? '✓' : '⧉'}
      </button>
    </div>
  );
}
