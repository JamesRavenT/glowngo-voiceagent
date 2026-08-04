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
- The project UUID comes from `NEXT_PUBLIC_ACCESS_PROJECT_ID` and the endpoint from
  `NEXT_PUBLIC_ACCESS_VERIFY_URL`. Neither is hardcoded and **the endpoint has no fallback** — a
  fallback would hide a broken build config, let a fork silently contact the production verifier,
  and make endpoint rotation appear to succeed while old bundles kept using the old URL. The UUID
  is an identifier, not a secret, and is inert without a valid key.
- **Keys are format-checked before they are sent.** Issued keys match
  `^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{3}$` — uppercase, with
  `I`, `O`, `0` and `1` excluded so they cannot be misread. The check lives in `verifyAccessKey`,
  at the request boundary, not in the form: validating in both places creates two format decisions
  that drift, and a caller that skipped the form would skip the check. The rate limit is **10
  requests per 60 seconds**, so a mistyped key must not cost one.

### The failure states are not interchangeable

This is the part worth keeping. Four different things can go wrong and each needs its own wording,
because the visitor's next action differs in each case:

| Situation | Response | Wording |
|---|---|---|
| Key is the wrong shape | Reject locally, **send nothing** | *not the right shape — use ABCD-EFGH-JKLM-NPQ* |
| Stored key now rejected | Delete it, show the gate | *expired — request a new one from the owner* |
| Freshly typed key rejected | Keep the gate, allow retry | *not valid for this project* |
| 503 / network / timeout | Keep the gate, **keep the stored key**, offer retry | *couldn't verify right now* |
| 429 | Disable submit for the back-off | *too many attempts, wait n seconds* |

A wrong key is reported as **`200 {"valid":false}`**, never a non-2xx status. Branching on
`response.ok` or on the status code would therefore report a rate limit or an outage as "your key
is wrong", telling visitors to hunt for a typo during an incident. Only the `valid` field decides
validity.

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

**There is no origin allowlist — do not reintroduce one.** The endpoint answers
`Access-Control-Allow-Origin: *`, so localhost, preview deployments, `www` and the apex all work
with no coordination with the endpoint owner. An earlier version of this ADR described an
exact-match allowlist and a 403 for unlisted origins; both are gone from the contract as of
2026-08-05. If a future change to this file adds an "origins to register" list, that is a
regression.

**`Retry-After` is readable.** The endpoint lists it in `Access-Control-Expose-Headers` on the 429,
so cross-origin JavaScript gets the real value. `parseRetryAfterSeconds` still keeps a 60-second
fallback for a 429 that arrives without the header, and the e2e suite covers both paths — the real
header and the fallback — because asserting only one of them has already hidden a mismatch once.

**Never send credentials.** No `credentials: "include"`, no cookies. A wildcard
`Access-Control-Allow-Origin` and a credentialed request are mutually exclusive, so the browser
blocks the response whatever the server returns. The access key travels in the JSON body, which is
not a CORS credential.

**Do not reach for a Supabase client helper.** `supabase.functions.invoke()` and friends attach an
`apikey` header automatically, and the function's preflight rejects any request asking to send a
header other than `content-type`. Plain `fetch` is a requirement, not a preference — which is also
why the endpoint URL is the only Supabase-adjacent value permitted in this repository, guarded by
`lib/env-security.test.ts`.

**`NEXT_PUBLIC_ACCESS_PROJECT_ID` is inlined at build time**, so on Cloudflare it belongs in
**build** variables, never Wrangler `vars` — the same rule and the same reasoning as
[ADR 0005](0005-cloudflare-workers-via-opennext.md).
