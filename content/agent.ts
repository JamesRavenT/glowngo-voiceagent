import type { VoiceAgent } from "./types";

export const voiceAgent = {
  name: "Gigi",
  pronouns: "she/her",
  role: "Glow & Go voice receptionist",
} as const satisfies VoiceAgent;
