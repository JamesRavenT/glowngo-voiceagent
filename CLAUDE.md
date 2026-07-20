# CLAUDE.md — Glow & Go Voice Agent

## What this is

A portfolio demo by **James Raven Tabag**: a fictional LA hair salon whose main feature is an
**ElevenLabs voice agent** that books appointments via **n8n** into **Google Sheets**, and answers
inquiries from a knowledge base. The site is the stage; the voice agent is the act.

Every page must carry a disclaimer that this is a demonstration built by James Raven Tabag.

## Claude's role

Claude is the **project lead and manager**. Claude does **not write or edit application code**.

- Turn requests into a clear implementation plan split into small, manageable chunks.
- **Always use Context7 when planning libraries** — never plan an API surface from memory.
- Consult Codex when evaluating technical approaches or implementation details.
- Ask the user when an important decision is unclear. Do not assume.
- Present the plan and wait for approval before implementation.
- After approval, send **one chunk at a time** to Codex via the CLI, with clear scope,
  requirements, and expected result.
- Review Codex's changes and test results. Ask Codex to fix problems before continuing.
- **Claude owns Git.** Commit each successfully completed chunk separately.
- Move to the next chunk only after the current one passes its checks and is committed.
- After the full feature is implemented, have Codex run targeted Playwright tests.
- Before release or deployment, have Codex run the full Playwright suite.

Claude may write documentation (this file, `AGENTS.md`, `README.md`) and run Git.

## Principles

Keep plans and docs short and clear to someone new to the project. Avoid unnecessary abstractions,
dependencies, and premature overengineering. Prioritize maintainability, accessibility, responsive
behavior, and production quality. Prefer simple, extensible solutions — DRY, KISS, SOLID where they
genuinely apply.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind, shadcn/ui, Motion for React, Lucide |
| Voice | ElevenLabs Agents, `@elevenlabs/react`, browser mic over WebRTC |
| Agent UI | ElevenLabs UI (shadcn-native): `orb`, `live-waveform`, `transcript-viewer` |
| Automation | n8n (Webhook + Google Sheets nodes) |
| Data | Google Sheets |
| Deploy | Cloudflare Workers via `@opennextjs/cloudflare` (site), n8n on VPS via Docker, ElevenLabs-hosted agent |

## Architecture — read before planning

**Webhook tools are server-side.** ElevenLabs hosts the agent and calls n8n directly:

```
Browser ──WebRTC──> ElevenLabs Agent ──webhook──> n8n ──> Google Sheets
```

The browser is **not** in the booking path. The Next.js app therefore holds **no booking backend
and no secrets** in live mode. The four tools — `check_availability`, `create_booking`,
`reschedule_booking`, `cancel_booking` — are agent-side webhook tools, not client tools.

**Mock layer.** `app/api/mock/*` stands in for n8n in simulated mode and doubles as the executable
contract spec n8n must satisfy. `NEXT_PUBLIC_AGENT_MODE=simulated|live` selects.

**Knowledge base** is generated from `content/` so the site and the agent can never drift.

## Locked decisions

Agreed with the user. Do not silently revisit these.

| Area | Decision |
|---|---|
| Call | Browser mic / WebRTC only. No phone number. |
| No keys | Scripted simulated conversation behind a visible "Simulated preview — no live agent connected" badge. |
| Salon | Fictional US chain, 4 branches in one LA metro, invented addresses, `America/Los_Angeles`. |
| Booking | Per-stylist availability + real service durations. 3 stylists/branch, 12 total, phonetically distinct names. "Any stylist" is the default path. |
| Auth | Booking reference code (e.g. `GG-4821`) required to cancel or reschedule. |
| Sheet | Public link, synthetic seed data only. |
| Modal | Hologram in brand copper/gold on near-black — **not** cyan. |
| Content | Fully invented; `content/` is the single typed source of truth. |
| Tests | Playwright asserts UI + tool contracts against a mocked SDK. No real voice. |

**The simulated-mode badge is a correctness requirement, not decoration.** James's name is on the
disclaimer; an unlabeled scripted "AI" would misrepresent his work. Playwright asserts it.

## Design

From the supplied brand assets, not invented: near-black `#0B0A09`, copper `#B0703C`, gold-gradient
wordmark, warm cream text. Editorial and warm — brass, hard warm light, backlit ovals.

Section order: Navbar → Hero → About → Services → Locations → FAQ → Contact → Footer.
FAQ precedes Contact so objections are answered before the ask.

Floating call button: desktop bottom-right, labeled. Mobile bottom-right, icon-only ~56px, above
`env(safe-area-inset-bottom)`; collapses on scroll-down, re-expands on scroll-up.

## Commands

```bash
pnpm dev          # dev server
pnpm lint         # eslint
pnpm typecheck    # tsc --noEmit
pnpm build        # production build
pnpm test         # unit tests
pnpm test:e2e     # playwright
```

## Documentation

`docs/` is the project's documentation and lives in the repo. Plans, decisions, and the runbook all
belong there — never in a path outside the repository.

| Where | What |
|---|---|
| `docs/plans/` | Implementation plan per release. Current: `docs/plans/v0.1.3.md`. |
| `docs/decisions/` | ADRs. Write one when a decision has reasoning worth keeping. |
| `docs/CHANGELOG.md` | Update as part of the release chunk, not after. |
| `docs/architecture.md`, `design.md`, `requirements.md` | Human-facing reference. |

This file and `AGENTS.md` deliberately restate some of `docs/`. Agents read them directly and do not
reliably follow links — keep both in sync when architecture changes.

## Chunk status

Shipped: **v0.1.3** — Cloudflare Workers deploy target (`docs/plans/v0.1.3.md`, ADR-0005),
**v0.1.2** — review fixes (snap, mobile menu, services, FAQ, animations), **v0.1.1** — design and
structure pass (`docs/plans/v0.1.1.md`), **v0.1.0** (`docs/plans/v0.1.0.md`). See
`docs/CHANGELOG.md` for what changed.

**Unreleased (deployed, not yet tagged):** the voice agent works end to end — browser → ElevenLabs
→ authenticated n8n → Google Sheets. Consent gate, ringtone, minimize-instead-of-hangup, progressive
transcript, Sentry, and CI deploys. `package.json` still reads `0.1.3`; v1.0.0 is not cut until a
real call is confirmed. See `docs/v1.0.0-release-checklist.md` and ADR-0006.

**The consent gate is load-bearing, not decoration.** It is the only proactive demo disclosure a
live caller gets — Gigi no longer says it aloud (ADR-0006). Never add a path that auto-starts a call
and skips it.

**Build gotchas that look like cruft — do not "clean up". All four are load-bearing:**

- **`build` is `next build --webpack`.** Next 16 defaults to Turbopack; the Cloudflare adapter cannot
  resolve Turbopack's server chunks and every route 500s with `ChunkLoadError`. `dev` stays on
  Turbopack.
- **The e2e build pins simulated agent mode.** `build:e2e` runs the same webpack build while
  overriding live credentials from `.env`; otherwise a developer's live configuration makes the
  suite attempt real voice calls.
- **`.npmrc` pins `node-linker=hoisted`** — without it the adapter build fails on Windows with
  `EPERM` on symlink.
- **`eslint.config.mjs` must ignore `.open-next/**`** — the explicit `globalIgnores` overrides
  eslint-config-next's defaults.
- **`pnpm-workspace.yaml` must keep its `packages` field**, and `package.json` its
  `packageManager` pin. This is not a monorepo; the file exists only to hold
  `ignoredBuiltDependencies`. Omitting `packages` is legal per pnpm's docs and installs fine
  locally, but Cloudflare CI fails with `ERROR packages field missing or empty`.

**Deploying:**

- **`pnpm deploy` is not the deploy script.** It is a reserved pnpm workspace command that shadows
  it and fails with `ERR_PNPM_NOTHING_TO_DEPLOY`. Use **`pnpm run deploy`** — or just push, since
  Cloudflare Workers Builds deploys `main`.
- **`wrangler deploy` overwrites dashboard configuration**, including build variables. Prefer
  letting CI deploy.
- **A Workers build reports `status: stopped` whether it passed or failed.** Read the logs.
- **A build that omits `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` silently falls back to simulated mode** —
  normal-looking site, no error. Check the badge or grep the bundle after deploying.

`NEXT_PUBLIC_*` are inlined at build time, so on Cloudflare they go in **build** variables, never
Wrangler `vars`. ADR-0005 has the reasoning for all of it.

**Debugging a Worker:** local `wrangler dev` hides the worker's `console.error`
(`proxyLogsToController: false`). If preview fails and won't say why, deploy and
`wrangler tail` — that found the Turbopack bug in 30 seconds after an hour of local guessing.
