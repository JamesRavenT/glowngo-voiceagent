# Pending: roll out the webhook error contract

**Status:** code committed (`71632e7`), **not applied to production**. Paused 2026-08-03 by James.

The repo is fixed. The live n8n workflow and the live ElevenLabs agent are still on the old
behaviour. Nothing is broken by leaving it this way — bookings work today. This is a correctness
and call-quality improvement, not a fix for an outage.

---

## Why

`app/api/mock/*` is the executable contract n8n must satisfy. It didn't.

| Case | Contract | Live n8n |
|---|---|---|
| Unknown reference (cancel, reschedule) | 404 `{"error":"Booking reference not found"}` | 500 `{"message":"Error in workflow"}` |
| Malformed reference | 400 `{"error":"Invalid booking reference"}` | 500 generic |
| Missing required field | 400 | 500 generic |
| Closed day (Mon) / unknown branch / unknown service / slot taken | 400 | 500 generic |
| **create success** | **201** | **200** |

All four webhook nodes used `responseMode: "lastNode"`, and the validating Code nodes signalled
failure by throwing. An uncaught throw makes n8n return a generic 500 and *discard* the message.

It compounds: ElevenLabs defaults `tool_error_handling_mode` to `auto`, which for webhook tools
means **hide** — the agent is told nothing at all. So today, when a caller misreads their booking
code or asks for a Monday, Gigi receives no information and cannot explain the failure. These are
the paths a real caller hits most.

## What `71632e7` changed

- Four webhooks → `responseMode: "responseNode"`, each with a `Respond to Webhook` node
  (`typeVersion: 1.5`).
- Validation returns `{statusCode, body}` for *expected* failures; an IF node routes those around
  the Sheets mutation. Genuine Sheets faults and unexpected exceptions still throw → 5xx.
- Successful validation keeps its plain booking shape, so `autoMapInputData` still sees only sheet
  columns.
- Nodes **16 → 22** (+7 added, −1 `Cancellation Response`).
- All four `integrations/elevenlabs/*.json` get `tool_error_handling_mode: "passthrough"`, and
  `check_availability` gets `error` added to its `response_filter` allow-list — the allow-list
  would otherwise strip the error body.
- New `integrations/n8n/workflow-contract.test.ts`: asserts graph reachability (error branches
  provably cannot reach a mutation) and executes the embedded `jsCode` against the mock routes to
  compare status and body.

Verified locally: `pnpm lint`, `pnpm typecheck`, `pnpm test` (19 files, 125 tests) all pass.

---

## Open risk — settle this first

The three IF nodes use `typeValidation: "strict"` with a `number`-typed `exists` operator against
`$json.statusCode`. On the **success** path that value is undefined by design. If n8n's strict
validation raises a type error instead of evaluating false, the *happy path* throws — and the happy
path works today.

This cannot be settled offline; it's n8n runtime expression semantics. The static test asserts the
operator is `exists`, which is the right shape, but shape is not behaviour. **Assume it is unproven
until the live round trip below passes.**

If it does fail, the fix is to relax `typeValidation` to `loose` on the three IF nodes, or switch
the operator to a string/exists check that tolerates undefined.

## How to apply

**Do not re-import the workflow.** The tracked JSON is a template. The live workflow holds the real
sheet ID, the Google OAuth credential, the Header Auth credential, and its active state — a
re-import drops all of it. Patch the nodes in place via the n8n API
(`PUT /api/v1/workflows/{id}`), preserving those fields. See `runbook.md` §"Patching nodes in
place".

Live workflow id: `usZ6pSiODyV8BLn9` ("Glow & Go booking webhooks") on `n8n.jamesraventabag.com`.
Needs an n8n API key from **Settings → n8n API**.

1. Patch the live workflow nodes.
2. Run the verification below. **If the happy path regresses, revert to `71632e7^` and stop.**
3. Only then update the four ElevenLabs tools (`PATCH /v1/convai/tools/{id}`, body
   `{"tool_config": …}`) with `passthrough` and the filter change.
4. Confirm with a real browser call that Gigi can now explain a bad reference code out loud.

## Verification

Against `https://n8n.jamesraventabag.com/webhook/*`, with the `X-Webhook-Secret` header from `.env`:

| Check | Expect |
|---|---|
| No secret / wrong secret | 403 |
| `check-availability`, Mon 2026-08-10 | 200 `{"slots":[]}` (Monday is closed — not a bug) |
| `check-availability`, Tue | 200, 38 slots |
| `create-booking` | **201** + reference `GG-nnnn` |
| `reschedule-booking` with that reference | 200 |
| `cancel-booking` with that reference | 200 `{"cancelled":true}` |
| `cancel-booking` with `GG-0000` | **404** `{"error":"Booking reference not found"}` |
| `create-booking` on a Monday | **400** |

Always cancel the booking you create — the sheet is world-readable. Confirm the slot frees up
afterwards.

---

## Context worth keeping

The 2026-08-02 migration to `n8n.jamesraventabag.com` is complete: all four ElevenLabs tool URLs
were repointed and the booking round trip verified. The sheet was never part of that change — same
spreadsheet throughout.

Two operational lessons from that day, worth folding into `runbook.md` when someone next touches
it:

- **An OAuth consent screen left in "Testing" expires refresh tokens after 7 days.** That is what
  silently killed the Google Sheets credential; every hook returned 500 with the workflow, sheet,
  and auth all perfectly healthy. Now published to Production.
- **`Error in workflow` tells the caller nothing.** The actual node error is only visible in
  Executions, or via `GET /api/v1/executions?status=error&includeData=true`. Reach for that first
  rather than inferring from HTTP status.
