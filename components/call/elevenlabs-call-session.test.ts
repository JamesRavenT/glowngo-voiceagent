import { describe, expect, it } from "vitest";

import { mapElevenLabsError, mapElevenLabsMessage, mapElevenLabsStatus } from "@/components/call/elevenlabs-call-session";
import { callCopy } from "@/content";

describe("ElevenLabs session mappings", () => {
  it("maps SDK status and mode", () => {
    expect(mapElevenLabsStatus("connecting", "listening")).toBe("connecting");
    expect(mapElevenLabsStatus("connected", "speaking")).toBe("speaking");
    expect(mapElevenLabsStatus("connected", "listening")).toBe("listening");
    expect(mapElevenLabsStatus("error", "listening")).toBe("error");
  });

  it("maps messages to transcript entries", () => {
    expect(mapElevenLabsMessage({ message: "Hello", role: "agent", event_id: 4 }, 1.5, 0)).toEqual({
      id: "live-4", speaker: "agent", text: "Hello", at: 1.5,
    });
    expect(mapElevenLabsMessage({ message: "Hi", role: "user" }, 2, 1).speaker).toBe("caller");
  });

  it("turns permission and connection failures into actionable copy", () => {
    expect(mapElevenLabsError("NotAllowedError: microphone permission denied")).toBe(callCopy.micPermissionError);
    expect(mapElevenLabsError("transport failed")).toBe(callCopy.connectionError);
  });
});
