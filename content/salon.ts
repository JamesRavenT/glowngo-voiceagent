import type { Salon } from "./types";

export const SALON_TIMEZONE = "America/Los_Angeles";

export const salon = {
  name: "Glow & Go",
  tagline: "Meet your next look.",
  heroHeadlineLines: ["Meet your", "next look."],
  timezone: SALON_TIMEZONE,
  disclaimer:
    "Glow & Go, including its stylists, services, history, and locations, is invented and refers to no real business or person. This is a demonstration built by James Raven Tabag.",
} as const satisfies Salon;

export const siteCopy = {
  metadataTitle: "Glow & Go Voice Agent — Portfolio Demo",
  metadataDescription:
    "A fictional salon voice-agent demonstration built by James Raven Tabag.",
  skipToContent: "Skip to content",
  navigationLabel: "Primary navigation",
  footerNavigationLabel: "Footer navigation",
  footerCopyright: "© James Raven Tabag 2026",
  openMenuLabel: "Open navigation menu",
  closeMenuLabel: "Close navigation menu",
  heroEyebrow: "Los Angeles · By appointment",
  heroImageAlt: "Stylist working with a client in the Glow & Go salon",
  sections: [
    { id: "hero", label: "Home", heading: salon.tagline },
    { id: "about", label: "About", heading: "About" },
    { id: "services", label: "Services", heading: "Services" },
    { id: "locations", label: "Locations", heading: "Locations" },
    { id: "faq", label: "FAQ", heading: "Frequently asked questions" },
    { id: "contact", label: "Contact", heading: "Contact" },
  ],
} as const;
