# Next steps — taking Glow & Go live

Operational runbook. `README.md` explains *what* to wire; this explains *how*, with the Docker
specifics, the exact env placement, and the decisions you'll hit.

**Where you are:** the site is **deployed and live**, running in simulated mode with zero
configuration — nothing below is required to ship it as a portfolio piece. This is only for making
the agent real.

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

Only three, all `NEXT_PUBLIC_*` — meaning they are **baked into the browser bundle and publicly
visible**. That's intentional: the browser holds no secrets, because it is never in the booking
path. Your Google credentials and n8n keys live in n8n, never here.

| Variable | Value | Effect |
|---|---|---|
| `NEXT_PUBLIC_AGENT_MODE` | `simulated` \| `live` | Selects the call implementation |
| `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | `agent_xxxxx` | Which agent to connect to |
| `NEXT_PUBLIC_BOOKING_SHEET_URL` | public sheet URL | Shows the sheet link on Contact |

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
4. Create a spreadsheet using the columns in `artifacts/google-sheets/schema.md`.
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

## 3. n8n on a VPS with Docker

You need n8n reachable at a **public HTTPS URL**, because ElevenLabs' servers call it directly.
`localhost` and self-signed certs will not work.

### Requirements
- A VPS — any provider. Below is the **Oracle Cloud Free Tier** path actually used here.
- A domain or subdomain pointed at its IP, e.g. `n8n.yourdomain.com`
- Docker + Docker Compose

### Oracle Cloud Free Tier — the parts that will bite

Three traps, none guessable from the outside:

1. **Two firewalls, not one.** Oracle has a cloud-level firewall (VCN Security List / NSG) **and**
   the Ubuntu image ships with restrictive `iptables` rules that `REJECT` almost everything. Opening
   80/443 in the console is *not enough* — you must open them in the instance too, or Traefik never
   sees traffic and the Let's Encrypt cert silently never issues.
2. **Ampere capacity.** The good shape (`VM.Standard.A1.Flex`, ARM64 — 1 OCPU / 6 GB is ample) is
   often "out of capacity" in busy regions. Retry, change home region, or fall back to the
   always-available `VM.Standard.E2.1.Micro` (1 GB x86 — tight but works).
3. **Cloudflare proxy breaks the cert.** The n8n subdomain must be **DNS only (grey cloud)**. Traefik
   gets its cert via a TLS challenge on port 443; a proxied (orange-cloud) record intercepts 443 and
   the challenge never reaches Traefik — issuance hangs forever.

Steps:

1. **Instance** — Ubuntu 24.04, shape `VM.Standard.A1.Flex` (ARM64, 1 OCPU / 6 GB). Upload your SSH
   public key; you log in as `ubuntu`.
2. **Reserve the public IP** — VNIC → the public IP → edit → **reserved**. Ephemeral IPs can change
   on stop/start and break DNS.
3. **Cloud firewall** — VCN → subnet → Security List → add ingress: source `0.0.0.0/0`, TCP, ports
   **80** and **443** (22 is already open).
4. **Instance firewall** (the trap) — SSH in and run:
   ```bash
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
   sudo netfilter-persistent save   # without this the rules vanish on reboot
   ```
5. **DNS** (Cloudflare) — add an `A` record: name `n8n`, value = the reserved IP,
   **proxy status DNS only**.
6. **Docker** —
   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker ubuntu   # then log out and back in
   ```

### `compose.yaml`

Traefik terminates TLS and gets certificates from Let's Encrypt automatically.

```yaml
services:
  traefik:
    image: traefik
    restart: always
    command:
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.web.http.redirections.entryPoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.mytlschallenge.acme.tlschallenge=true"
      - "--certificatesresolvers.mytlschallenge.acme.email=${SSL_EMAIL}"
      - "--certificatesresolvers.mytlschallenge.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - traefik_data:/letsencrypt
      - /var/run/docker.sock:/var/run/docker.sock:ro

  n8n:
    image: docker.n8n.io/n8nio/n8n
    restart: always
    ports:
      - "127.0.0.1:5678:5678"
    labels:
      - traefik.enable=true
      - traefik.http.routers.n8n.rule=Host(`${SUBDOMAIN}.${DOMAIN_NAME}`)
      - traefik.http.routers.n8n.tls=true
      - traefik.http.routers.n8n.entrypoints=web,websecure
      - traefik.http.routers.n8n.tls.certresolver=mytlschallenge
    environment:
      - N8N_HOST=${SUBDOMAIN}.${DOMAIN_NAME}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=https://${SUBDOMAIN}.${DOMAIN_NAME}/
      - N8N_PROXY_HOPS=1
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
      - GENERIC_TIMEZONE=America/Los_Angeles
      - TZ=America/Los_Angeles
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
  traefik_data:
```

With a `.env` beside it:

```dotenv
DOMAIN_NAME=yourdomain.com
SUBDOMAIN=n8n
SSL_EMAIL=you@yourdomain.com
N8N_ENCRYPTION_KEY=   # openssl rand -hex 24 — set once, keep it; it decrypts stored credentials
```

Set `N8N_ENCRYPTION_KEY` yourself rather than letting n8n auto-generate one into the volume. If the
`n8n_data` volume is ever rebuilt without it, every stored credential (your Google service account)
becomes undecryptable and must be re-entered.

Then `docker compose up -d`.

### The two settings that matter most

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
2. Import `artifacts/n8n/booking.workflow.json` (Workflows → Import from File).
3. Add the **Google Sheets credential** using the service-account JSON.
4. Replace `<GOOGLE_SHEET_ID>` with your spreadsheet id.
5. **Activate** the workflow — inactive workflows only expose *test* webhook URLs that fire once.
   An inactive workflow is the second classic failure.
6. Copy the four **production** webhook URLs.

---

## 4. ElevenLabs

1. Create an agent. Record the **agent id** (`agent_...`).
2. Upload `artifacts/knowledge-base.md` as its knowledge base.
   **Re-upload it whenever `content/` changes** — run `pnpm generate:kb` first. A test enforces the
   file matches `content/`, but nothing can force ElevenLabs to have the current copy.
3. Create the four webhook tools from `artifacts/elevenlabs/*.json`, replacing `<N8N_HOST>` with
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
2. Add the same header to each `artifacts/elevenlabs/*.json` under
   `api_schema.request_headers`, alongside `Content-Type`.

ElevenLabs also supports secret/auth connections so the value isn't stored in plaintext in the tool
config — worth using if you keep this running.

**Cost note:** ElevenLabs bills per minute of conversation. A public demo button on a portfolio site
is a small open tap. Consider agent-level limits, or only enabling live mode while showing it.

---

## 6. Do you need an MCP for me to configure n8n?

Honest answer: **no, and it probably isn't worth it.**

- **The import is a UI action.** Workflows → Import from File → pick the JSON. Thirty seconds. An
  MCP to automate a thing you'll do once is a poor trade.
- **I can't reach your VPS anyway.** I run on your machine. Configuring a remote n8n means giving
  something network access and an API key.

**Where it would genuinely help:** *iterating* on the workflow — debugging why an execution failed,
adjusting node logic, re-testing — rather than the one-time import. n8n has a REST API (`/api/v1`)
with API-key auth, and community MCP servers wrap it. If you find yourself going back and forth on
workflow logic, that's when it earns its place.

If you want that, say so and I'll research the current options properly before recommending one —
I'm not going to name a package I haven't verified.

**Don't confuse two different things:** n8n's own *MCP Server Trigger* / *MCP Client Tool* nodes let
n8n **act as** an MCP server for AI agents. That's unrelated to configuring n8n via MCP.

**My actual recommendation:** import it by hand. If the workflow misbehaves, paste the execution
error to me and I'll tell you what to change. That loop is fast enough and needs no new
infrastructure.

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
| VPS for n8n | **Free** — Oracle Cloud Always Free tier (or ~$5/mo elsewhere) |
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
