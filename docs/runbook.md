# Next steps — taking Glow & Go live

Operational runbook. `README.md` explains *what* to wire; this explains *how*, with the Docker
specifics, the exact env placement, and the decisions you'll hit.

**Where you are:** the site is **deployed and live**, running in simulated mode with zero
configuration — nothing below is required to ship it as a portfolio piece. This is only for making
the agent real.

Live calls use the browser microphone, and a visible consent gate presents the privacy disclosure
before any call connects.

| | |
|---|---|
| Live | <https://glowngo-voiceagentdemo.site> |
| Fallback | <https://glowngo-voiceagent.jraven-tabag.workers.dev> |
| Deploy | `pnpm run deploy` |
| Registrar | Vercel · **DNS: Cloudflare** |

**Time:** roughly 1–2 hours, mostly waiting on DNS and Google's consent screens.

---

## 0. The deployment, and what it took

Recorded because none of it is guessable, and all of it will bite again.

**Workers requires Cloudflare nameservers.** *"Unlike Pages, Workers does not support any domain
whose nameservers are not managed by Cloudflare."* There is no CNAME workaround. Vercel stays the
registrar; only the nameservers moved.

**Cloudflare's onboarding scan imports the old host's DNS records, and they block the Custom
Domain.** Attaching failed with `Conflict 409` until the apex records were deleted. The addresses
are not the ones you would search for — **Vercel has moved off `76.76.21.21`**:

| Records Vercel left | |
|---|---|
| `A` apex + `A *` wildcard | `216.198.79.1`, `216.198.79.65` |
| `A www` | `64.29.17.1`, `64.29.17.65` |
| `CNAME _domainconnect` | `_domainconnect.vercel-dns.com` — the giveaway |

All were deleted. **The three `CAA` records were deliberately kept** (`letsencrypt.org`, `pki.goog`,
`sectigo.com`) — Cloudflare issues the certificate through those authorities, so removing them
blocks the cert. Cloudflare then created `AAAA @ -> 100::` (proxied, originless) itself.

**A symptom guide**, since these are indistinguishable from the outside:

| Symptom | Meaning |
|---|---|
| `525` on the apex | A proxied record points at a dead origin — the old host's record is still there |
| `Conflict 409` on deploy | Same cause: a record already occupies the hostname |
| `404` on `workers.dev` | `workers_dev` defaulted off because a route exists — pin `workers_dev: true` |

**`www` is not covered by the apex.** Custom Domains match the hostname exactly. `www` needs a
**proxied** `A` record to `192.0.2.0` (a reserved placeholder — proxied, so requests never reach it)
plus a Redirect Rule to the root. Both are dashboard tasks; neither is expressible in
`wrangler.jsonc`.

---

## 1. The environment variables

Four, all `NEXT_PUBLIC_*` — meaning they are **baked into the browser bundle and publicly
visible**. That's intentional: the browser holds no secrets, because it is never in the booking
path. Your Google credentials and n8n keys live in n8n, never here.

| Variable | Value | Effect |
|---|---|---|
| `NEXT_PUBLIC_AGENT_MODE` | `simulated` \| `live` | Selects the call implementation |
| `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | `agent_xxxxx` | Which agent to connect to |
| `NEXT_PUBLIC_BOOKING_SHEET_URL` | public sheet URL | Shows the sheet link on Contact |
| `NEXT_PUBLIC_ACCESS_PROJECT_ID` | project UUID | Scopes access-key verification |

A missing or malformed `NEXT_PUBLIC_ACCESS_PROJECT_ID` locks the site behind a "misconfigured"
screen for everyone — the gate refuses to post `undefined` as the project, because that would
reject every key and present as a misleading "invalid key". See
[ADR 0009](decisions/0009-access-gate-verifies-on-every-load.md).

**The resolution rule:** live requires `NEXT_PUBLIC_AGENT_MODE=live` **and** a non-empty agent id.
Anything else silently falls back to simulated with the badge showing. You cannot accidentally ship
a dead Call button. (`lib/env.ts`, tested.)

### Where they go

**Locally** — create `.env.local` in the repo root. It's gitignored. Copy `.env.example` and fill in.

```bash
cp .env.example .env.local
```

**On Cloudflare** — Workers & Pages → your Worker → Settings → **Build** → Variables and Secrets.

**Put them in _build_ variables. Not Wrangler `vars`. This is the trap.**

`NEXT_PUBLIC_*` values are inlined into the bundle at **build** time. Wrangler `vars` are injected at
**runtime**, into `env` — which the browser bundle never reads. Set the agent ID as a Wrangler var
and it is simply absent when the build runs; `lib/env.ts` resolves to `simulated`; the site ships
behind the badge. There is **no error in any log**, and `wrangler.jsonc` looks perfectly correct.
Expect to lose an hour if you get this wrong.

After changing a build variable you must **redeploy** — a restart won't do it, because the value is
baked into the JavaScript.

**Never** put Google service-account JSON or n8n API keys in this project. They belong in n8n.

---

## 2. Google Sheets (do this first — everything needs the sheet id)

1. Google Cloud Console → new project.
2. Enable the **Google Sheets API**.
3. Create a **service account**; download its JSON key. This is the only real secret in the system —
   it goes into n8n and nowhere else.
4. Create a spreadsheet using the columns in `integrations/google-sheets/schema.md`.
5. **Share the sheet with the service account's email** (it looks like
   `something@project.iam.gserviceaccount.com`). Editor access. Skipping this is the #1 cause of
   "n8n can't write" — the API is enabled but the sheet was never shared.
6. Also share it **publicly, view-only** ("anyone with the link can view") — that URL becomes
   `NEXT_PUBLIC_BOOKING_SHEET_URL`.
7. Seed it with obviously synthetic rows. **It is publicly readable.** Anyone who books via your
   demo puts a name and phone number into a world-readable sheet — the site warns callers, but keep
   the data fake yourself.

Record: **spreadsheet id** (from the URL) and the **service account JSON**.

---

## 3. n8n on a VM with Docker

You need n8n reachable at a **public HTTPS URL**, because ElevenLabs' servers call it directly.
`localhost` and self-signed certs will not work.

**The full, step-by-step VM guide is [`deployment-google-cloud.md`](deployment-google-cloud.md)** —
creating the Compute Engine e2-micro, the firewall (only 22/80/443), the setup script, DNS with an
ephemeral IP, updates, backup/restore, and low-memory troubleshooting. This section keeps only the
n8n-specific reasoning that matters wherever you host it.

### Requirements
- A VM at a public IP — the guide uses a **Google Cloud Compute Engine e2-micro** (Always Free in
  `us-west1`). Any Docker host works.
- A domain or subdomain pointed at its IP, e.g. `n8n.yourdomain.com`.
- Docker Engine + the Compose plugin (the setup script installs these).

### The config

Everything is in [`deploy/n8n/`](../deploy/n8n): `docker-compose.yml` runs **n8n + Caddy** (Caddy
terminates TLS and gets a Let's Encrypt certificate automatically), `setup.sh` bootstraps the VM,
`backup.sh` snapshots the data, and `.env.example` is the template. Copy it to `.env`, fill in your
domain, email, and encryption key, then `./setup.sh`. n8n uses SQLite on the `n8n_data` volume — no
separate database.

> **If your DNS is on Cloudflare, the n8n record must be _DNS only_ (grey cloud).** Caddy gets its
> certificate over ports 80/443; a proxied (orange-cloud) record intercepts them and issuance hangs
> forever. Same trap regardless of host.

Set `N8N_ENCRYPTION_KEY` yourself (`openssl rand -hex 24`) rather than letting n8n auto-generate one
into the volume. If the `n8n_data` volume is ever rebuilt without it, every stored credential (your
Google service account) becomes undecryptable and must be re-entered.

### The settings that matter most

- **`WEBHOOK_URL`** — without it, n8n shows webhook URLs based on its *internal* address, you paste
  those into ElevenLabs, and calls silently never arrive. This is the classic self-host failure.
- **`N8N_PROXY_HOPS=1`** — tells n8n it's behind one reverse proxy.
- **`GENERIC_TIMEZONE=America/Los_Angeles`** — the whole booking model is LA wall-clock. A workflow
  running in UTC will compute the wrong day's availability. Match it deliberately.
- **`N8N_ENCRYPTION_KEY`** — the key that decrypts stored credentials. Set it explicitly and back it
  up; without the original key a rebuilt volume can't read your saved Google credential.
- The **`n8n_data` volume** holds your workflows and credentials. Lose it, lose everything.

### Then

1. Open `https://n8n.yourdomain.com`, create the owner account.
2. Import `integrations/n8n/booking.workflow.json` (Workflows → Import from File).
3. Add the **Google Sheets credential** using the service-account JSON.
4. Replace `<GOOGLE_SHEET_ID>` with your spreadsheet id.
5. **Activate** the workflow — inactive workflows only expose *test* webhook URLs that fire once.
   An inactive workflow is the second classic failure.
6. Copy the four **production** webhook URLs.

---

## 4. ElevenLabs

1. Create an agent. Record the **agent id** (`agent_...`).
2. Upload `integrations/knowledge-base.md` as its knowledge base.
   **Re-upload it whenever `content/` changes** — run `pnpm generate:kb` first. A test enforces the
   file matches `content/`, but nothing can force ElevenLabs to have the current copy.
3. Create the four webhook tools from `integrations/elevenlabs/*.json`, replacing `<N8N_HOST>` with
   your real host. Attach all four to the agent.
4. Give the agent a system prompt that tells it it's a salon receptionist, to use the tools rather
   than guess, and — importantly — **to say it's a demo if asked**. The knowledge base says so, but
   the system prompt is what governs behaviour.

---

## 5. ⚠ Security gap you should close before going live

**The n8n webhooks are currently unauthenticated.** Anyone who discovers the URL can create or
cancel bookings directly, bypassing the agent entirely. For a public portfolio demo that means a
stranger can spam your sheet.

This is a gap in what I built — the tool configs only set `Content-Type`. Fix it:

1. In each n8n Webhook node, set **Authentication → Header Auth**, and create a credential with a
   header name and a long random value (n8n webhooks support Basic, Header, or JWT auth).
2. Add the same header to each `integrations/elevenlabs/*.json` under
   `api_schema.request_headers`, alongside `Content-Type`.

ElevenLabs also supports secret/auth connections so the value isn't stored in plaintext in the tool
config — worth using if you keep this running.

**Cost note:** ElevenLabs bills per minute of conversation. A public demo button on a portfolio site
is a small open tap. Consider agent-level limits, or only enabling live mode while showing it.

---

## 6. The n8n MCP — connected, and it earned its place

**This section previously said an MCP wasn't worth it. That advice was wrong, and the reasoning
is worth keeping.**

The original argument was that importing a workflow is a one-time UI action, so automating it is a
poor trade. That was right about *import* and wrong about everything after it. The MCP is now
connected, and on 2026-07-20 it caught three faults that had made the live workflow completely
non-functional — an inactive workflow, a broken `Append` column mapping, and an `Update` node with
no matching column. See [v1.0.0-release-checklist.md](v1.0.0-release-checklist.md).

None of those were visible from the repo, because **the repo artifact was correct and the live
instance had drifted.** Reading live state is exactly the thing hand-import cannot do.

What it is good for:

- **Reading live state** — `active`, node parameters, attached credentials, execution history.
  This is where the value is.
- **Patching nodes** in place, atomically, without a re-import that would drop credentials.
- **Publishing / unpublishing.**

What it still cannot do:

- **Create credentials.** There is no credential-creation tool. Header Auth, Google OAuth, and
  anything else with a secret must be set up in the UI by hand.

**Don't confuse two different things:** n8n's own *MCP Server Trigger* / *MCP Client Tool* nodes let
n8n **act as** an MCP server for AI agents. That's unrelated to configuring n8n via MCP.

---

## 7. Order, and how to know each step worked

| # | Step | Done when |
|---|---|---|
| 1 | Google Sheets | Sheet exists, shared with the service account **and** publicly view-only |
| 2 | n8n on Docker | `https://n8n.yourdomain.com` loads over real HTTPS |
| 3 | Import + activate | Four **production** webhook URLs copied |
| 4 | Add webhook auth | `curl` without the header is rejected |
| 5 | ElevenLabs | Agent id in hand, four tools attached, KB uploaded |
| 6 | Env + redeploy | Badge is **gone** and the mic prompt appears |

**Smoke test after wiring** — no automation covers this, and the README says so:

1. Click Call. Grant the mic. The simulated badge should be **absent**.
2. "I'd like a balayage with Nova next Tuesday afternoon."
3. Agent should offer real slots — cross-check them against `/api/mock/check-availability` locally.
4. Accept one. It should read back a `GG-####` reference.
5. **Check the sheet.** A row should appear.
6. "Cancel booking GG-####." Row should update.
7. Try cancelling with a **wrong** code — it must refuse.

Step 7 is the one to actually try. It's the security property, and it's the thing a technical
reviewer will poke at.

---

## 8. What this costs

| | |
|---|---|
| Cloudflare Workers | Free tier is fine |
| Cloudflare Images | Free-tier transformation allowance is far above portfolio traffic |
| Google Sheets | Free |
| VM for n8n | **Free** — Google Cloud e2-micro Always Free tier in `us-west1` (or ~$5/mo elsewhere) |
| n8n | Free self-hosted |
| ElevenLabs | **Per minute of conversation** — the only meaningful cost |

---

## 9. Known gaps, if you keep building

- **Webhook auth** (§5) — do this first.
- **No transactional lock in Sheets** — two simultaneous bookings could both see a slot free. Rare
  in a demo; real. A proper database is the fix.
- **Stylists have no shifts, days off or breaks** — all 12 are available every opening hour. The
  engine already reads hours per-branch; a `stylist.hours` field consulted alongside it is the
  natural v0.2.
- **The live voice path is untested** — Playwright can't drive a microphone. It stays a manual
  smoke test.
