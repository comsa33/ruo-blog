'use client';

import { useSyncExternalStore, useCallback } from 'react';

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

const getSnapshot = () => document.documentElement.dataset.theme ?? 'light';
const getServerSnapshot = () => 'light';

export function ThemeToggle({ label }: { label: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;

    // The new theme spreads from this button (globals.css, themeSpread), so
    // the transition needs to know where it was pressed and how far the
    // farthest corner is.
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const far = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.style.setProperty('--theme-x', `${Math.round(x)}px`);
    root.style.setProperty('--theme-y', `${Math.round(y)}px`);
    root.style.setProperty('--theme-r', `${Math.ceil(far)}px`);

    // Suppress interaction transitions while the document switches, otherwise
    // every hover-tuned transition fires at once.
    root.setAttribute('data-theme-switching', '');
    const commit = () => {
      root.dataset.theme = next;
      localStorage.setItem('theme', next);
    };

    if (document.startViewTransition) {
      document.startViewTransition(commit).finished.finally(() => {
        root.removeAttribute('data-theme-switching');
      });
    } else {
      commit();
      requestAnimationFrame(() => root.removeAttribute('data-theme-switching'));
    }
  }, []);

  return (
    <button type="button" onClick={toggle} aria-label={label} title={label}>
      {theme === 'dark' ? '○' : '●'}
    </button>
  );
}
