# Access gate — implementation plan

**Branch:** `feat/access-gate` · **Decision:** [ADR 0009](../decisions/0009-access-gate-verifies-on-every-load.md)

Gate the whole site behind an access key verified against a remote endpoint on every page load.
Built in four independently verifiable chunks.

## Chunks

| # | Scope | Commit |
|---|---|---|
| 1 | `lib/access-gate/{env,verify,storage}.ts` + unit tests. No UI. | `8f2ff58` |
| 2 | `content/access.ts`, `components/access/access-gate.tsx`, `app/layout.tsx` wiring, RTL tests. | `b241448` |
| 3 | Shared Playwright fixture, gate specs, BDD retrofit, build/capture scripts, `.env.example`. | `0692ebe` |
| 4 | ADR, architecture, runbook, setup checklist, changelog, `CLAUDE.md`/`AGENTS.md`, Supabase credential-name guard. | `a14851d` |
| 5 | Conform to the authoritative endpoint contract: endpoint into an env var with no fallback, client-side key-format validation, 8s timeout, honest 429 mock, `preview_urls: false`. | `baa6500` |

## Verification

- Unit: 185 passing, including a StrictMode regression test for the one-shot verification guard.
- E2E: 55 passed / 9 skipped / 0 failed. The real gate runs in every browser test against a
  stubbed endpoint; the gate spec itself uses the base Playwright test so it can observe the
  locked state.
- `pnpm build` succeeds with `NEXT_PUBLIC_ACCESS_PROJECT_ID` absent — the project ID is parsed in
  the mount effect, not during render, so a prerendered layout cannot fail the build.

## Decisions taken during the build

- **Cosmetic, not server-side.** Chosen deliberately: the content is invented and
  `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` is already public in the bundle, so a server gate would not
  protect the only resource that costs money. This gates access, not confidentiality.
- **The e2e suite keeps the gate enabled** and stubs the endpoint, rather than disabling the gate
  for tests, so the suite exercises the production render path.
- **`AccessGate` is a component, not a context** — nothing else consumes gate state.

## Before this can admit anyone

1. `NEXT_PUBLIC_ACCESS_PROJECT_ID` and `NEXT_PUBLIC_ACCESS_VERIFY_URL` set in Cloudflare **build**
   variables (not Wrangler `vars` — `NEXT_PUBLIC_*` is inlined at build time, so a change only
   takes effect on the next build). Both were added by James on 2026-08-04.
2. **The verification function must actually be deployed.** As of 2026-08-04 it is not; live calls
   fail at the gateway. Everything here is built and tested against mocks.
3. **The origins in [the runbook](../runbook.md) must be allowlisted** by the endpoint owner. Their
   allowlist is exact-match, and an unlisted origin fails as a generic browser network error with
   no readable 403 — so this is the first thing to check when verification fails for no visible
   reason. Not fixable from this repository.
