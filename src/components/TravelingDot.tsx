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

/** A little over the transform transition, so a return home can settle. */
const FLIGHT_MS = 600;

/** A move shorter than this is a nudge, not a journey — no deformation. */
const JOURNEY_PX = 6;

type Mode = 'scroll' | 'cursor';

type Spot = { x: number; y: number; size: number };

/**
 * One accent dot that marks where the reader is.
 *
 * In `scroll` mode (a post) it discovers every heading and figure caption in
 * its parent and moves to whichever one the reader is on. In `cursor` mode
 * (the index) it is told: whatever element in its parent carries
 * `data-dot-active` is where it goes. Either way the host opens a slot for it
 * by sliding its text right, and the dot's size comes from the host's
 * `--indicator-size`, so emphasis is a stylesheet decision.
 *
 * Its home is the brand mark in the header — the one accent in the chrome.
 * While it is home it is not drawn at all; the header's own dot stands in.
 * When it leaves, it appears on that mark and flies, and the mark becomes the
 * ring it left behind. So the same dot that names the site is the one walking
 * down the page, and there is never more than one of it.
 */
export function TravelingDot({ mode = 'scroll' }: { mode?: Mode }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const dot = ref.current;
    const parent = dot?.parentElement;
    if (!dot || !parent) return;
    const ball = dot.firstElementChild as HTMLElement | null;

    // The brand mark in the header. Marked from the Header component so this
    // file does not have to know its class name.
    const home = document.querySelector<HTMLElement>('[data-dot-home]');

    // Discovery: anything that titles a piece of the page is an anchor.
    const anchors =
      mode === 'scroll'
        ? Array.from(parent.querySelectorAll<HTMLElement>('h1, h2, h3, figcaption')).filter(
            (el) => (el.textContent ?? '').trim().length > 0,
          )
        : [];
    if (mode === 'scroll') {
      anchors.forEach((el) => el.setAttribute('data-dot', ''));
      if (anchors.length < 2) return;
    }

    let frame = 0;
    let ready = false;
    let atHome = true;
    let returning = 0;
    let currentHost: HTMLElement | null = null;
    let lastX = NaN;
    let lastY = NaN;

    const setTransform = (x: number, y: number) => {
      dot.style.transform = `translate(${x}px, ${y}px)`;
      lastX = x;
      lastY = y;
    };

    /**
     * The ball is a soft body. On a real journey it gathers itself, stretches
     * along the line of travel, lands with a squash and settles. The outer
     * element only ever translates; the inner one only ever deforms, so the
     * two never fight.
     */
    const moveTo = (x: number, y: number) => {
      const dx = x - lastX;
      const dy = y - lastY;
      setTransform(x, y);
      if (!ball || !(Math.hypot(dx, dy) >= JOURNEY_PX)) return;
      ball.style.setProperty('--angle', `${Math.atan2(dy, dx)}rad`);
      ball.removeAttribute('data-squish');
      void ball.offsetWidth; // restart the animation
      ball.setAttribute('data-squish', '');
    };

    /** Land without animating — a first placement, or the start of a flight. */
    const jumpTo = (x: number, y: number) => {
      dot.removeAttribute('data-ready');
      setTransform(x, y);
      void dot.offsetWidth;
      dot.setAttribute('data-ready', 'true');
    };

    const homeSpot = (): Spot | null => {
      if (!home) return null;
      const h = home.getBoundingClientRect();
      const p = parent.getBoundingClientRect();
      return { x: h.left - p.left, y: h.top - p.top, size: h.width };
    };

    /** Where the dot sits on a host: centred in the slot, on the first line. */
    const spotFor = (host: HTMLElement): Spot => {
      const a = host.getBoundingClientRect();
      const p = parent.getBoundingClientRect();
      const cs = getComputedStyle(host);
      const fontSize = parseFloat(cs.fontSize);
      const lineHeight = parseFloat(cs.lineHeight) || fontSize * 1.4;
      const declared = parseFloat(cs.getPropertyValue('--indicator-size'));
      const size = Number.isFinite(declared) ? declared : Math.round(fontSize * 0.55);
      // The host opens a slot of PAD_EM and the dot is centred in it, at every
      // width. Hanging it outside the column on wide screens made the same
      // element behave differently depending on the viewport.
      const offset = (PAD_EM * fontSize - size) / 2;
      return {
        x: Math.round(a.left - p.left + offset),
        y: Math.round(a.top - p.top + (lineHeight - size) / 2),
        size,
      };
    };

    const settleHome = () => {
      returning = 0;
      atHome = true;
      dot.setAttribute('data-home', '');
      home?.removeAttribute('data-dot-state');
    };

    /** Fly back to the brand mark, then hand over to it. */
    const goHome = () => {
      if (atHome || returning) return;
      currentHost?.removeAttribute('data-dot-active');
      currentHost = null;
      const s = homeSpot();
      if (!s) {
        settleHome();
        return;
      }
      dot.style.setProperty('--size', `${s.size}px`);
      moveTo(s.x, s.y);
      returning = window.setTimeout(settleHome, FLIGHT_MS);
    };

    /** Go to a host — leaving the brand mark first if that is where we are. */
    const goTo = (s: Spot) => {
      if (returning) {
        window.clearTimeout(returning);
        returning = 0;
      }
      if (atHome) {
        atHome = false;
        dot.removeAttribute('data-home');
        home?.setAttribute('data-dot-state', 'away');
        const h = homeSpot();
        if (!ready) {
          // First placement lands where it is; every later one glides.
          dot.style.setProperty('--size', `${s.size}px`);
          jumpTo(s.x, s.y);
          return;
        }
        if (h) {
          dot.style.setProperty('--size', `${h.size}px`);
          jumpTo(h.x, h.y);
        }
      }
      dot.style.setProperty('--size', `${s.size}px`);
      moveTo(s.x, s.y);
    };

    const place = () => {
      frame = 0;

      if (mode === 'cursor') {
        const host = parent.querySelector<HTMLElement>('[data-dot-active]');
        if (host) goTo(spotFor(host));
        else goHome();
        ready = true;
        return;
      }

      // At the very top the dot sits on the brand mark and no heading holds a
      // slot open.
      if (window.scrollY < HOME_THRESHOLD) {
        goHome();
        ready = true;
        return;
      }

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
      goTo(spotFor(host));
      ready = true;
    };

    // Scroll events arrive faster than frames, so they are coalesced onto one.
    // The observers below are already batched by the browser, and waiting a
    // frame would only delay the flight, so they place at once.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(place);
    };
    const placeNow = () => {
      if (frame) cancelAnimationFrame(frame);
      place();
    };

    place();
    window.addEventListener('resize', schedule);
    // Anything resizing inside the parent shifts what is below it.
    const ro = new ResizeObserver(placeNow);
    ro.observe(parent);
    document.fonts?.ready.then(schedule);

    let mo: MutationObserver | null = null;
    if (mode === 'scroll') {
      window.addEventListener('scroll', schedule, { passive: true });
    } else {
      // The list tells us where to be by moving the attribute around.
      mo = new MutationObserver(placeNow);
      mo.observe(parent, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['data-dot-active'],
      });
    }

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      ro.disconnect();
      mo?.disconnect();
      if (frame) cancelAnimationFrame(frame);
      if (returning) window.clearTimeout(returning);
      home?.removeAttribute('data-dot-state');
      anchors.forEach((el) => {
        el.removeAttribute('data-dot');
        el.removeAttribute('data-dot-active');
      });
    };
  }, [mode]);

  return (
    <span ref={ref} className={styles.dot} data-home="" aria-hidden="true">
      <span className={styles.ball} />
    </span>
  );
}
