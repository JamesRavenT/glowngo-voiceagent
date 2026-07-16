# 0004 — The disclaimer moves to the hero

**Status:** Accepted (v0.1.1) · **Date:** 2026-07-16

## Context

v0.1.1 reduces the footer to a single copyright line. But a standing requirement says every page
carries a disclaimer that this is a demonstration built by James Raven Tabag, and through v0.1.0 that
disclaimer lived **in the footer** — asserted by `e2e/page-and-navigation.spec.ts`.

The new hero disclaimer as originally briefed covered fictionality (names, services, history,
locations are invented) but **not attribution**. Stripping the footer would have silently dropped
James's credit from the site.

## Decision

The **hero** disclaimer carries both fictionality and attribution. The footer becomes copyright-only.
The Playwright assertion moves from the footer to the hero rather than being deleted.

## Why

The requirement is about honesty, not about the footer. What matters is that the credit and the
"this is a demo" statement are present and visible — not which element holds them. The hero is
arguably a better home: it is seen first, and a footer disclaimer on a snap-scrolled site may never
be reached.

The copyright line still names James, so attribution appears twice. That is fine.

## Consequences

- `e2e/page-and-navigation.spec.ts` targets the hero. The assertion's *strength* must not weaken.
- `salon.disclaimer` stays in `content/` as the single source of the text.
- `e2e/floating-call-button.spec.ts` asserted the floating button does not overlap the footer
  disclaimer. That element no longer exists; the check retargets to the copyright line.
- Any future redesign of the hero inherits a correctness requirement, not a decoration.
