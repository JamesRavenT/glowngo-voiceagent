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

**`.npmrc` pins `node-linker=hoisted`, and the build breaks on Windows without it.** Do not remove
that line as tidy-up.

The adapter's `copyTracedFiles` step mirrors the traced dependency tree, and recreates a symlink
whenever the source is itself a symlink:

```js
try { symlink = readlinkSync(from); } catch (e) { /* Ignore */ }
if (symlink) { symlinkSync(symlink, to); } else { copyFileAndMakeOwnerWritable(from, to); }
```

Under pnpm's default linker every package in `node_modules` is a symlink into `.pnpm/`, so this
takes the symlink branch for every file. Windows refuses symlink creation without Developer Mode or
an elevated shell, and the build dies with `EPERM: operation not permitted, symlink`. A hoisted
layout makes the sources real files, `readlinkSync` throws, and the adapter copies instead.

The alternative was enabling Windows Developer Mode — rejected as a permanent machine-wide change
imposed on anyone who clones the repo. Hoisting is committed, so it fixes the build for every
contributor and keeps local builds identical to Cloudflare's Linux CI.

Trade-off accepted: a flat `node_modules` no longer catches imports of undeclared transitive
dependencies. Low risk here — small app, committed lockfile.

**Also: eslint needs its own ignore.** `.gitignore` excluding `.open-next/` does nothing for eslint,
and `eslint.config.mjs` overrides `eslint-config-next`'s defaults with an explicit list. Without
`.open-next/**` there, `pnpm lint` lints the generated bundle and reports ~9,400 problems.

## The build must use webpack, not Turbopack — `next build --webpack`

**RESOLVED 2026-07-17.** Do not remove the `--webpack` flag from the `build` script.

Next.js 16 uses **Turbopack** for `next build` by default. `@opennextjs/cloudflare` 1.20.1 cannot
resolve Turbopack's server chunks, so **every request reaching the Next server returns HTTP 500**:

```
ChunkLoadError: Failed to load chunk server/chunks/ssr/[root-of-the-server]__1w0havz._.js
                from runtime for chunk server/app/page.js
```

`[root-of-the-server]` is Turbopack's chunk naming. OpenNext's troubleshooting page confirms it:
*"...indicates that you are using an older version of the OpenNext adapter with Turbopack builds.
Upgrade to the latest version for Turbopack support or use Webpack builds."* 1.20.1 **is** the latest
published version, so upgrading was not an option. Hence `next build --webpack`.

`test:e2e` runs `pnpm build`, not a bare `next build`, so the tested artifact can never drift from
the shipped one. `dev` deliberately stays on Turbopack for fast HMR — the split Next's own v16
upgrade guide recommends.

The flag does reach the deployed artifact: `opennextjs-cloudflare build` calls `buildNextjsApp`,
which resolves to `${packager} build` (`node_modules/@opennextjs/aws/dist/build/buildNextApp.js`) —
i.e. our `build` script.

### How this was diagnosed, and the wrong turn worth remembering

The symptom looked platform-specific and **was misdiagnosed as a Windows problem for some time.**
The adapter prints *"OpenNext is not fully compatible with Windows"* on every preview run, which is
a compelling red herring. It had nothing to do with it — the identical failure reproduced on
deployed Cloudflare infrastructure, on Linux.

These were ruled out by testing before the real cause surfaced. None were the issue:

| Hypothesis | Outcome |
|---|---|
| Stale `compatibility_date` (was 2025-03-25) | Still 500. Bump to 2026-07-17 kept anyway — it matches Cloudflare's "set to today's date" guidance |
| `global_fetch_strictly_public` breaking self-fetch | Still 500. Restored |
| Incomplete traced file copy (swallowed at debug level in `copyTracedFiles`) | Complete: 1070 files |
| Windows `MAX_PATH` truncation | Longest path 142 chars |
| Windows path separators in the bundle | None |

**What actually found it was `wrangler tail` against the deployed Worker** — 30 seconds, versus an
hour of local guessing. Local `wrangler dev` runs with `proxyLogsToController: false`, so the
worker's own `console.error` never reaches the terminal; the exception is invisible. **If a Worker
misbehaves and local preview won't say why, deploy it and tail it.** That is the lesson.

The generalisable point: a vendor warning that matches your platform is not evidence. It anchored
the investigation on the wrong variable while the real cause — a bundler default in a major version
bump — sat in a log we hadn't read yet.

Cloudflare builds on Linux, so production may well be fine. Deciding that needs a deployed smoke
test or a WSL build — neither has been run yet.
