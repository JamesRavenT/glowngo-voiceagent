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
| 4 | ADR, architecture, runbook, setup checklist, changelog, `CLAUDE.md`/`AGENTS.md`, Supabase credential-name guard. | — |

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

1. `NEXT_PUBLIC_ACCESS_PROJECT_ID` set to the real project UUID in `.env` and in Cloudflare **build**
   variables (not Wrangler `vars` — `NEXT_PUBLIC_*` is inlined at build time).
2. The verification endpoint must send `Access-Control-Allow-Origin`, answer the `OPTIONS`
   preflight, and expose `Retry-After`. Without the first two every verification fails as
   *unavailable*, which reads to visitors as "couldn't verify right now" with no hint that CORS is
   the cause. Not fixable from this repository.
