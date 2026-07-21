# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-07-21

First production release. The **voice agent works end to end** — browser → ElevenLabs →
authenticated n8n → Google Sheets — and the live-call behaviours (a real booking, the silence
flow, no thinking-aloud) are confirmed against the deployed agent. Two bodies of work land here:
the voice agent going live (2026-07-20) and the earlier retarget of the n8n deployment to Google
Cloud.

### The agent went live

The booking chain now works from browser to Google Sheets. Getting there meant fixing a deployed
n8n workflow that was **non-functional in three separate ways** — see
[v1.0.0-release-checklist.md](v1.0.0-release-checklist.md) for the full record.

#### Added
- **Consent gate before the call.** The modal opens on a disclosure screen headed "Read this before
  you call"; the session starts only after the caller clicks through. Gigi no longer says any of it
  aloud. See [ADR-0006](decisions/0006-consent-gate-carries-the-spoken-disclosure.md).
- **Ringtone and end sound.** `public/audio/ring.wav` loops while connecting, `end.wav` plays once
  on hangup. Converted to mono 24 kHz (890 KB → 223 KB, 853 KB → 213 KB); the ringtone loops, so
  size mattered.
- **Post-call state** — thank-you plus a "Glow & Go Bookings" link to the sheet. The transcript
  stays visible beneath it, because the caller may still need to read their booking reference.
- **Minimize instead of hang up.** Only the explicit End call button ends a call. Escape, backdrop
  and close minimize while a call is live; the floating button morphs into a pulsating bubble that
  reopens it. Focus moves to the bubble, so Escape still has a keyboard-reachable destination.
- **Progressive transcript reveal** for agent messages, paced to text length. A reveal over text
  that already arrived — the SDK exposes no token-level partials — and visual only, since mutating
  an `aria-live` region per character makes it unusable with a screen reader.
- **Sentry error monitoring**, errors only: `tracesSampleRate: 0`, no replay or tracing. Inert
  without a DSN, and source-map upload is conditional so a missing token cannot fail the build.
- **Booking tool IDs in the knowledge base.** The agent's webhook tools take machine IDs, but the
  KB carried only labels. "Blowout & Style" is `blowout`, not `blowout-style` — the agent was
  guessing, and n8n rejects unknown IDs.
- **Cloudflare Workers Builds**, so pushes to `main` deploy.
- [`artifacts/elevenlabs/system-prompt.md`](../artifacts/elevenlabs/system-prompt.md) — the system
  prompt is now version-controlled. It previously existed only in the ElevenLabs dashboard.
- Drift test asserting the n8n workflow's hardcoded durations and stylist tables match `content/`.

#### Fixed
- **The live n8n workflow was inactive**, so every production webhook 404'd.
- **`create_booking` wrote blank rows** — `Append Booking` had been hand-edited in the n8n UI to
  `mappingMode: defineBelow` with an empty map. The UI silently flips this when the column panel is
  opened, and the workflow keeps returning HTTP 200 while writing nothing.
- **`reschedule_booking` could not find its row** — `matchingColumns` was empty.
- **An empty bookings sheet returned HTTP 500.** A node emitting zero items halts the chain in n8n,
  so the Code node never ran. The execution still logged `success`. Fixed with `alwaysOutputData`.
- **The agent spoke its reasoning aloud**, narrating prompt instructions to callers verbatim.
- **The agent repeated itself** during silences (`turn_timeout` was 7s). Now 10s, with a two-stage
  check-in-then-close, ending via the `end_call` tool.
- **Section headings hid under the fixed navbar.** No `scroll-margin` existed anywhere; every
  section was affected. The GSAP snap calculation needed the same offset, as it positions panels
  itself and ignores CSS.
- **The e2e suite silently changed behaviour based on `.env`.** `test:e2e` builds first, and
  `NEXT_PUBLIC_*` inline at build time — so a developer with live credentials got a suite that
  attempted real voice calls. `build:e2e` now pins simulated mode.
- **Cloudflare CI could not install dependencies** — `pnpm-workspace.yaml` carried
  `ignoredBuiltDependencies` with no `packages` field. `packageManager` is now pinned so CI and
  local use the same pnpm.

#### Security
- **The n8n webhooks were unauthenticated** — anyone with the URL could write to the sheet. Header
  Auth is now active on all four nodes with the matching header on all four ElevenLabs tools.
  Verified: authenticated lifecycle passes, unauthenticated returns `403`.

#### Changed
- Services eyebrow reads "What we offer".
- Ringtone plays at half volume.
- `runbook.md` §6 previously advised against an n8n MCP. That was wrong, and the reasoning is
  recorded rather than deleted — reading live state is precisely what hand-import cannot do, and it
  is what surfaced all three workflow faults.

### The n8n deployment moved to Google Cloud

Retargeted the **n8n deployment** from Oracle Cloud to **Google Cloud Compute Engine**. No
application code changed — this is deployment config and docs only. The frontend stays on Cloudflare
Workers.

### Added
- [`deploy/n8n/`](../deploy/n8n): a Docker Compose stack running **n8n + Caddy** (automatic HTTPS),
  an idempotent `setup.sh` (apt update, Docker + Compose, 2 GB swap, `compose up -d`), a `backup.sh`
  (consistent SQLite snapshot + `.env`, 7-archive retention), and `.env.example`.
- [`docs/deployment-google-cloud.md`](deployment-google-cloud.md): full VM guide — create the
  e2-micro, firewall (only 22/80/443), browser SSH, DNS with an ephemeral IP, start/stop, logs, safe
  updates, backup/restore, low-memory troubleshooting, and HTTPS webhook verification.

### Changed
- n8n runs SQLite on a persistent volume (no Postgres — the e2-micro is memory-constrained), behind
  Caddy instead of Traefik, with n8n bound to `127.0.0.1` so only 80/443/22 are ever public.
- `runbook.md` §3 and the cost table, and the README "Going live" step, now point at Google Cloud.
- `.gitignore` excludes `deploy/n8n/backups/` (archives contain `.env`).

## [0.1.3] — 2026-07-17

Retargeted deployment from Vercel to Cloudflare Workers. No application code changed —
`app/`, `components/`, and `content/` are untouched. See
[ADR-0005](decisions/0005-cloudflare-workers-via-opennext.md) and [plans/v0.1.3.md](plans/v0.1.3.md).

### Changed
- **Deploy target is Cloudflare Workers** via `@opennextjs/cloudflare` 1.20.1 (+ `wrangler` 4.112.0).
  Static export was rejected: Next.js static export supports only `GET` route handlers, and all four
  mock routes are `POST` — it would have broken the n8n contract spec and the `test:e2e` suite.
  `@cloudflare/next-on-pages` was rejected: it requires the Edge runtime.
- `.npmrc` pins `node-linker=hoisted`. **Required for the adapter build on Windows** — the adapter
  recreates a symlink per traced file under pnpm's default linker, which Windows refuses without
  Developer Mode (`EPERM`). Do not remove it as tidy-up; see ADR-0005.
- `eslint.config.mjs` ignores `.open-next/**` and `.wrangler/**`. The explicit `globalIgnores`
  overrides `eslint-config-next`'s defaults, so the generated bundle was being linted (9,431
  problems).
- Stale Vercel references removed from docs, `.gitignore`, and the `lib/booking/store.ts` comment.

### Added
- Image optimization through the Cloudflare `IMAGES` binding — Workers has no `sharp`. Verified on
  workerd: the hero drops from 1,938,257 bytes of PNG to 59,390 bytes of WebP, a 97% reduction.
  `next/image` call sites are unchanged.
- `preview`, `deploy`, and `cf-typegen` scripts. `build`, `dev`, `start`, and `test:e2e` are
  untouched — local development is unchanged (`pnpm dev` still serves `localhost:3000`).

### Fixed
- **`build` now runs `next build --webpack`.** Next.js 16 builds with Turbopack by default, and
  `@opennextjs/cloudflare` 1.20.1 cannot resolve Turbopack's server chunks — every route reaching the
  Next server returned HTTP 500 with `ChunkLoadError`, in local preview *and* on deployed Cloudflare
  infrastructure. 1.20.1 is the latest published adapter, so upgrading was not an option.
  `test:e2e` now runs `pnpm build` rather than a bare `next build`, so the tested artifact cannot
  drift from the shipped one. `dev` stays on Turbopack for fast HMR. Do not remove the flag —
  ADR-0005.

### Deployed
- **Live at <https://glowngo-voiceagentdemo.site>**, with
  <https://glowngo-voiceagent.jraven-tabag.workers.dev> as a fallback. Registrar stays Vercel;
  nameservers moved to Cloudflare, because Workers cannot serve a domain whose nameservers it does
  not manage.
- `www` redirects to the root (301, path and query preserved) via a Redirect Rule plus a proxied
  placeholder record.
- `wrangler.jsonc` pins `workers_dev: true` and `preview_urls: true` — both default off once a route
  exists, which silently 404'd the fallback URL.

Verified in production: homepage 200 with a valid certificate and the disclaimer plus services
prerendered into the HTML, `check-availability` returning real slots, an unknown booking reference
correctly refused with 404, and the hero served as 49KB of WebP (from 1.9MB).

Runbook §0 records the DNS specifics — notably that Cloudflare's onboarding scan imports the old
host's records and blocks the Custom Domain with `Conflict 409`, and that Vercel's current IPs are
`216.198.79.x` / `64.29.17.x`, not the `76.76.21.21` everyone looks for.

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
