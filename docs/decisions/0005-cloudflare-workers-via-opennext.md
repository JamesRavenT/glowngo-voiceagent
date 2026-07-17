# 5. Deploy to Cloudflare Workers via @opennextjs/cloudflare

Date: 2026-07-17

## Status

Accepted. Supersedes the Vercel deployment target named in ADR-free prose across
`requirements.md`, `architecture.md`, and `runbook.md`.

## Context

The site was planned for Vercel. James is deploying to Cloudflare instead.

What the app actually is, verified before choosing:

- **One static page.** `app/page.tsx` plus sections. No SSR data fetching, no ISR, no middleware,
  no server actions, no cookies or headers reads.
- **Four route handlers** under `app/api/mock/*`, all `POST`.
- **Nothing in the browser calls those routes.** Confirmed by search: the only callers are
  `e2e/tool-contracts.spec.ts` (Playwright) and `app/api/mock/routes.test.ts` (vitest). Simulated
  mode plays a client-side script from `content/call.ts`; live mode talks to ElevenLabs over
  WebRTC and never touches our origin. The mock layer is an **executable contract spec for n8n**,
  not a runtime dependency.
- **`next/image`** in `navbar.tsx`, `hero.tsx`, `locations.tsx`, against local assets in
  `public/brand`.
- **No secrets.** All three env vars are `NEXT_PUBLIC_*` and inlined into the browser bundle.

## Decision

Deploy to **Cloudflare Workers** using **`@opennextjs/cloudflare`**.

The adapter supports Next.js 16 (all minors), which is what we run (16.2.10). It runs Next on the
Workers **Node.js runtime** rather than the Edge runtime, so no application code changes.

## Alternatives considered

### Static export (`output: "export"`) — rejected

The tempting one, since the site is static. It fails on a concrete point: **Next.js static export
supports only `GET` route handlers.** All four of ours are `POST`, so `next build` errors out.

The workarounds are worse than the problem. Deleting the routes destroys the contract spec and the
`test:e2e` tool-contract suite — a locked decision. Making the export conditional on an env var
means the tested build and the shipped build differ, which is exactly the drift the mock layer
exists to prevent.

### `@cloudflare/next-on-pages` — rejected

The older Pages-based adapter. It requires the **Edge runtime**, and Cloudflare now points new
Next.js projects at Workers + `@opennextjs/cloudflare` instead. Choosing a path the vendor is
steering away from, in exchange for nothing we need, is a bad trade.

## Consequences

**Good:** zero application code changes. API routes, `next dev`, and the Playwright suite all keep
working unchanged — Playwright still drives `next start`, not workerd.

**The build-time env var trap, and it is a real one.** `NEXT_PUBLIC_*` values are inlined at
**build** time. On Cloudflare they must be set as **build** variables in Workers Builds, *not* as
Wrangler `vars`, which are runtime-only and would silently do nothing. A `NEXT_PUBLIC_AGENT_MODE`
set as a Wrangler var yields a site stuck in simulated mode with no error anywhere. This is the
single most likely way the Cloudflare migration goes wrong.

**The mock API becomes publicly reachable** at `/api/mock/*`. Acceptable: the store is in-memory,
per-isolate, reset on every cold start, seeded with synthetic rows, and holds no secrets. It also
makes the n8n contract inspectable, which the runbook already leans on.

**Image optimization needs a decision** — Workers has no `sharp`. Either the Cloudflare `IMAGES`
binding (real optimization, free-tier transformation allowance) or `images.unoptimized` (free,
costs LCP on the hero). See `docs/plans/v0.1.3.md`.

**Local dev is unchanged.** The adapter is a deploy-time transform; `next dev` keeps HMR. Previewing
on the real Workers runtime is a separate, slower `opennextjs-cloudflare preview` step.
