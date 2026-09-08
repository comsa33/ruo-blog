'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { site, type Lang } from '@/lib/site';
import styles from './Header.module.css';

export function Header({ lang }: { lang: Lang }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  // The hairline only appears once content has moved under the header.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const other: Lang = lang === 'ko' ? 'en' : 'ko';
  // Swap only the language segment so the reader stays on the same page.
  const otherHref = pathname.replace(/^\/(ko|en)/, `/${other}`);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <Link href={`/${lang}`} className={styles.brand}>
          <span className={styles.dot} aria-hidden />
          {lang === 'ko' ? site.authorKo : site.author}
        </Link>

        <nav className={styles.nav}>
          <a href={site.portfolio} className={styles.navItem}>
            {lang === 'ko' ? '포트폴리오' : 'Portfolio'}
          </a>
          <Link href={otherHref} className={styles.navItem}>
            {other.toUpperCase()}
          </Link>
          <span className={styles.sep} aria-hidden />
          <span className={styles.navItem}>
            <ThemeToggle label={lang === 'ko' ? '테마 전환' : 'Toggle theme'} />
          </span>
        </nav>
      </div>
    </header>
  );
}
