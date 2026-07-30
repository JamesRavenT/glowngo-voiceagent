# 0007 — Normal scrolling replaces section snapping

**Status:** Accepted · **Date:** 2026-07-30 · **Supersedes:** [ADR 0001](0001-gsap-for-section-snapping.md)

## Context

[ADR 0001](0001-gsap-for-section-snapping.md) added GSAP + ScrollTrigger to snap the page through a
sequence of full-height panels. It worked, and it was the single most intricate piece of client code
in the repo: a 362-line component intercepting `wheel`, `touchstart`/`touchmove`, `keydown`, and
anchor clicks, with its own gesture cooldown, boundary locking, and a custom `sectionsnap:land` event
to keep the navbar highlight in sync.

The cost outgrew the effect. Scroll hijacking fights the user's own scrolling habits, and every
scroll-adjacent feature had to be written twice — once for the browser, once for the snap engine.

## Decision

Remove section snapping. The page scrolls normally.

- Sections keep the full-viewport look via `min-height: 100svh`, but drop the hard
  `height`/`max-height` clamp, so content grows instead of being clipped on short viewports.
- Anchor navigation is native: `html { scroll-behavior: smooth }`, with the existing
  `prefers-reduced-motion` block resetting it to `auto`.
- The navbar's active-section highlight comes from a scroll-position spy alone. The
  `sectionsnap:land` event and its module are gone.
- `gsap` and `@gsap/react` are removed from the dependency tree. Nothing else used them.

## Consequences

- **One animation library.** Motion for React owns component-level motion; nothing owns scroll.
- **The page is now taller than 6 × 100svh.** Sections size to their content once it exceeds a
  viewport, which is the point. Anything that assumed exactly-one-viewport panels is invalid.
- **Every section must clip its own horizontal overflow.** This is the load-bearing detail — see
  below.
- Carousels no longer sit inside a vertically-snapped page, which removes the nested-scroll conflict
  that motivated part of [ADR 0002](0002-embla-for-carousels.md). Embla stays; the reasoning about
  drag support and page-count semantics is unaffected.

## The overflow trap

The deleted `[data-snap-panel]` rule set `overflow: hidden` alongside its height clamp. That
clipping was doing invisible work: `.nocturne-panel::before` is a decorative orbit that at
≤ 40rem becomes `width: 90vw; right: -52vw`, deliberately bleeding off the right edge.

`hero`, `services`, `locations`, and `contact` each declare their own `overflow-hidden`. `about` and
`faq` did not — they inherited it from the panel rule. Removing that rule let their orbits widen the
document to 594px inside a 390px viewport. Chrome then widens the layout viewport to swallow the
overflow and zooms out, so `window.innerHeight` reports 1284 while `visualViewport.height` is 844.

Playwright computes click points in the visual viewport but the browser hit-tests in the layout
viewport, so every mobile click landed ~440px above its target — one test clicked the FAQ grid while
aiming at Contact's call button. The symptom looked like a layout overlap; the vertical geometry was
correct the whole time.

**If a section carries `.nocturne-panel` or any absolutely positioned decorative element, it must
declare `overflow-hidden` itself.** Use plain `overflow-hidden`, never `overflow-x-hidden` — setting
only `overflow-x` forces the computed `overflow-y` to `auto` and turns the section into a nested
scroll container.

The regression test is cheap and worth keeping in mind: at any mobile viewport,
`document.documentElement.scrollWidth` must equal its `clientWidth`.
