# Design

## Direction — Nocturne Orbit

**Modernized aesthetic salon** — editorial and warm, with Tron's geometry and light discipline but
none of its flash. It should read as a fashion house that happens to be lit by a machine, not as a
sci-fi film.

Chosen from five whole-page directions in
[`design/directions/`](design/directions/index.html), which remain in the repo as the record of what
was considered. **Nocturne Orbit** commits to circular composition, orbiting copy, full-bleed image
texture, and soft volumetric washes. It gives up hard-grid clarity for atmosphere.

| | |
|---|---|
| Display | **Cormorant Garamond** (added — one serif family at three weights) |
| Body | Inter Tight |
| Mono | JetBrains Mono |

Restraint is still the point. See [ADR 0003](decisions/0003-tron-geometry-in-brand-copper.md) for why
the palette stays copper and never becomes cyan.

## Palette

Derived from the supplied brand assets, not invented.

| Token | Value | Use |
|---|---|---|
| Ink | `#0B0A09` | Near-black background |
| Copper | `#B0703C` | Primary accent, borders, CTA |
| Gold | gradient | Wordmark, highlights, active state |
| Cream | warm off-white | Body text |

## Brand assets

`public/brand/` holds PNG sources served through `next/image`, which negotiates format and size on
its own — do **not** hand-build a WebP pipeline.

| Asset | Size | Use |
|---|---|---|
| `Navbar.png` | 500×500 (1:1) | Logo mark — **desktop** navbar |
| `Navbar Text.png` | 612×408 (1.5:1) | Wordmark — **mobile** navbar |
| `Hero.png` | 1717×916 | Hero background |
| `Location.png` | 1822×863 | Source for the storefront crop |
| `storefront.png` | 1000×760 | Locations section |

The two navbar assets have **different aspect ratios**; they are not interchangeable, and hardcoded
`width`/`height` that suit one will clip the other.

The one real crop is `Location.png` → `storefront.png`, produced reproducibly by
`scripts/crop-storefront.ts` to remove street cues that clash with the US addresses.

## Motion

| Behavior | Spec |
|---|---|
| Page scroll | Normal browser scrolling. Nothing intercepts wheel, touch, or key events |
| Anchor navigation | Native `html { scroll-behavior: smooth }` |
| Component motion | Motion for React |
| Reduced motion | `prefers-reduced-motion` resets `scroll-behavior` to `auto` |

Section snapping was removed along with GSAP
([ADR 0007](decisions/0007-normal-scrolling-replaces-section-snapping.md)). Scroll hijacking fought
the user's own scrolling habits, and the engine required every scroll-adjacent feature to be written
twice.

## Layout

**Section order:** Navbar → Hero → About → Services → Locations → FAQ → Contact → Footer.

FAQ precedes Contact so objections are answered before the ask.

**Panels.** Every section is *at least* one viewport tall (`min-height: 100svh`) and grows with its
content. Contact and the Footer share the last screen. Each section must declare its own
`overflow-hidden` — the decorative orbits are positioned to bleed off the right edge, and an
unclipped one widens the whole document.

| Section | Desktop | Mobile |
|---|---|---|
| Services | 3 columns — Cuts & Styling, Treatments, Color Services | 2-page carousel: (Cuts & Styling + Treatments), then (Color Services) |
| Locations | 2×2 grid | Single-column list of all four branches — **not** a carousel |

Full-height panels are a hard content budget. Weekly hours are shown as grouped ranges rather than
seven rows, and services show name/duration/price without descriptions. Both still reach the agent in
full through the knowledge base — the site just stops shouting them.

**Floating call button:** desktop bottom-right, labeled. Mobile bottom-right, icon-only ~56px, above
`env(safe-area-inset-bottom)`; collapses on scroll-down, re-expands on scroll-up. No full-width
bottom bar — it fights browser chrome and reads as an ad.

## Gigi

The voice agent is named **Gigi**. Pronouns: **she/her**.

The name lives in `content/` and therefore reaches the generated knowledge base, so the live agent
introduces itself as Gigi too — the site and the voice do not disagree. See
[architecture.md](architecture.md#content-is-the-single-source-of-truth).

Copy treats her as a named receptionist, not a mascot: "Talk to Gigi. She checks real availability."
Not "the voice agent", not a product feature.

**Her name does not replace the description in accessible names.** The floating button announces
"Book now — call Gigi, the Glow & Go voice agent". A screen-reader user who has never seen the site
does not know who Gigi is, and still needs to be told a microphone is about to open.

## The call modal

A hologram in copper/gold on near-black: scanlines, volumetric glow, floating projection. Sci-fi
*form* in *brand color*.

It is **centered in the viewport**. Through v0.1.0 it was anchored to the floating button with a
projection cone; the cone was removed in v0.1.1 when the panel was centered, because a beam
originating from nothing is worse than no beam.

## Accessibility

Not a finishing pass — a constraint.

- Visible label and accessible name may differ where the visible text is short for design reasons.
  The floating button reads "Book Now" but announces "Book now — call the salon voice agent", because
  a screen-reader user deserves to know a microphone is about to open.
- Scrolling must never trap keyboard navigation. Nothing intercepts key events.
- `prefers-reduced-motion` is honored throughout.
