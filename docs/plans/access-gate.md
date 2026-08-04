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

## Chunk 6 — the endpoint went live (2026-08-05)

The verification function is deployed and its contract changed. Applied as a correction:

- **The project UUID arrived**: `28705c07-b647-4dc0-9abd-83a67964fa94`. Until now it was unset, so
  the gate posted `undefined` as `project` and every key was rejected. Set in `.env`, `.env.example`
  and Cloudflare **build** variables.
- **All origin/CORS handling is deleted.** The endpoint answers `Access-Control-Allow-Origin: *`.
  There is no allowlist, nothing to register, and preview deployments and localhost work with no
  coordination. The runbook's origins table and every "must be allowlisted" note are gone.
- **403 is out of the contract** and will never be returned; nothing treats it as "origin not
  allowlisted".
- **`Retry-After` is now exposed** via `Access-Control-Expose-Headers`, so the countdown reads the
  real value. The 60-second fallback stays for a 429 without the header, and the e2e suite covers
  both.
- Unchanged and deliberately so: the `{key, project}` body, `200 {"valid":…}` semantics, the
  400/405/429/503 branches, re-verifying on every load, and storing the key rather than a flag.

## Still required to admit anyone

`NEXT_PUBLIC_ACCESS_PROJECT_ID` and `NEXT_PUBLIC_ACCESS_VERIFY_URL` must be set in Cloudflare
**build** variables — not Wrangler `vars`, since `NEXT_PUBLIC_*` is inlined at build time and a
change only takes effect on the next build. And this branch is not merged: `main` still deploys a
site with no gate at all.
