/**
 * Where the reading line sits right now, in viewport pixels.
 *
 * The line sweeps the document by scrolling, so an anchor sitting in the last
 * screenful *below* the line can never reach it — the page runs out of scroll
 * first and the line stops with it. Measured on a 1450px viewport, the closing
 * mark came to rest 228px under the line and the last three prose blocks were
 * unreachable, so both the dot and the active tick stalled a few anchors short
 * of the end. A phone only escaped it because its trailing content is taller
 * than 44% of a shorter viewport.
 *
 * So the line descends by exactly the scroll that is missing. While the page
 * can still move the deficit is zero and nothing changes; through the final
 * screenful the line slides down as the scroll runs out, which keeps the last
 * anchors in order and always lets the end be reached.
 */
export function readingLineY(fraction: number) {
  const base = window.innerHeight * fraction;
  const remaining =
    document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
  return base + Math.max(0, base - remaining);
}
