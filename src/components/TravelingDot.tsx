'use client';

import { useEffect, useRef } from 'react';
import styles from './TravelingDot.module.css';

/** Anchors the dot can land on, in the order it should consider them. */
const ANCHOR_SELECTOR = 'h1[data-dot], h2[data-dot], h3[data-dot], figcaption[data-dot]';

/**
 * Marks every heading and figure caption in the article as a dot anchor, then
 * moves a single dot to whichever one the reader is currently on. The host
 * element opens a slot for it by sliding its text right.
 *
 * Size is derived from the host's own type size, so a title gets a large dot
 * and a caption a small one without any per-post configuration.
 */
export function TravelingDot() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const dot = ref.current;
    const article = dot?.parentElement;
    if (!dot || !article) return;

    // Discovery: anything that titles a piece of the page is an anchor.
    const anchors = Array.from(
      article.querySelectorAll<HTMLElement>('h1, h2, h3, figcaption'),
    ).filter((el) => (el.textContent ?? '').trim().length > 0);
    anchors.forEach((el) => el.setAttribute('data-dot', ''));

    if (anchors.length < 2) return;

    let frame = 0;
    let ready = false;
    let currentHost: HTMLElement | null = null;

    const place = () => {
      frame = 0;

      // The anchor the reader is on is the last one above the reading line.
      const lineY = window.innerHeight * 0.44;
      let host = anchors[0];
      for (const el of anchors) {
        if (el.getBoundingClientRect().top <= lineY) host = el;
        else break;
      }

      if (host !== currentHost) {
        currentHost?.removeAttribute('data-dot-active');
        host.setAttribute('data-dot-active', '');
        currentHost = host;
      }

      const a = host.getBoundingClientRect();
      const parent = article.getBoundingClientRect();
      const cs = getComputedStyle(host);
      const fontSize = parseFloat(cs.fontSize);
      const lineHeight = parseFloat(cs.lineHeight) || fontSize * 1.4;
      // Size comes from the host's own --indicator-size, set per heading level
      // in CSS, so emphasis is a stylesheet decision rather than a magic ratio.
      const declared = parseFloat(cs.getPropertyValue('--indicator-size'));
      const size = Number.isFinite(declared) ? declared : Math.round(fontSize * 0.55);

      // DD hangs the dot in the left margin at a fixed 36px offset from a 32px
      // heading. Scaling the gap with the dot keeps the optical spacing even
      // across four sizes.
      const gap = Math.round(size + 12);

      dot.style.setProperty('--size', `${size}px`);
      dot.style.transform = `translate(${Math.round(a.left - parent.left - gap)}px, ${Math.round(
        a.top - parent.top + (lineHeight - size) / 2,
      )}px)`;

      if (!ready) {
        // First placement lands without animating; every later one glides.
        ready = true;
        requestAnimationFrame(() => dot.setAttribute('data-ready', 'true'));
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(place);
    };

    place();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // A figure resizing shifts everything below it, so watch the article too.
    const ro = new ResizeObserver(schedule);
    ro.observe(article);
    document.fonts?.ready.then(schedule);

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      ro.disconnect();
      if (frame) cancelAnimationFrame(frame);
      anchors.forEach((el) => {
        el.removeAttribute('data-dot');
        el.removeAttribute('data-dot-active');
      });
    };
  }, []);

  return <span ref={ref} className={styles.dot} aria-hidden="true" />;
}
