# 0002 — Embla for the mobile carousels

**Status:** Accepted (v0.1.1), amended 2026-07-16 — scope reduced to one carousel · **Date:** 2026-07-16

## Amendment

This ADR originally covered two carousels. After the design gate, James chose Nocturne Orbit and
asked for mobile Locations to be a **plain single-column list**, not a carousel, and mobile Services
to be **2 pages** rather than 3.

So exactly **one** carousel remains: Services, two slides. The decision stands, but honestly, it got
closer. One 2-slide carousel is thin justification for a dependency, and if this were the original
brief the CSS option would deserve another look. It stands because the reason below is architectural
rather than about page count — a nested scroll container would fight GSAP's vertical snap no matter
how many slides it has — and because shadcn's wrapper still gets us accessibility we would otherwise
hand-roll. Worth revisiting if Services ever stops being a carousel too.

## Context

Services needs a 3-page mobile carousel and Locations a 4-page one. Neither loops or autoplays.
CSS `scroll-snap-type: x mandatory` would do it in ~30 lines with no dependency.

## Decision

Use **Embla**, installed through shadcn's `carousel` component (`shadcn add carousel`), which
vendors the wrapper into the repo and leaves Embla as the only new package.

## Why not CSS scroll-snap

The reason is architectural, not aesthetic.

CSS scroll-snap creates a **real nested scroll container**. That container would sit inside a page
that GSAP ScrollTrigger is snapping vertically ([ADR 0001](0001-gsap-for-section-snapping.md)), and
the two fight over touch on mobile — exactly where the carousels live.

Embla does not scroll. It drags a container with transforms, so it creates no scroll container and
stays out of ScrollTrigger's way. Adopting GSAP is what makes Embla the *safer* option rather than
the heavier one.

Secondary: CSS scroll-snap has no mouse-drag on desktop. Embla does.

## Why shadcn's wrapper rather than `embla-carousel-react` directly

Embla's core has **no keyboard navigation or focus management** — that needs the separate
`embla-carousel-accessibility` plugin. shadcn's carousel already vendors roles and arrow-key handling,
so we get accessibility parity without a second package. shadcn is already configured in this repo.

## Consequences

- One new runtime dependency (Embla; no transitive runtime deps of its own).
- The carousel component is vendored into `components/ui/`, so it is ours to restyle.
- Carousel and page-snap interaction on touch devices needs a real device check, not just emulation.

## Unverified

Embla's exact gzipped size was not measured. It is commonly cited in the single-digit KB range; that
figure has not been confirmed for this project and no decision here rests on it.
