'use client';

import { useEffect, useRef } from 'react';
import styles from './TravelingDot.module.css';

/** Width of the slot a heading opens for the dot. Mirrors globals.css. */
const PAD_EM = 1.35;

/**
 * Below this scroll offset the reader is "at the top" and the dot rests on the
 * brand mark in the header instead of on the title.
 */
const HOME_THRESHOLD = 8;

/**
 * Marks every heading and figure caption in the article as a dot anchor, then
 * moves a single dot to whichever one the reader is currently on. The host
 * element opens a slot for it by sliding its text right.
 *
 * Size is derived from the host's own type size, so a title gets a large dot
 * and a caption a small one without any per-post configuration.
 *
 * It starts on the brand mark in the header — the one accent in the chrome —
 * and leaves the ring behind when the reader scrolls, so the same dot that
 * names the site is the one walking down the page.
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

    // The brand mark in the header. Marked from the Header component so this
    // file does not have to know its class name.
    const home = document.querySelector<HTMLElement>('[data-dot-home]');

    const ball = dot.firstElementChild as HTMLElement | null;

    let frame = 0;
    let ready = false;
    let currentHost: HTMLElement | null = null;
    let lastX = NaN;
    let lastY = NaN;

    /**
     * Move the dot, and if this is a real journey rather than a nudge, let the
     * ball deform along the line of travel: it gathers itself, stretches in
     * flight, lands with a squash and settles. The outer element only ever
     * translates; the inner one only ever deforms, so the two never fight.
     */
    const moveTo = (x: number, y: number) => {
      dot.style.transform = `translate(${x}px, ${y}px)`;
      const dx = x - lastX;
      const dy = y - lastY;
      lastX = x;
      lastY = y;
      if (!ready || !ball || !(Math.hypot(dx, dy) >= 6)) return;
      ball.style.setProperty('--angle', `${Math.atan2(dy, dx)}rad`);
      ball.removeAttribute('data-squish');
      void ball.offsetWidth; // restart the animation
      ball.setAttribute('data-squish', '');
    };

    const markReady = () => {
      if (ready) return;
      // First placement lands without animating; every later one glides.
      ready = true;
      requestAnimationFrame(() => dot.setAttribute('data-ready', 'true'));
    };

    const place = () => {
      frame = 0;
      const parent = article.getBoundingClientRect();

      // At the very top the dot sits on the brand mark, exactly over it, and
      // no heading holds a slot open.
      if (home && window.scrollY < HOME_THRESHOLD) {
        currentHost?.removeAttribute('data-dot-active');
        currentHost = null;
        home.setAttribute('data-dot-state', 'home');
        const h = home.getBoundingClientRect();
        dot.style.setProperty('--size', `${h.width}px`);
        moveTo(h.left - parent.left, h.top - parent.top);
        markReady();
        return;
      }
      home?.setAttribute('data-dot-state', 'away');

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
      const cs = getComputedStyle(host);
      const fontSize = parseFloat(cs.fontSize);
      const lineHeight = parseFloat(cs.lineHeight) || fontSize * 1.4;
      // Size comes from the host's own --indicator-size, set per heading level
      // in CSS, so emphasis is a stylesheet decision rather than a magic ratio.
      const declared = parseFloat(cs.getPropertyValue('--indicator-size'));
      const size = Number.isFinite(declared) ? declared : Math.round(fontSize * 0.55);

      // The heading opens a slot of PAD_EM and the dot is centred in it, at
      // every width. Hanging the dot outside the column on wide screens made
      // the same element behave differently depending on the viewport, which
      // is exactly the kind of seam a reader notices when resizing.
      const slot = PAD_EM * fontSize;
      const offset = (slot - size) / 2;

      dot.style.setProperty('--size', `${size}px`);
      moveTo(
        Math.round(a.left - parent.left + offset),
        Math.round(a.top - parent.top + (lineHeight - size) / 2),
      );

      markReady();
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
      home?.removeAttribute('data-dot-state');
      anchors.forEach((el) => {
        el.removeAttribute('data-dot');
        el.removeAttribute('data-dot-active');
      });
    };
  }, []);

  return (
    <span ref={ref} className={styles.dot} aria-hidden="true">
      <span className={styles.ball} />
    </span>
  );
}
