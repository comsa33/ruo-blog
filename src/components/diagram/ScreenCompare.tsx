'use client';

import { useState } from 'react';
import styles from './ScreenCompare.module.css';

/**
 * Two or three app screens side by side, redrawn from the app's own code —
 * the strings, the button order and the colours are the app's, not this
 * site's. That is why the palette arrives as props: it is content, like a
 * screenshot, and must not leak into the blog's tokens.
 */
export type ScreenTheme = {
  bg: string;
  card: string;
  ink: string;
  muted: string;
  primaryBg: string;
  primaryFg: string;
  primaryBorder?: string;
  secondaryBg: string;
  secondaryFg: string;
  secondaryBorder?: string;
  noticeBg: string;
  noticeFg: string;
  noticeBorder?: string;
  chipBg: string;
  chipFg: string;
};

export type ScreenButton = {
  label: string;
  variant: 'primary' | 'secondary';
  /** Grid columns the button takes; the old nav was 2fr / 3fr. */
  flex?: number;
};

export type Screen = {
  label: string;
  /** One sentence under the phone. */
  note?: string;
  theme: ScreenTheme;
  header: string;
  title: string;
  desc: string;
  notice?: { title: string; body: string; count?: string };
  chipsLabel: string;
  chips: string[];
  /** 'joined' — the old pill nav, two halves of one capsule. 'split' — two separate buttons. */
  nav: 'joined' | 'split';
  buttons: ScreenButton[];
};

type Props = {
  caption: string;
  screens: Screen[];
  /** Label for the toggle that marks where a habitual thumb lands. */
  habitLabel?: string;
};

export function ScreenCompare({ caption, screens, habitLabel }: Props) {
  const [habit, setHabit] = useState(false);

  return (
    <figure className={styles.wrap}>
      <div className={styles.captionRow}>
        <div className={styles.caption}>{caption}</div>
        {habitLabel && (
          <button
            type="button"
            className={`${styles.toggle} ${habit ? styles.toggleOn : ''}`}
            aria-pressed={habit}
            onClick={() => setHabit((h) => !h)}
          >
            {habitLabel}
          </button>
        )}
      </div>

      <div className={styles.row}>
        {screens.map((s) => {
          const t = s.theme;
          const vars = {
            '--s-bg': t.bg,
            '--s-card': t.card,
            '--s-ink': t.ink,
            '--s-muted': t.muted,
            '--s-primary-bg': t.primaryBg,
            '--s-primary-fg': t.primaryFg,
            '--s-primary-border': t.primaryBorder ?? 'transparent',
            '--s-secondary-bg': t.secondaryBg,
            '--s-secondary-fg': t.secondaryFg,
            '--s-secondary-border': t.secondaryBorder ?? 'transparent',
            '--s-notice-bg': t.noticeBg,
            '--s-notice-fg': t.noticeFg,
            '--s-notice-border': t.noticeBorder ?? 'transparent',
            '--s-chip-bg': t.chipBg,
            '--s-chip-fg': t.chipFg,
          } as React.CSSProperties;
          const columns = s.buttons.map((b) => `${b.flex ?? 1}fr`).join(' ');

          return (
            <div key={s.label} className={styles.col}>
              <div className={styles.label}>{s.label}</div>
              <div className={styles.phone} style={vars} aria-label={s.label}>
                <div className={styles.header}>{s.header}</div>
                <div className={styles.body}>
                  <div className={styles.title}>{s.title}</div>
                  <div className={styles.desc}>{s.desc}</div>
                  {s.notice && (
                    <div className={styles.notice}>
                      <div className={styles.noticeText}>
                        <div className={styles.noticeTitle}>{s.notice.title}</div>
                        <div className={styles.noticeBody}>{s.notice.body}</div>
                      </div>
                      {s.notice.count && <div className={styles.noticeCount}>{s.notice.count}</div>}
                    </div>
                  )}
                  <div className={styles.chipsLabel}>{s.chipsLabel}</div>
                  <div className={styles.chips}>
                    {s.chips.map((c) => (
                      <span key={c} className={styles.chip}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div
                  className={`${styles.nav} ${s.nav === 'joined' ? styles.joined : styles.split}`}
                  style={{ gridTemplateColumns: columns }}
                >
                  {s.buttons.map((b, i) => (
                    <div
                      key={b.label}
                      className={[
                        styles.btn,
                        b.variant === 'primary' ? styles.primary : styles.secondary,
                        // Habit lands on the right-hand, larger button — the spot,
                        // not the label. The ring goes on the last button always.
                        habit && i === s.buttons.length - 1 ? styles.thumb : '',
                      ].join(' ')}
                    >
                      {b.label}
                    </div>
                  ))}
                </div>
              </div>
              {s.note && <div className={styles.note}>{s.note}</div>}
            </div>
          );
        })}
      </div>
    </figure>
  );
}
