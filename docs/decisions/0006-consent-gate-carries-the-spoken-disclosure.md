# 0006 — The consent gate carries the disclosure the agent used to speak

**Status:** Accepted (v1.0.0) · **Date:** 2026-07-20 · **Extends:** [ADR-0004](0004-disclaimer-placement.md)

## Context

Through v0.1.3 the call opened the moment the button was pressed, and the disclosure lived in two
places: the hero disclaimer on the page (ADR-0004), and the agent's own speech. Gigi's greeting
announced that this was a demo, and she warned the caller mid-booking not to give real details
before asking for a name and number.

That worked, but it cost something every single call. The demo notice was the first thing a caller
heard, before they had said anything, and the synthetic-data warning interrupted the booking at its
most natural moment. Both were repeated on every call, to callers who had already read the hero
disclaimer.

A second problem surfaced in testing. Instructions written as explanatory prose in the system prompt
were sometimes **spoken aloud verbatim** rather than followed. One caller heard:

> "The user has confirmed the time. I now have all the necessary information to create a booking
> except for the customer's name and phone number. I need to ask for these details and remind them
> to use made-up information."

The more disclosure logic the prompt carried, the more surface there was for that failure.

## Decision

The call no longer starts when the button is pressed. The modal opens on a **consent gate** that
states the disclaimer and asks the caller to use made-up details, headed by "Read this before you
call". The session starts only when the caller clicks through it.

Gigi therefore no longer says any of this proactively — not in her greeting, not in her closing, and
not before collecting a name.

**She still discloses when asked.** If a caller asks whether she is a real person, an AI, or a bot,
she answers plainly and immediately. If they ask whether the salon is real, or appear to believe it
is, she tells them it is fictional and names James as the author. That guardrail is untouched.

## Why

The standing requirement is that the caller is not misled. A gate the caller actively clicked
through is **stronger** evidence of informed consent than a sentence they half-heard while waiting
for a human — it is on screen, it is readable at their own pace, and it cannot be talked over.

The distinction that matters is between *proactive* disclosure and *honest response*. Moving the
proactive part to the gate removes repetition. Removing the honest response would be
misrepresentation, and was never on the table. `CLAUDE.md` calls the simulated-mode badge "a
correctness requirement, not decoration" for exactly this reason, and the same logic governs here.

Consolidating the disclosure into UI also shrinks the prompt's disclosure surface, which is the
surface that leaked.

## Consequences

- **The gate is load-bearing.** It is the only proactive disclosure a live caller receives. Any
  redesign of the modal inherits a correctness requirement, not a decoration — the same inheritance
  ADR-0004 gave the hero. The heading takes visual priority over the start button deliberately.
- `salon.disclaimer` remains the single source of the text, now consumed by the hero *and* the gate.
- The system prompt opens with a rule that everything it produces is spoken aloud, listing the
  leaked phrasings above as negative examples. Concrete examples hold better than abstract rules on
  the current model (`gemini-2.5-flash`).
- The prompt lives in `integrations/elevenlabs/system-prompt.md` and is version-controlled. Before
  v1.0.0 it existed only in the ElevenLabs dashboard, where its behaviour was unreviewable and
  would have been lost with the agent.
- Gigi's greeting is shorter, which is also just better hospitality.
- **This shifts a correctness guarantee from the agent to the client.** If the gate were ever
  bypassed — a deep link that auto-starts a call, say — a live caller would receive no proactive
  disclosure at all. Do not add an auto-start path.
