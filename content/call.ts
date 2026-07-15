export const callCopy = {
  simulatedBadge: "Simulated preview — no live agent connected",
  micPermissionError: "Microphone access was blocked. Allow microphone access in your browser settings, then reopen the call.",
  connectionError: "The voice connection could not be established. Check your connection, then reopen the call.",
} as const;

export const simulatedCallScript = [
  { at: 1, status: "speaking", speaker: "agent", text: "Thanks for calling Glow & Go. What can I do for your hair?" },
  { at: 3.5, status: "listening", speaker: "caller", text: "I'd like a balayage with Nova next Tuesday afternoon." },
  { at: 6, status: "thinking" },
  { at: 7.5, status: "speaking", speaker: "agent", text: "Nova has 1:30 or 4:00 on Tuesday. Balayage runs about three hours — does 1:30 work?" },
  { at: 11, status: "listening", speaker: "caller", text: "1:30 is perfect." },
  { at: 12.5, status: "thinking" },
  { at: 14, status: "speaking", speaker: "agent", text: "Booked. Nova, Tuesday at 1:30, Silver Lake. Your reference is G-G-4-8-2-1." },
  { at: 18, status: "ended" },
] as const;
