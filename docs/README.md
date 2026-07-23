# Documentation

Project documentation for **Glow & Go**, a portfolio demonstration by James Raven Tabag.

New to the project? Read [requirements](requirements.md) → [architecture](architecture.md) →
[design](design.md), in that order. Each is short.

## How-to guides

| Document | What it answers |
|---|---|
| [setup-checklist.md](setup-checklist.md) | Short path: what to create and what goes in `.env` to test the agent. |
| [runbook.md](runbook.md) | Operational guide for taking the demo live (keys, n8n, Sheets). |
| [deployment-google-cloud.md](deployment-google-cloud.md) | Deploy n8n and Caddy to a Google Cloud VM. |

## Reference

| Document | What it answers |
|---|---|
| [architecture.md](architecture.md) | How the pieces fit and why the browser isn't in the booking path. |
| [CHANGELOG.md](CHANGELOG.md) | What changed in each release. |
| [Google Sheets schema](../integrations/google-sheets/schema.md) | Columns and data rules for the synthetic bookings sheet. |

## Explanation

| Document | What it answers |
|---|---|
| [requirements.md](requirements.md) | What this is, what it must do, what's locked, and what stack it uses. |
| [design.md](design.md) | Brand, tokens, motion, and layout rules. |
| [decisions/](decisions/) | Architecture decision records — why we chose what we chose. |

## Project history

| Document | What it records |
|---|---|
| [v1.0.0-release-checklist.md](v1.0.0-release-checklist.md) | What was verified against live n8n, and the manual steps still outstanding. |
| [plans/](plans/) | Implementation plan per release. |

## Where docs live and why

| File | Audience |
|---|---|
| `README.md` (root) | Anyone landing on the repo. Summary + quick start. |
| `docs/` | Humans who want the full picture — including anyone reviewing this as portfolio work. |
| `CLAUDE.md`, `AGENTS.md` (root) | The agents working on this repo — Claude plans, Codex implements. |

`CLAUDE.md` and `AGENTS.md` intentionally restate some architecture that also appears here. That
duplication is deliberate: agents read those two files directly and do not reliably follow links out
to `docs/`. When architecture changes, update `docs/architecture.md` **and** both agent files.
