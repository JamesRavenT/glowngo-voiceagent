# 0001 — GSAP ScrollTrigger for section snapping

**Status:** Accepted (v0.1.1) · **Date:** 2026-07-16

## Context

Sections should snap as you scroll, but smoothly — not abruptly. The stack already includes Motion
for React, and the obvious zero-dependency answer is the browser's own
`scroll-snap-type: y proximity`.

## Decision

Add **GSAP + ScrollTrigger** (with `@gsap/react`) and drive section snapping with it.

## Why not CSS scroll-snap

**CSS scroll-snap gives no control over snap duration.** The browser decides how long the snap takes,
and there is no property to change it. That is exactly the complaint that started this: native
snapping felt too fast.

GSAP exposes it directly:

```js
snap: {
  snapTo: /* offset-based function */,
  duration: { min: 0.7, max: 1.4 },  // velocity picks within the range
  delay: 0.05,
  ease: "power2.inOut",
  directional: true,
}
```

There is no CSS equivalent. Motion has no scroll-snapping primitive with duration control either.

## Why not Motion

Motion animates components; it does not offer a scroll-snap mechanism of this kind. Using it here
would mean hand-rolling velocity-aware snapping — more code than the dependency it avoids.

## Consequences

- A second animation library ships. Accepted: Motion stays for component-level motion, GSAP owns
  scroll. The boundary is "does it respond to scroll position".
- ScrollTrigger tweens the real scroll position rather than replacing it, so the navbar's
  IntersectionObserver and the floating button's scroll listener keep working.
- `useGSAP` from `@gsap/react` auto-reverts ScrollTriggers on unmount and is SSR-safe. Use it rather
  than raw `useEffect`.
- `prefers-reduced-motion` must disable snapping entirely.
- Scroll animation is a known source of Playwright flake. The release gate runs with reduced motion.
- Snap uses an **offset-based `snapTo` function**, not `1/(n-1)`. Equal-height panels make the simple
  form work today, but it breaks silently the first time a section changes height.

## Notes

An argument was raised during planning that `pnpm check:bloat` guards against added dependencies.
That was wrong — it measures repository *directory* sizes and allow-lists `node_modules`. It has no
opinion on dependency count.
