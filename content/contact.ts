import { voiceAgent } from "./agent";

export const examplePhrases = [
  "Book me a balayage with Nova next Tuesday at 2.",
  "Who does color correction?",
  "What time does Silver Lake close on Sunday?",
  "How much is a keratin smoothing?",
  "Anything open this afternoon in Santa Monica?",
  "Cancel booking GG-4821.",
] as const;

export const contactCopy = {
  eyebrow: "Ready when you are",
  introduction: `Talk with ${voiceAgent.name} to ask a question, find an opening, or manage a demo booking. She is the Glow & Go voice receptionist.`,
  callButton: `Talk to ${voiceAgent.name}`,
  floatingCallButtonLabel: "Book Now",
  floatingCallButtonAccessibleName: `Book now — call ${voiceAgent.name}, the Glow & Go voice agent`,
  examplePhrasesHeading: "Try saying",
  quickReferenceHeading: "Service quick reference",
  quickReferenceCaption: "Glow & Go service durations and prices",
  serviceColumn: "Service",
  durationColumn: "Duration",
  priceColumn: "Price",
  bookingSheetHeading: "Demo booking sheet",
  bookingSheetLink: "View the synthetic demo booking sheet",
  bookingSheetDisclaimer: "This public sheet contains synthetic demo data only. Do not enter real personal details.",
  bookingSheetUnavailable: "The booking sheet will be connected once this demo is wired to live booking.",
} as const;
