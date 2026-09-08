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

  const toggle = useCallback(() => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';

    // Suppress interaction transitions while the whole document cross-fades,
    // otherwise every hover-tuned transition fires at once.
    const root = document.documentElement;
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
