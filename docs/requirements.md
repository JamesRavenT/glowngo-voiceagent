# Requirements

## What this is

A portfolio demonstration by **James Raven Tabag**. Glow & Go is a fictional Los Angeles hair salon
whose main feature is an **ElevenLabs voice agent** that books appointments via **n8n** into
**Google Sheets** and answers questions from a generated knowledge base.

The website is the stage; the voice agent is the act. A recruiter should land on the page, click one
button, talk to an AI, and watch a booking happen.

## The central constraint

The site ships **complete and deployable** without any third-party account existing. With no keys it
runs in **simulated mode**: a scripted conversation behind a visible badge. It goes live by filling
in environment variables — no code change.

## Honesty requirements

These are correctness requirements, not preferences. James's name is on this work; anything that
misrepresents it is a bug.

- **The simulated-mode badge must always be visible in simulated mode.** An unlabeled scripted "AI"
  would misrepresent his work. Playwright asserts it.
- **Every page carries the demo disclaimer crediting James Raven Tabag.** Since v0.1.1 the
  attribution lives in the hero — see [ADR 0004](decisions/0004-disclaimer-placement.md).
- **Cancel/reschedule requires a booking reference code.** Never authorize on name alone.
- **The public sheet carries synthetic data only.** The booking UI warns against real details.

## Locked decisions

Agreed with James. Do not silently revisit these.

| Area | Decision |
|---|---|
| Call | Browser mic / WebRTC only. No phone number. |
| No keys | Scripted simulated conversation behind a visible "Simulated preview — no live agent connected" badge. |
| Salon | Fictional US chain, 4 branches in one LA metro, invented addresses, `America/Los_Angeles`. |
| Booking | Per-stylist availability + real service durations. 3 stylists/branch, 12 total, phonetically distinct names. "Any stylist" is the default path. |
| Auth | Booking reference code (e.g. `GG-4821`) required to cancel or reschedule. |
| Sheet | Public link, synthetic seed data only. |
| Modal | Hologram in brand copper/gold on near-black — **not** cyan. |
| Content | Fully invented; `content/` is the single typed source of truth. |
| Tests | Playwright asserts UI + tool contracts against a mocked SDK. No real voice. |

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind, shadcn/ui, Lucide |
| Animation | Motion for React (component-level); GSAP + ScrollTrigger (section snapping — [ADR 0001](decisions/0001-gsap-for-section-snapping.md)) |
| Carousel | Embla via shadcn ([ADR 0002](decisions/0002-embla-for-carousels.md)) |
| Voice | ElevenLabs Agents, `@elevenlabs/react`, browser mic over WebRTC |
| Agent UI | ElevenLabs UI (shadcn-native): `orb`, `live-waveform`, `transcript-viewer` |
| Automation | n8n (Webhook + Google Sheets nodes) |
| Data | Google Sheets |
| Deploy | Cloudflare Workers via `@opennextjs/cloudflare` (site), n8n on VPS via Docker, ElevenLabs-hosted agent |

## Known limitations

Stated plainly rather than hidden.

- **No transactional lock in Sheets.** Two simultaneous bookings can both see a free slot.
- **Stylists have no individual working patterns** — no days off, shifts, or breaks.
- **The mock store is not durable.** Module-level state; it's a reference implementation.
- **The live voice path is untested.** Playwright cannot drive a real microphone or assert
  deterministically against a live LLM.
