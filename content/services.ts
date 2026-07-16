import type { Service } from "./types";

export const services = [
  { id: "bang-trim", name: "Bang Trim", category: "Cuts & Styling", durationMinutes: 15, priceCents: 2500, description: "Freshen your fringe and restore its shape between full cuts." },
  { id: "deep-conditioning", name: "Deep Conditioning Treatment", category: "Treatments", durationMinutes: 30, priceCents: 6000, description: "Restore softness, shine, and moisture with an intensive conditioning treatment." },
  { id: "precision-cut", name: "Precision Cut", category: "Cuts & Styling", durationMinutes: 45, priceCents: 9500, description: "Get a tailored cut shaped for your hair, features, and daily routine." },
  { id: "blowout", name: "Blowout & Style", category: "Cuts & Styling", durationMinutes: 45, priceCents: 7500, description: "Leave with smooth, polished hair styled for your day or occasion." },
  { id: "gloss-toner", name: "Gloss & Toner", category: "Color Services", durationMinutes: 45, priceCents: 8500, description: "Refresh your tone and add luminous shine without a full color service." },
  { id: "bridal-styling", name: "Bridal Styling", category: "Cuts & Styling", durationMinutes: 90, priceCents: 22000, description: "Enjoy a polished, lasting wedding style designed around your look." },
  { id: "partial-highlights", name: "Partial Highlights", category: "Color Services", durationMinutes: 105, priceCents: 19500, description: "Add brightness and dimension around the face and through the crown." },
  { id: "single-process", name: "Single Process Color", category: "Color Services", durationMinutes: 120, priceCents: 18000, description: "Create rich, even color from roots to ends in one dimensional shade." },
  { id: "full-highlights", name: "Full Highlights", category: "Color Services", durationMinutes: 150, priceCents: 26500, description: "Build brightness and dimension throughout your entire head of hair." },
  { id: "keratin", name: "Keratin Smoothing", category: "Treatments", durationMinutes: 150, priceCents: 32000, description: "Reduce frizz and make daily styling smoother and more manageable." },
  { id: "balayage", name: "Balayage", category: "Color Services", durationMinutes: 180, priceCents: 29500, description: "Create soft, hand-painted brightness with a natural, blended grow-out." },
  { id: "color-correction", name: "Color Correction", category: "Color Services", durationMinutes: 240, priceCents: 45000, description: "Work toward your desired color with a personalized corrective plan.", requiresConsultation: true },
] as const satisfies readonly Service[];
