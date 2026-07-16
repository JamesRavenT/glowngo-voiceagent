# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] — 2026-07-17

Bug fixes and interaction changes from James's review.

### Changed
- **Snap scrolling is now assertive** — one wheel/swipe/arrow gesture moves exactly one section and
  locks (was free-scroll-then-settle). Trackpad momentum collapses to a single move.
  `prefers-reduced-motion` disables the hijack entirely (native scroll).
- Mobile Services shows all 12 services on one screen — the carousel is gone, and with it
  `embla-carousel-react` (ADR 0002 superseded).
- FAQ mobile stacks questions directly under the heading instead of vertically centered.
- Section eyebrows dropped the "NN /" numbering (e.g. "03 / LOCATIONS" → "LOCATIONS").
- Navbar logo enlarged.
- Locations desktop: branch blocks centered in their ovals; "Find your light." shrunk so it no longer
  overlaps the grid at laptop widths.

### Added
- Mobile menu: left-to-right gradient (dark left, transparent right) and a slide/fade entrance
  animation.
- Call modal: fade + rise entrance animation (`@starting-style`), reduced-motion instant.

### Fixed
- Mobile menu panel was see-through (covered only the 80px navbar height) because it sat inside the
  `backdrop-filter`ed header, which became its containing block; now portaled to `document.body`.
- Navbar active-section highlight lagged during the animated snap; section-snap now signals the
  landed section to the navbar.

## [0.1.1] — 2026-07-16

Design and structure pass. Plan: [plans/v0.1.1.md](plans/v0.1.1.md).

### Added
- `docs/` — architecture, design, requirements, runbook, plans, ADRs, this changelog.
- Snap scrolling between full-height sections, GSAP-driven with a deliberately slow settle
  ([ADR 0001](decisions/0001-gsap-for-section-snapping.md)).
- "Book Now" call-to-action in the hero (mobile only — desktop keeps the floating button).
- Hero disclaimer covering fictionality and attribution
  ([ADR 0004](decisions/0004-disclaimer-placement.md)).
- Service categories: Cuts & Styling, Treatments, Color Services.
- Mobile carousel for Services — 2 pages, via Embla
  ([ADR 0002](decisions/0002-embla-for-carousels.md)).
- The voice agent is named **Gigi** (she/her). Her name lives in `content/`, so it reaches the
  generated knowledge base and the live agent introduces itself as Gigi.
- `docs/design/directions/` — the five whole-page design directions considered at the v0.1.1 gate,
  kept as a record. **Nocturne Orbit** was chosen.
- **Cormorant Garamond** as the display face, from the chosen direction.

### Changed
- Hero headline: "Your chair is waiting." → "Meet your next look."
- Floating call button label: "Call the salon voice agent" → "Book Now". The accessible name stays
  descriptive — "Book now — call the salon voice agent" — so screen-reader users are still told a
  microphone is about to open.
- Call modal is centered in the viewport instead of anchored to the floating button.
- Navbar uses the `Navbar.png` mark on desktop and the `Navbar Text.png` wordmark on mobile.
- Services: 3-column layout on desktop.
- Locations: 2×2 grid on desktop; single-column list on mobile; weekly hours as grouped ranges.
- Footer reduced to a single copyright line.
- Visual direction sharpened — Tron geometry and light in brand copper
  ([ADR 0003](decisions/0003-tron-geometry-in-brand-copper.md)).
- `NEXT-STEPS.md` → `docs/runbook.md`.

### Fixed
- Mobile hamburger clipped at the right edge of the viewport.
- Navbar legibility over the hero image.

### Removed
- Stylist rosters from the Locations section. Stylists remain in `content/` and in the agent's
  knowledge base — per-stylist availability is still how booking works.
- The call modal's projection cone, which pointed at a button the modal is no longer anchored to.

## [0.1.0] — 2026-07-15

First complete build. Plan: [plans/v0.1.0.md](plans/v0.1.0.md).

### Added
- Next.js App Router site: Hero, About, Services, Locations, FAQ, Contact, Footer.
- `content/` as the single typed source of truth — salon, 4 branches, 12 stylists, 12 services, FAQ,
  hours — with `pnpm generate:kb` generating the agent knowledge base from it.
- Hologram call modal in copper/gold: orb, live waveform, transcript, call timer, focus trap.
- Simulated mode with a scripted conversation behind an always-visible badge; `live` mode behind
  `NEXT_PUBLIC_AGENT_MODE`.
- Booking domain and mock backend (`app/api/mock/*`) — per-stylist availability from real service
  durations, reference-code generation and validation.
- Integration artifacts ready to wire: n8n workflow, four ElevenLabs webhook-tool configs, Google
  Sheet schema, generated knowledge base.
- Playwright release gate covering UI and the four tool contracts.
- Operational runbook for going live.
