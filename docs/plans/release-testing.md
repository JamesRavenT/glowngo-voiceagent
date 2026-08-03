# Release testing plan — risk-based BDD

**Status:** Revised after Codex technical review, awaiting approval · **Date:** 2026-08-03

## What already exists

Do not rebuild any of this.

| Layer | Files | Tests |
|---|---|---|
| Unit / component (Vitest + Testing Library) | 19 | 131 |
| E2E + API contract (Playwright, desktop + mobile projects) | 5 | 17 |
| Reporting | Allure via `allure-playwright` + `scripts/allure-e2e.mjs` | — |

The first draft of this plan proposed ~14 scenarios that merely restated existing tests. They are
cut. Already covered and **not** duplicated below: the simulated badge, consent gate, call
lifecycle, Escape-to-minimize, focus restoration and trapping, skip link and keyboard order,
scripted transcript ordering and speaker attribution, section order, the disclaimer, navbar
behaviour, all four mock tool contracts (including 400 on malformed JSON and 404 on unknown
references), the `resolveAgentMode` truth table, `content/` invariants, knowledge-base generation,
and n8n contract + drift.

## Corrections to the first draft

Recorded because they were asserted confidently and were wrong.

| Claim | Reality |
|---|---|
| "`lib/env.test.ts` contains zero tests" | It contains **six** cases via `it.each`, covering live, missing ID, blank ID, simulated, undefined mode, and invalid mode. The agent-mode fallback is **not** a gap. |
| "reference in the form GG followed by four digits" | The format is **`GG-4821`** — `/^GG-\d{4}$/i`, hyphen included. |
| "`build:e2e` overrides live credentials" | It sets only `NEXT_PUBLIC_AGENT_MODE=simulated` and `NEXT_PUBLIC_ELEVENLABS_AGENT_ID=""`. Server secrets are **inherited unchanged**. |
| Audio-tag stripping is an E2E gap | Simulated mode uses `content/agent.ts`, which has no audio tags, and bypasses `mapElevenLabsMessage` entirely. The scenario **cannot fail** in simulated mode — it would be false confidence. |
| Visual regression listed as a Medium gap | No `@visual` scenarios were written. Either scope it concretely or drop it. |

## Genuinely missing coverage, ranked

| # | Gap | Risk | Note |
|---|---|---|---|
| 1 | `playwright.config.ts` hard-codes port 3000 | **Blocker (test infra)** | Confirmed live: another local project held 3000 and the entire run aborted. Not a *product* release blocker, but nothing else can be verified until fixed. |
| 2 | No proof server secrets stay out of client artifacts | **Critical** | Nothing guards against a `NEXT_PUBLIC_` rename shipping a live key. Must scan `.next/static/**` bytes using controlled sentinels — never real `.env` values, never printed on failure. |
| 3 | No horizontal-overflow regression check | **Critical** | ADR 0007 names the exact assertion and it was never automated. A widened document desynchronizes pointer hit-testing across the whole page. |
| 4 | No automated accessibility scan | **High** | Existing a11y coverage is hand-written keyboard checks only. |
| 5 | Audio-tag strip has no boundary test | **High** | Fix at the right layer: inject an SDK message containing `[warmly]` through `mapElevenLabsMessage`. Not E2E. |
| 6 | Backdrop-click minimize untested E2E | Medium | Component-tested only; the real backdrop gesture is not exercised. |
| 7 | Failed cancel does not prove the booking survived | Medium | The 404 is covered; "and the original booking is untouched" is not. |
| 8 | Live-call failure states not covered E2E | Medium | Needs a deterministic failure fixture, else it stays `@manual`. |

## Approach

**Runner: `playwright-bdd`, pinned.** `bddgen` compiles `.feature` files into Playwright specs run
by the existing config — same viewport projects, same webServer, same Allure wiring.

**The `testDir` trap.** The documented setup assigns `defineBddConfig()`'s return value to
`testDir`. Applied naïvely that replaces `testDir: "./e2e"` and **silently stops running the five
existing native specs**. The implementation must keep both native and generated specs running, and
prove it by test count.

**Project scoping.** Every generated scenario runs in both desktop and mobile projects unless
restricted. API, security, and build assertions must run **once**, as the existing API specs do.

**Test data.** Scenarios run against the local `build:e2e` server in simulated mode. Bookings use
the in-memory store (`lib/booking/store.ts`), which is module-level and shared across the run — it is
isolated from production but **not per scenario**. Booking scenarios must use their own references
and tolerate a preceding failure. No scenario touches real n8n, the real agent, or the production
Sheet.

**Gherkin is for business behaviour only.** Pure functions (`resolveAgentMode`,
`stripElevenLabsAudioTags`, reference-code format, slot maths) and build invariants stay in Vitest.

## Tags

`@critical` · `@smoke` · `@regression` · `@security` · `@a11y` · `@api` · `@visual` · `@manual`

---

## Scenarios

Only what is not already covered.

```gherkin
Feature: Reaching the site on any device

  @critical @regression
  Scenario: The page never scrolls sideways on a phone
    Given a visitor on a mobile viewport
    When the page has finished laying out
    Then the document is no wider than the screen
    # Guards ADR 0007.

  @a11y @critical
  Scenario Outline: Key states have no detectable accessibility violations
    Given the visitor is on <state>
    Then an automated accessibility scan reports no serious or critical violations

    Examples:
      | state                        |
      | the home page                |
      | the call modal consent step  |
      | the call modal during a call |
```

```gherkin
Feature: Keeping secrets off the client

  @critical @security
  Scenario: Server-only credentials are absent from shipped client artifacts
    Given the site has been built with known sentinel credentials
    When the shipped client artifacts are scanned
    Then no server credential sentinel appears in them

  @critical @security
  Scenario: Server secrets are never given a public name
    Given the project configuration
    Then no server credential is exposed under a NEXT_PUBLIC_ name

  @security @deployment
  Scenario: A live build exposes the public agent identifier and nothing more
    Given a live-mode build with known sentinel credentials
    When the shipped client artifacts are scanned
    Then the public agent identifier sentinel is present
    And no server credential sentinel appears
    # Requires its own build; cannot share the simulated build output.
```

```gherkin
Feature: Managing an existing appointment

  @critical @api
  Scenario: A failed cancellation leaves the appointment intact
    Given an appointment has been booked
    When a cancellation is attempted with a reference that does not exist
    Then the request is refused as not found
    And the original appointment can still be retrieved by its own reference
```

```gherkin
Feature: Placing a call

  @regression
  Scenario: Clicking away minimizes an ongoing call instead of ending it
    Given a call is in progress
    When the caller clicks the area outside the call modal
    Then the call modal closes
    And the floating call button reports a call in progress
    And the call is still in progress

  @smoke
  Scenario: A caller is thanked after ending a call
    Given a call is in progress
    When the caller ends the call
    Then the caller is thanked
```

```gherkin
Feature: Handling failure

  @manual
  Scenario: A service-side failure is not blamed on the caller's network
    Given the ElevenLabs account has exhausted its quota
    When a caller starts a call
    Then the caller is not told to check their own connection
    # Live-only. The current generic connectionError DOES say "Check your
    # connection", so this is expected to fail until error classification
    # is improved. See ADR 0008.

  @manual
  Scenario: The agent answers a single question once
    Given a live call to the hosted agent
    When the caller asks one question
    Then the agent gives one answer and then waits for at least five seconds
    # Regression guard for ADR 0008.

  @manual @deployment
  Scenario: The deployed site runs in the intended mode
    Given the deployed Cloudflare URL
    Then the deployed bundle carries the expected agent mode
```

## Moved to the right layer, not Gherkin

| Change | Where |
|---|---|
| Inject an SDK message containing `[warmly]`; assert the mapped entry is clean | `elevenlabs-call-session.test.ts` |
| Assert the visible thank-you copy | fold into the existing E2E end-call test |

## Execution order

1. E2E port configurability (`E2E_PORT`, validated integer, default 3000, threaded through
   `baseURL`, `webServer.url`, and `next start --port … --hostname 127.0.0.1`).
2. `playwright-bdd` spike proving native **and** generated specs both run.
3. Horizontal-overflow regression.
4. axe scans.
5. Sentinel-based client-artifact security scan + forbidden-name guard.
6. Remaining behaviour assertions.
7. Visual regression — only if scoped (below).

## Decisions

1. **The API contract is unchanged.** `readJsonObject` accepts valid JSON regardless of
   `Content-Type`, and there is no body size limit. Tests assert **current behaviour**; they do not
   tighten it. The mock is the spec n8n already satisfies, and the only caller is an ElevenLabs
   webhook tool sending well-formed JSON. Revisit only if an untrusted caller ever reaches these
   routes.

   ```gherkin
   @api
   Scenario: A booking tool accepts well-formed JSON regardless of content type
     Given a booking request carrying valid JSON
     When it is sent with a non-JSON content type
     Then it is accepted
     # Pins current behaviour. Tightening this would change what n8n must satisfy.
   ```

2. **Visual regression is targeted and non-blocking.** Screenshot the call modal (consent state) and
   the hero — not full pages. Baselines are generated locally and `@visual` is **excluded from the
   release gate** until a fixed Linux CI image owns them. Informational signal, no release
   dependency.

   ```gherkin
   @visual
   Scenario Outline: Stable surfaces look as expected
     Given the visitor is on <surface>
     Then it matches its committed baseline
     # Non-blocking. Baselines are OS- and font-specific; local Windows
     # baselines will not match Linux CI until a canonical image is chosen.

     Examples:
       | surface                     |
       | the hero section            |
       | the call modal consent step |
   ```
