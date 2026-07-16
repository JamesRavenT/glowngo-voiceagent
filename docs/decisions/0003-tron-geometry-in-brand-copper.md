# 0003 — Tron's geometry, never Tron's palette

**Status:** Accepted (v0.1.1) · **Date:** 2026-07-16

## Context

The v0.1.0 site was correct but flat — it lacked fashion sense. The brief for v0.1.1 asked for
"fashionista/aesthetic while being minimalist/futuristic/Tron-like."

Tron is cyan. A locked decision says the hologram is copper/gold on near-black and **not** cyan.
Taken literally, the brief contradicts the lock.

## Decision

Take Tron's **geometry and light** — hard edges, controlled glow, grid, backlit volumetrics, scanlines
— and render all of it in brand copper and gold. The palette does not move. Confirmed with James:
"Tron's geometry and light, hard edges, but I don't want it overflashy. I just want a modernized
aesthetic salon website."

## Why

The brand assets are the one thing in this project that was not invented. They are the fixed point
everything else is derived from. Cyan would make it a sci-fi site with a salon in it, rather than a
salon site with sci-fi light in it.

"Not overflashy" is as binding as the palette. Restraint is the deliverable — the sci-fi register
should be legible in the *lighting and structure*, not in effects.

## Consequences

- Any glow, scanline, or grid effect uses copper/gold values.
- Cyan, electric blue, and neon accents are out — including as "just a highlight".
- Effects that call attention to themselves are a failure of this decision even when on-palette.
