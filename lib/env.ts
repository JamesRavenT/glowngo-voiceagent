export type PublicEnv = {
  readonly bookingSheetUrl?: string;
  readonly agentMode: AgentMode;
  readonly elevenLabsAgentId?: string;
};

export type AgentMode = "live" | "simulated";

export function resolveAgentMode(mode: string | undefined, agentId: string | undefined): AgentMode {
  return mode === "live" && Boolean(agentId?.trim()) ? "live" : "simulated";
}

const elevenLabsAgentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID?.trim() || undefined;

export const publicEnv: PublicEnv = {
  bookingSheetUrl: process.env.NEXT_PUBLIC_BOOKING_SHEET_URL || undefined,
  agentMode: resolveAgentMode(process.env.NEXT_PUBLIC_AGENT_MODE, elevenLabsAgentId),
  elevenLabsAgentId,
};
