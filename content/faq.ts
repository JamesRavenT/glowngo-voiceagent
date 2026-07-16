import type { FaqItem } from "./types";
import { voiceAgent } from "./agent";

export const faq = [
  { id: "booking", question: "How do I book an appointment?", answer: `Talk with ${voiceAgent.name}. She checks live availability and books the time that works for you.` },
  { id: "real-salon", question: "Is this a real salon?", answer: "No. Glow & Go is a demonstration built by James Raven Tabag. Every booking is synthetic, and no one is expecting you.", defaultOpen: true },
  { id: "specific-stylist", question: "Can I request a specific stylist?", answer: "Yes. Ask for a stylist by name, or ask for the first available stylist." },
  { id: "cancel-reschedule", question: "How do I cancel or reschedule?", answer: `Tell ${voiceAgent.name} your booking reference code. That code is required to change or cancel an appointment.` },
  { id: "cancellation-policy", question: "What is the cancellation policy?", answer: "Please give at least 24 hours' notice if you need to cancel or reschedule." },
  { id: "appointment-length", question: "How long will my appointment take?", answer: `Services run from 15 minutes to 4 hours. ${voiceAgent.name} will confirm the duration when you book.` },
  { id: "walk-ins", question: "Do you take walk-ins?", answer: `We are appointment only. Ask ${voiceAgent.name} about same-day openings.` },
  { id: "color-consultation", question: "Do I need a consultation for color correction?", answer: "Yes. A consultation is required before you can book color correction." },
  { id: "view-booking", question: "Where can I see my booking?", answer: "You can view it on the public sheet, which carries synthetic demo data only." },
] as const satisfies readonly FaqItem[];
