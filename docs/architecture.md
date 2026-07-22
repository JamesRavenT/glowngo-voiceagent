# Architecture

## The booking path does not include the browser

This is the single most important thing to understand about this project.

```text
Browser ──WebRTC──> ElevenLabs Agent ──webhook──> n8n ──> Google Sheets
   │                                                          │
   └── @elevenlabs/react renders orb/waveform/transcript      └── public read-only sheet
```

ElevenLabs **hosts** the agent and calls n8n directly, server to server. The four tools —
`check_availability`, `create_booking`, `reschedule_booking`, `cancel_booking` — are agent-side
**webhook tools**, not client tools.

The consequence is a large simplification: in live mode the Next.js app has **no booking backend and
holds no booking secrets**. It renders the call UI and nothing else. Cloudflare Workers serves a
static-ish site via `@opennextjs/cloudflare`; the credentials live in n8n. See
[ADR-0005](decisions/0005-cloudflare-workers-via-opennext.md).

## The mock layer

`app/api/mock/*` stands in for n8n in simulated mode and doubles as the **executable contract
specification** that the real n8n workflow must satisfy. It supports the demo and the tests; it is
**not** a dependency of the live booking path.

`NEXT_PUBLIC_AGENT_MODE=simulated|live` selects between them. Live mode requires both
`NEXT_PUBLIC_AGENT_MODE=live` **and** a non-empty agent ID — any other combination falls back to
simulated, so a missing ID can never ship a dead Call button.

## Content is the single source of truth

`content/` is typed and invented end to end. `pnpm generate:kb` generates
`integrations/knowledge-base.md` from it, which is uploaded to the ElevenLabs agent.

This is why the site and the agent cannot drift: they are the same data. It also means **changing
`content/` changes what the agent knows**. A field added for the UI's benefit (service categories,
for example) flows into the agent's vocabulary. That is usually desirable, but it is never
UI-only — regenerate the knowledge base and re-upload it.

The inverse also holds: removing something from the *UI* does not remove it from the agent. Stylists
are no longer listed on the Locations section as of v0.1.1, but they remain in `content/stylists.ts`
and in the knowledge base, because per-stylist availability is how booking works.

## Modes

| Mode | Call behavior | Booking |
|---|---|---|
| `simulated` (default) | Scripted ~18s conversation behind a visible badge | `app/api/mock/*` |
| `live` | Real WebRTC session with the hosted agent | ElevenLabs → n8n → Sheets |

## SDK caution

`@elevenlabs/react` documents **two** shapes: `useConversation({ agentId })` with
`startSession({ clientTools })`, and a newer `ConversationProvider` + `useConversationControls` /
`useConversationStatus`. Verify against the installed version before wiring; do not trust either
documented shape on its own.

## Layout and scroll

As of v0.1.1 the page is a **snap-scrolled sequence of full-height panels** driven by GSAP
ScrollTrigger ([ADR 0001](decisions/0001-gsap-for-section-snapping.md)). Every section occupies one
viewport, except the final panel, which shares one screen between Contact and the Footer.

Two things depend on scroll position and must keep working alongside the snap: the navbar's
IntersectionObserver active-section highlighting, and the floating call button's
collapse-on-scroll-down behavior. Snapping tweens the real scroll position rather than hijacking it,
so both continue to observe normally.

## Testing boundary

The Playwright gate runs in simulated mode by design. It asserts page structure and navigation,
responsive floating-call behavior, keyboard and focus accessibility, the always-visible simulated
badge, deterministic transcript timing, and the mock webhook contracts.

It does **not** assert microphone permissions, WebRTC connectivity, ElevenLabs model behavior, n8n
availability, Google credentials, or live writes to Sheets. Those need a manual smoke test after
wiring — see [runbook.md](runbook.md).
