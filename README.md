# Glow & Go Voice Agent

## What this is

Glow & Go is a portfolio demonstration by **James Raven Tabag**. It presents a fictional Los Angeles salon whose ElevenLabs voice agent can answer questions and book appointments through n8n into Google Sheets.

The salon is fictional and every booking is synthetic. The site ships in **simulated mode**: clicking Call runs a scripted 18-second conversation behind a visible simulation badge, not a live AI. It stays that way until the live-service configuration is supplied.

## Quick start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). No configuration is required; the app defaults safely to simulated mode.

## Documentation

Full documentation is in [`docs/`](docs/) — [requirements](docs/requirements.md),
[architecture](docs/architecture.md), [design](docs/design.md), the
[going-live runbook](docs/runbook.md), [release plans](docs/plans/),
[decision records](docs/decisions/), and the [changelog](docs/CHANGELOG.md).

## Architecture

```text
Browser ──WebRTC──> ElevenLabs Agent ──webhook──> n8n ──> Google Sheets
```

The browser is never in the booking path. In live mode, the Next.js app has no booking backend and holds no booking secrets. ElevenLabs hosts the agent and its four webhook tools call n8n directly.

`app/api/mock/*` is the reference implementation and executable contract specification for those tools. It supports the simulated demo and tests; it is not a dependency of the live booking path.

`content/` is the single source of truth for salon information. `pnpm generate:kb` generates [`artifacts/knowledge-base.md`](artifacts/knowledge-base.md) from it, keeping the website and agent knowledge aligned.

## Going live

Complete these steps in order; each produces a value needed by the next step. For the detailed
walkthrough — including the n8n Docker setup and the security gap to close first — see
[`docs/runbook.md`](docs/runbook.md).

1. **Set up Google Cloud and Sheets.** Create a Google Cloud project, enable the Google Sheets API, and create a service account. Create the bookings spreadsheet using [`artifacts/google-sheets/schema.md`](artifacts/google-sheets/schema.md), then share the sheet with the service account email. Record the spreadsheet ID for n8n. The sheet is publicly linked from the demo, so seed and maintain it with synthetic rows only.

2. **Set up n8n.** Run n8n at a public HTTPS URL — the [`deploy/n8n/`](deploy/n8n) stack (n8n + Caddy via Docker Compose) deploys to a Google Cloud Compute Engine e2-micro; [`docs/deployment-google-cloud.md`](docs/deployment-google-cloud.md) is the step-by-step guide. n8n Cloud also works. Import [`artifacts/n8n/booking.workflow.json`](artifacts/n8n/booking.workflow.json), attach the Google Sheets credential, replace `<GOOGLE_SHEET_ID>` with the spreadsheet ID, and activate the workflow. Record the production webhook URLs for `check_availability`, `create_booking`, `reschedule_booking`, and `cancel_booking`.

3. **Set up ElevenLabs.** Create an ElevenLabs Agent and upload [`artifacts/knowledge-base.md`](artifacts/knowledge-base.md) as its knowledge base. Create the four webhook tools from [`artifacts/elevenlabs/`](artifacts/elevenlabs/), replacing `<N8N_HOST>` with the public n8n host. Connect the tools to the agent and record the agent ID.

4. **Set the public environment variables.** Configure the site host with:

   ```dotenv
   NEXT_PUBLIC_AGENT_MODE=live
   NEXT_PUBLIC_ELEVENLABS_AGENT_ID=<agent-id>
   NEXT_PUBLIC_BOOKING_SHEET_URL=<public-sheet-url>
   ```

   Live mode requires both `NEXT_PUBLIC_AGENT_MODE=live` and a non-empty agent ID. Any other combination falls back to simulated mode, so a missing ID cannot ship a dead Call button. The sheet URL powers the site's public synthetic-bookings link.

5. **Deploy.** Deploy the site to Cloudflare Workers — `pnpm run deploy`, or connect the repo to Workers Builds for CI. Set the three variables above as **build** variables, not Wrangler `vars`: `NEXT_PUBLIC_*` is inlined at build time, so runtime vars silently do nothing. Keep n8n on its own public host; it receives the ElevenLabs webhooks and writes to Sheets.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run the local Next.js development server. |
| `pnpm build` | Create the production build and catch integration/build errors. |
| `pnpm start` | Serve an existing production build locally. |
| `pnpm lint` | Check the codebase with ESLint. |
| `pnpm typecheck` | Run TypeScript without emitting files. |
| `pnpm test` | Run the Vitest unit and contract tests once. |
| `pnpm test:e2e` | Build the app, then run the Playwright release gate. |
| `pnpm check:bloat` | Check production assets and dependencies against repository size budgets. |
| `pnpm generate:kb` | Regenerate the agent knowledge-base artifact from `content/`. |
| `pnpm crop:storefront` | Reproduce the storefront crop from the supplied location asset. |

## Known limitations

- **No transactional lock in Sheets.** Two simultaneous booking requests can both observe a free slot before either writes its row.
- **Stylists have no individual working patterns.** The model has no days off, shifts, or breaks; all 12 stylists are available during every branch opening hour.
- **The mock store is not durable.** Its module-level state does not persist reliably across serverless instances because it is a reference implementation, not production storage.
- **The live voice path is untested.** Playwright cannot drive a real microphone or make deterministic assertions about a live LLM conversation.

## Testing

`pnpm test:e2e` builds the production app and runs the Playwright gate in desktop and mobile Chromium projects. It verifies page structure and navigation, responsive floating-call behavior, keyboard and focus accessibility, the always-visible simulated-mode badge, deterministic transcript timing, and the mock booking webhook contracts—including reference-code requirements and malformed-request handling.

The gate deliberately runs in simulated mode. It does not assert microphone permissions, WebRTC connectivity, ElevenLabs model behavior, n8n availability, Google credentials, or live writes to Sheets. Those external integrations require a manual smoke test after the going-live wiring is complete.
