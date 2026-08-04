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

## The access gate

The whole site sits behind an access key. `components/access/access-gate.tsx` wraps the entire body
in `app/layout.tsx` — outside `CallProvider`, so the call stack never mounts while locked — and
renders the site only after the key verifies.

```text
Browser ──POST {key, project}──> verify-access-key (Supabase Edge Function)
```

This is the **one browser-side request to a third-party origin** in the app. It carries no
`Authorization` header and no secrets: the key is the visitor's own, and the project UUID is a
public identifier that is inert without one.

Verification runs on **every page load**, never on a cached answer, because a key can be revoked
between visits. Client-side route changes read the in-memory outcome; reloading re-verifies. The
gate never fails open — only an explicit `{"valid":true}` unlocks, and an outage denies as an error
without deleting the stored key.

Two consequences reach beyond the gate itself. **Content no longer exists on first paint**, so
anything reading the DOM immediately after navigation sees the checking screen — the e2e fixture
wraps `page.goto` for this reason. And the gate is deliberately **cosmetic**: the RSC payload ships
regardless, so it gates access, not confidentiality.

[ADR 0009](decisions/0009-access-gate-verifies-on-every-load.md) has the full reasoning, the four
distinct failure states, and the CORS requirements the endpoint must satisfy.

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

The page **scrolls normally**. Section snapping and GSAP were removed
([ADR 0007](decisions/0007-normal-scrolling-replaces-section-snapping.md), superseding
[ADR 0001](decisions/0001-gsap-for-section-snapping.md)).

Each section uses `min-height: 100svh`, so it fills the viewport when its content is shorter and
grows when the content is taller. There is no height clamp and nothing intercepts wheel, touch, or
key events. Anchor navigation is native `scroll-behavior: smooth`, reset to `auto` under
`prefers-reduced-motion`.

Two things still depend on scroll position: the navbar's active-section highlighting and the
floating call button's collapse-on-scroll-down behavior. Both now read the real scroll position with
nothing in between.

**Every section must clip its own horizontal overflow.** The deleted panel rule used to do this for
all of them, and the decorative `.nocturne-panel::before` orbit is positioned to bleed off the right
edge. A section that omits `overflow-hidden` widens the document, which makes mobile browsers zoom
out and desynchronizes hit-testing from layout. ADR 0007 has the full failure mode.

## Testing boundary

The Playwright gate runs in simulated mode by design. It asserts page structure and navigation,
responsive floating-call behavior, keyboard and focus accessibility, the always-visible simulated
badge, deterministic transcript timing, and the mock webhook contracts.

It does **not** assert microphone permissions, WebRTC connectivity, ElevenLabs model behavior, n8n
availability, Google credentials, or live writes to Sheets. Those need a manual smoke test after
wiring — see [runbook.md](runbook.md).
