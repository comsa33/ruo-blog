import { site, t, type Lang } from '@/lib/site';
import styles from './SiteFooter.module.css';

/**
 * The site footer. It is not at the end of the sheet — it waits on the page
 * behind it, and once the sheet has scrolled past, the footer is what is left.
 * Two lines of CSS: the sheet is `z-index: 1`, this is `sticky; bottom: 0`.
 *
 * This is also where the links that only the header carried get a second,
 * quieter home, plus the two feeds a reader never sees in the chrome.
 */
export function SiteFooter({ lang }: { lang: Lang }) {
  return (
    <footer className={styles.footer}>
      <span className={styles.brand}>{site.title[lang]}</span>
      <nav className={styles.links} aria-label={t.siteLinks[lang]}>
        <a href={site.portfolio}>{t.portfolio[lang]}</a>
        <a href={site.worldtrip}>{t.worldtrip[lang]}</a>
        <a href={site.github}>GitHub</a>
        <a href="/rss.xml">RSS</a>
        <a href="/llms.txt">llms.txt</a>
      </nav>
    </footer>
  );
}
