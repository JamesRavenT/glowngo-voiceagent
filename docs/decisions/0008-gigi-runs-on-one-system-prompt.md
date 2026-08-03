# 0008 — Gigi runs on one system prompt, not a workflow

**Status:** Accepted · **Date:** 2026-08-03

## Context

Gigi's behaviour was defined in two places at once.

The versioned source of truth is `integrations/elevenlabs/system-prompt.md` — 7,066 characters
covering personality, tone, the greet-once rule, silence handling, the demo disclosure
([ADR 0006](0006-consent-gate-carries-the-spoken-disclosure.md)), synthetic-data handling, the
booking sequence, and guardrails.

On top of that, the agent also carried a three-node **workflow**, built in the ElevenLabs dashboard
and never committed to this repo:

```
start ──unconditional──> [Greeting & Inquiry]      entry_behavior: auto
                            │ llm: "Customer has stated their inquiry or
                            │       intention to book an appointment."
                            ↓
                         [Information & Booking]   entry_behavior: auto
                            │ llm: "All necessary information has been provided
                            │       OR all required details have been collected."
                            ↓
                         [Confirmation & Finalization]  entry_behavior: auto
```

A caller asked one question — "can you tell me more about your services?" — and got two answers:

```
[15.0s] agent | [happy] Hi Raven. We offer a range of services, like cuts and
                styling, treatments, and color services. Is there anything
                specific you'd like to know more about?
[18.0s] agent | tool: notify_condition_1_met
[20.0s] agent | [supportive] We have services like Precision Cuts, Blowout &
                Style, and Bridal Styling. For treatments, there's Deep
                Conditioning and Keratin Smoothing. Our color services include
                Gloss & Toner, Highlights, and Balayage.
```

The first turn is correct and on-scope. Then the edge condition matched, the conversation
transitioned into **Information & Booking**, and that node spoke *on entry* — volunteering the entire
service catalogue nobody asked for.

That is `entry_behavior` working as documented. `auto` resolves to `wait_for_user` after `say` and
`start` nodes, and to **`generate_immediately` otherwise** — and the preceding node here was another
subagent node. Any node-to-node transition therefore produced an unprompted turn.

The node prompts also contradicted the system prompt outright:

| Node prompt said | System prompt says |
|---|---|
| "Greet the customer warmly… Introduce yourself" | "Your opening line is the only greeting in the call." |
| "direct the customer to a human staff member" | "There is no human staff, because the salon is not real. Never offer to transfer, escalate, or arrange a callback." |
| "Ask if there's anything else… before concluding" | "Warm but brief. One or two sentences per turn." |

The workflow was strictly worse than the prompt it sat on top of, and it was invisible to code review
because it lived only in the dashboard.

## Decision

Remove the workflow. Gigi runs on her system prompt alone.

The `workflow` field is now a start-node-only graph — the ElevenLabs API ignores `{"workflow": null}`
on a `PATCH`, so an empty graph is how you actually clear one:

```jsonc
{ "nodes": { "start_node": { "type": "start", "position": {"x": 0, "y": 0}, "edge_order": [] } },
  "edges": {} }
```

Nothing else changed. The system prompt, the first message, the knowledge base, and all six tools
(`check_availability`, `create_booking`, `reschedule_booking`, `cancel_booking`, `end_call`,
`language_detection`) were verified intact after the change.

## Consequences

- **One place defines behaviour.** Conversation phasing is prose in the system prompt, which is
  reviewable in a diff, versioned in `integrations/elevenlabs/system-prompt.md`, and already
  describes greeting → inquiry → booking → confirmation more precisely than the nodes did.
- **No unprompted turns.** Without node transitions, Gigi speaks only in response to the caller.
- **Reduced-scope answers.** The over-sharing was a second agent introducing itself, not a chatty
  LLM. The "one or two sentences per turn" rule in the system prompt was never the thing failing.
- **Multi-agent routing is given up.** It was not being used for anything the prompt cannot do. If a
  genuine need appears — a distinct voice for a distinct phase, a different LLM for a reasoning-heavy
  step — reintroduce it deliberately, set `entry_behavior` explicitly rather than leaving it `auto`,
  and version the graph under `integrations/elevenlabs/`.

## The drift trap

`integrations/elevenlabs/system-prompt.md` matched the live agent's prompt **exactly** — 7,066
characters, byte-for-byte. Every check we had was green. The workflow still overrode it, because
nothing in the repo knew the workflow existed.

Versioning the system prompt is not the same as versioning the agent. Agent behaviour is the whole
`conversation_config` *plus* `workflow` *plus* attached tools *plus* the knowledge base, and the
dashboard can change any of them without touching a file here.

**When Gigi behaves in a way the system prompt does not explain, read the live config before editing
the prompt.** The prompt was blameless both times this has come up — once for tools that were created
but never attached (see the v1.0.0 release checklist), and once here.

```bash
curl -s -H "xi-api-key: $ELEVENLABS_API_KEY" \
  https://api.elevenlabs.io/v1/convai/agents/<agent-id>
```

Conversation transcripts are the fastest diagnosis: `GET /v1/convai/conversations/<id>` returns each
turn with its `time_in_call_secs` and `tool_calls`, which is how the `notify_condition_1_met`
transition above was found. A `termination_reason` field on the same endpoint is also what identified
an unrelated quota failure that had been presenting to callers as "check your connection".
