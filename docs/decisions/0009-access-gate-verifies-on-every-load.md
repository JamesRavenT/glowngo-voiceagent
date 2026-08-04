# 0009 — The access gate verifies on every load

**Status:** Accepted · **Date:** 2026-08-04

## Context

The site is a portfolio demo, and James wants to choose who sees it. Access is granted by a key
issued out of band and checked against a shared verification endpoint:

```text
Browser ──POST {key, project}──> verify-access-key (Supabase Edge Function)
```

Keys are revocable. The owner can delete or reissue one at any time, and a visitor holding a
revoked key must stop getting in. That single requirement drives most of what follows.

## Decision

A client-side gate wraps the whole app. It verifies **on every page load**, never on a cached
answer.

- The **key** is what is stored, under `glow-and-go.accessKey` — never a `verified: true` flag.
  A flag is trivially forged in devtools, and worse, it cannot be re-checked, so revocation would
  never take effect.
- A stored key is a convenience, not proof. Every load re-posts it to the endpoint. Client-side
  route changes do not re-verify — the outcome is held in memory for the session — but reloading
  the tab does.
- The gate **never fails open**. Only an explicit `{"valid":true}` unlocks. Everything else — a
  malformed body, a 500, a network failure, a timeout — denies as an *error*, not as a rejection.
- The project UUID comes from `NEXT_PUBLIC_ACCESS_PROJECT_ID` and is never hardcoded. It is an
  identifier, not a secret, and it is inert without a valid key.

### The failure states are not interchangeable

This is the part worth keeping. Four different things can go wrong and each needs its own wording,
because the visitor's next action differs in each case:

| Situation | Response | Wording |
|---|---|---|
| Stored key now rejected | Delete it, show the gate | *expired — request a new one from the owner* |
| Freshly typed key rejected | Keep the gate, allow retry | *not valid for this project* |
| 503 / network / timeout | Keep the gate, **keep the stored key**, offer retry | *couldn't verify right now* |
| 429 | Disable submit for `Retry-After` | *too many attempts, wait n seconds* |

Telling someone their key has a typo when it was actually revoked sends them hunting for a
mistake they did not make. Deleting their key during an outage forces a reissue that was never
needed. Both were explicit design constraints, not polish.

## Consequences

- **The site is no longer server-rendered on first paint.** Content mounts only after a
  verification round-trip. Any test or script that reads the DOM immediately after navigation now
  finds the checking screen instead — this broke two Playwright specs and is why the shared e2e
  fixture wraps `page.goto` to wait for `#main-content`.
- **The gate is a speed bump, not confidentiality.** It is deliberately the cosmetic variant. Next
  ships the page's RSC payload regardless of gate state, so the markup is in the response even
  while the gate is up. That is an accepted trade: the content is invented, and
  `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` is already public in the bundle, so a server-side gate would
  not protect the one resource that actually costs money. **If genuinely private content is ever
  added, this design is not sufficient** — that needs server-side verification and a signed
  httpOnly session cookie.
- **The demo disclaimer moved onto the gate.** While locked, the gate is the only page a visitor
  sees, so it carries `salon.disclaimer` — see [ADR 0004](0004-disclaimer-placement.md).
- Verification adds a network round-trip before anything renders.

## Traps

**The project ID is parsed inside the mount effect, not during render.** The root layout is
prerendered, so parsing during render makes `pnpm build` fail whenever the variable is absent —
including CI builds that do not set it. In the effect, a missing UUID becomes a clear
"misconfigured" screen at runtime instead, with the key form disabled because no key can succeed
against an unparseable project ID.

**Posting `undefined` as `project` rejects every key** and presents as a misleading "invalid key".
This is why the variable is validated as a UUID rather than merely read.

**The one-shot guard holds the in-flight promise, not a boolean.** A boolean guard combined with an
aborting effect cleanup deadlocks under React StrictMode: the first pass starts, cleanup aborts it,
the second pass returns early on the flag, and the gate stays on "checking" forever. There is a
regression test for exactly this.

**An unexpected 200 shape must not count as a rejection.** Callers delete stored keys on a denial,
so treating `{}` or a changed response schema as `{"valid":false}` would wipe every visitor's key
the moment the endpoint changed. Only an explicit boolean `false` denies.

**The gate depends on CORS headers the endpoint must send.** It is a browser `fetch` to another
origin, so without `Access-Control-Allow-Origin` and an `OPTIONS` preflight response, every
verification fails — and it fails as *unavailable*, meaning the site shows "couldn't verify right
now" to everyone with no hint that CORS is the cause. `Retry-After` additionally needs
`Access-Control-Expose-Headers: Retry-After`, or the browser cannot read it and the 429 countdown
silently falls back to 60 seconds. None of this is fixable from this repository.

**`NEXT_PUBLIC_ACCESS_PROJECT_ID` is inlined at build time**, so on Cloudflare it belongs in
**build** variables, never Wrangler `vars` — the same rule and the same reasoning as
[ADR 0005](0005-cloudflare-workers-via-opennext.md).
