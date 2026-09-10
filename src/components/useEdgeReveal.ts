'use client';

import { useEffect, useRef } from 'react';

/*
 * A row's summary turning into the post's opening, drawn as one edge crossing
 * the box. Shared by the index list and by the two rows at the end of an
 * article, because a second copy of this would drift from the first.
 *
 * It is driven frame by frame rather than by a CSS transition: the masks on
 * both texts, the blur band and the accent line all read the same position,
 * and a class change cannot keep three of them in step through a reversal.
 */

/** The site's ease-out, as a function — the edge decelerates like the rest. */
const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);

/*
 * The edge is a speed, not a duration. Fixed at 840ms it crossed 807px on a
 * desktop row and about 350px on a phone — the same time over 2.3x the
 * distance, so it read as hurried on the wide one and measured on the narrow
 * one. Holding the speed exactly would put a desktop row near two seconds, so
 * the duration grows with the width but well short of proportionally, and stops
 * climbing at a point where the row is still worth waiting for.
 */
const EDGE_MS = 840;
/** The width the base duration was judged at — a phone. */
const EDGE_REF_W = 350;
const EDGE_MAX_MS = 1150;
const edgeDuration = (width: number) =>
  Math.min(EDGE_MAX_MS, EDGE_MS * Math.pow(Math.max(width, 1) / EDGE_REF_W, 0.45));

export function useEdgeReveal<T extends HTMLElement>(active: boolean) {
  const rowRef = useRef<T>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const row = rowRef.current;
    const slot = slotRef.current;
    if (!row || !slot) return;
    // A row that has never been active must not animate its way to a standstill
    // on mount — it simply is at rest.
    if (!active && !started.current) return;
    started.current = true;

    row.setAttribute('data-dir', active ? 'fwd' : 'back');
    row.setAttribute('data-run', '');

    const from = parseFloat(getComputedStyle(slot).getPropertyValue('--edge')) || 0;
    const to = active ? 100 : 0;

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      slot.style.setProperty('--edge', String(to));
      if (!active) row.removeAttribute('data-run');
      return;
    }

    let frame = 0;
    const dur = edgeDuration(slot.getBoundingClientRect().width);
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      slot.style.setProperty('--edge', String(from + (to - from) * easeOut(k)));
      if (k < 1) frame = requestAnimationFrame(tick);
      // The row is only "running" while the edge is somewhere in the middle of
      // it; once home again it goes back to being an ordinary row.
      else if (!active) row.removeAttribute('data-run');
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  return { rowRef, slotRef };
}

/**
 * Clamps the excerpt to exactly the lines the summary takes, so the box never
 * changes height. Measured, because that depends on the width.
 */
export function useSameHeight(slotRef: React.RefObject<HTMLDivElement | null>) {
  const descRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    const measure = () => {
      const lh = parseFloat(getComputedStyle(el).lineHeight) || 22.4;
      (slotRef.current ?? el.parentElement)?.style.setProperty(
        '--lines',
        String(Math.max(1, Math.round(el.offsetHeight / lh))),
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [slotRef]);
  return descRef;
}
