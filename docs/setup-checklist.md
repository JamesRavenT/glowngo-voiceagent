# Setup checklist — testing the voice agent

What **you** need to create, and what goes in `.env`. This is the short path.
For the canonical deep how-to (Docker Compose, Caddy, and failure modes), see
[`runbook.md`](runbook.md).

## The key point first

Testing splits into two stages, and **stage 1 needs no VPS, no n8n, and no Google Sheets.**

| Stage | You can | Needs |
|---|---|---|
| **1. Talk to the agent** | Click Call, grant mic, have a real conversation, ask it about services/hours | An ElevenLabs agent ID. That's it. |
| **2. Actually book** | The agent checks availability and writes a row to a sheet | n8n on a public HTTPS host + Google Sheets |

Stage 1 is ~15 minutes. Do it first — it proves the voice path works before you spend an evening on
Docker. In stage 1 the agent will *talk* but its four booking tools will fail when called, because
they point at an n8n that doesn't exist yet. That's expected, not a bug.

---

## Stage 1 — voice only

### 1. Create the ElevenLabs agent

1. Sign up at ElevenLabs → create an **Agent**.
2. Copy its **agent ID** (looks like `agent_xxxxxxxx`).
3. Upload `integrations/knowledge-base.md` as the agent's knowledge base.
   Run `pnpm generate:kb` first if `content/` has changed since it was last generated.
4. Give it a system prompt: it's a receptionist for Glow & Go, it uses its tools rather than
   guessing, and **it says it's a demo if asked**.

### 2. Create `.env`

In the repo root (it's gitignored — never commit it):

```dotenv
NEXT_PUBLIC_AGENT_MODE=live
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_xxxxxxxx
NEXT_PUBLIC_BOOKING_SHEET_URL=
```

Leave the sheet URL empty for now; it only controls a link on the Contact section.

A fourth variable, `NEXT_PUBLIC_ACCESS_PROJECT_ID`, is the project UUID the access gate verifies
keys against. Without it the gate cannot verify anything and shows a "misconfigured" screen — see
[ADR 0009](decisions/0009-access-gate-verifies-on-every-load.md).

**All four variables are `NEXT_PUBLIC_*` — they are baked into the browser bundle and publicly
visible.** That's by design: the browser is never in the booking path, so it holds no secrets. The
project UUID is an identifier rather than a secret, and is inert without a valid access key. Your
Google service-account JSON and any n8n keys live *in n8n*, never in this repo.

### 3. Restart the dev server

`NEXT_PUBLIC_*` values are inlined at build time, so a running server won't pick up the change.
Stop it and `pnpm dev` again.

### 4. Confirm it took

Click Call. **The "Simulated preview" badge should be gone** and the browser should prompt for mic
access. If the badge is still there, the mode didn't resolve to live — see below.

> **Why the badge might not disappear:** live mode requires `NEXT_PUBLIC_AGENT_MODE=live` **and** a
> non-empty agent ID. Any other combination falls back to simulated on purpose, so a missing ID can
> never ship a dead Call button (`lib/env.ts`). A typo'd variable name looks exactly like a
> deliberate simulated build — check the spelling first.

---

## Stage 2 — real bookings

Full instructions in [`runbook.md`](runbook.md) §2–§4. The shape of it:

1. **Google Sheets first** — everything downstream needs the spreadsheet ID.
   Cloud console project → enable Sheets API → service account + JSON key → create the sheet from
   `integrations/google-sheets/schema.md` → **share the sheet with the service account's email**
   (the #1 cause of "n8n can't write") → also share publicly view-only for
   `NEXT_PUBLIC_BOOKING_SHEET_URL`.
2. **n8n at a public HTTPS URL** — ElevenLabs' servers call it directly, so `localhost` and
   self-signed certs cannot work. This is the part that needs a VPS and a domain.
   Import `integrations/n8n/booking.workflow.json`, add the Sheets credential, replace
   `<GOOGLE_SHEET_ID>`, and **activate** it — an inactive workflow only exposes test webhook URLs
   that fire once.
3. **Wire the tools** — create the four webhook tools from `integrations/elevenlabs/*.json`, replacing
   `<N8N_HOST>` with your real host, and attach all four to the agent.
4. Fill in `NEXT_PUBLIC_BOOKING_SHEET_URL` and restart.

### Before you leave it running publicly

**The n8n webhooks are unauthenticated as shipped** — anyone who finds the URL can create or cancel
bookings without going through the agent. Close this with Header Auth on each Webhook node before
the demo is public; runbook §5 has the steps.

Also: **ElevenLabs bills per minute of conversation.** A Call button on a public portfolio site is
an open tap. Consider enabling live mode only while you're demoing it.

---

## Smoke test (nothing automates this)

Playwright can't drive a microphone, so the live path is manual by design.

1. Click Call, grant mic — badge absent.
2. "I'd like a balayage with Nova next Tuesday afternoon."
3. Agent offers real slots — cross-check against `/api/mock/check-availability`.
4. Accept one — it reads back a `GG-####` reference.
5. Check the sheet. A row appears.
6. "Cancel booking GG-####" — the row updates.
7. **Try cancelling with a wrong code. It must refuse.**

Step 7 is the one worth actually trying — it's the security property, and it's what a technical
reviewer will poke at.
