import type { CallSession } from "@/components/call/call-session";

export const staticCallSessionFixture: CallSession = {
  status: "listening",
  elapsedSeconds: 61,
  inputVolume: 0.34,
  outputVolume: 0.12,
  transcript: [
    { id: "welcome", speaker: "agent", text: "Welcome to Glow & Go. How can I help?", at: 1 },
    { id: "request", speaker: "caller", text: "I'd like to book a haircut for Friday.", at: 7 },
  ],
  end() {},
};
