import type { Salon } from "./types";

export const SALON_TIMEZONE = "America/Los_Angeles";

export const salon = {
  name: "Glow & Go",
  tagline: "Your chair is waiting.",
  timezone: SALON_TIMEZONE,
  disclaimer:
    "Glow & Go is a demonstration built by James Raven Tabag. No booking is real, and all booking data is synthetic.",
} as const satisfies Salon;
