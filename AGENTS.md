# AGENTS.md — Glow & Go Voice Agent

## What this is

A portfolio demo by **James Raven Tabag**: a fictional LA hair salon whose main feature is an
**ElevenLabs voice agent** that books appointments via **n8n** into **Google Sheets**, and answers
inquiries from a knowledge base.

## Codex's role

Codex is the **implementation and testing agent**.

- Implement **only the chunk assigned by Claude**. Do not expand scope or start another chunk
  without Claude's instruction.
- Inspect the relevant code and existing structure before editing.
- Ask Claude when an important implementation decision is unclear. Do not assume.
- **Do not stage or commit.** Claude handles Git.
- Wait for Claude's review before further changes or the next chunk.

### After each chunk

Run only: **lint, type-check, build, relevant unit tests.** Fix failures caused by your chunk;
report unrelated or environmental failures rather than fixing them. Report to Claude: **files
changed, work completed, results of each check.**

Run targeted Playwright tests after the full feature is implemented, and the full suite before
release — **only when Claude instructs**.

## Code standards

- Separate distinct responsibilities into focused modules: presentation, state, logic, data access,
  configuration, and external integrations.
- Consistent, descriptive names for variables, functions, classes, and files.
- Production-quality code, not quick fixes.
- Avoid unnecessary abstractions, dependencies, duplication, and overengineering. Keep it simple but
  extensible. DRY, KISS, SOLID where they genuinely apply.
- Comment only to explain non-obvious decisions or constraints the code can't show.
- Prioritize maintainability, accessibility, responsive behavior, and clear error handling.
- Keep docs short and understandable to someone new to the project.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind, shadcn/ui, Motion for React, Lucide |
| Voice | ElevenLabs Agents, `@elevenlabs/react`, browser mic over WebRTC |
| Agent UI | ElevenLabs UI (shadcn-native): `orb`, `live-waveform`, `transcript-viewer` |
| Automation | n8n (Webhook + Google Sheets nodes) |
| Data | Google Sheets |
| Deploy | Vercel (site), n8n on VPS via Docker, ElevenLabs-hosted agent |

## Architecture — read before implementing

**Webhook tools are server-side.** ElevenLabs hosts the agent and calls n8n directly:

```
Browser ──WebRTC──> ElevenLabs Agent ──webhook──> n8n ──> Google Sheets
```

The browser is **not** in the booking path. The Next.js app holds **no booking backend and no
secrets** in live mode. The four tools — `check_availability`, `create_booking`,
`reschedule_booking`, `cancel_booking` — are agent-side webhook tools, **not** client tools.

**Mock layer.** `app/api/mock/*` stands in for n8n in simulated mode and doubles as the executable
contract spec n8n must satisfy. `NEXT_PUBLIC_AGENT_MODE=simulated|live` selects.

**Knowledge base** is generated from `content/` so the site and the agent can never drift.

### Do not assume the SDK surface

`@elevenlabs/react` documents **two** shapes: `useConversation({ agentId })` with
`startSession({ clientTools })`, and a newer `ConversationProvider` + `useConversationControls` /
`useConversationStatus`. **Verify against the installed version** before wiring. Report which you
found.

### Use the ElevenLabs UI components

Do **not** hand-roll a canvas visualizer. Install and restyle:

```bash
npx shadcn@latest add https://ui.elevenlabs.io/r/orb.json
npx @elevenlabs/cli@latest components add live-waveform
npx @elevenlabs/cli@latest components add transcript-viewer
```

`Orb` accepts `agentState` (`thinking|listening|talking`) and `getInputVolume`/`getOutputVolume`.

## Constraints that are requirements, not preferences

- **The simulated-mode badge must always be visible in simulated mode.** James's name is on the
  disclaimer; an unlabeled scripted "AI" misrepresents his work. Playwright asserts it.
- **Cancel/reschedule requires a booking reference code.** Never authorize on name alone.
- **The public sheet carries synthetic data only.** The booking UI warns against real details.
- Every page carries the demo disclaimer crediting James Raven Tabag.

## Design

From the supplied brand assets: near-black `#0B0A09`, copper `#B0703C`, gold-gradient wordmark, warm
cream text. Editorial and warm — brass, hard warm light, backlit ovals. The call modal is a
hologram in **copper/gold on near-black — not cyan**.

Brand assets live in `public/brand/` as PNG sources, served via `next/image` — which negotiates
format and size on its own, so do **not** hand-build a WebP pipeline. The one real crop is
`Location.png` → `public/brand/storefront.png`, produced reproducibly by `scripts/crop-storefront.ts`
to remove street cues that clash with the US addresses.

Section order: Navbar → Hero → About → Services → Locations → FAQ → Contact → Footer.

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
