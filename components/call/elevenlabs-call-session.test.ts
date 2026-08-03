import { describe, expect, it } from "vitest";

import {
  mapElevenLabsError,
  mapElevenLabsMessage,
  mapElevenLabsStatus,
  stripElevenLabsAudioTags,
} from "@/components/call/elevenlabs-call-session";
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

  it("strips ElevenLabs audio tags while mapping an agent message", () => {
    expect(mapElevenLabsMessage({
      message: "[warmly] Thanks for calling Glow and Go.",
      source: "ai",
      event_id: 1,
    }, 3.25, 0)).toEqual({
      id: "live-1",
      speaker: "agent",
      text: "Thanks for calling Glow and Go.",
      at: 3.25,
    });
  });

  it("passes caller text through unchanged while mapping its metadata", () => {
    const text = "  I'd like a balayage.\nIs Friday open?  ";

    expect(mapElevenLabsMessage({ message: text, source: "user", event_id: 2 }, 4.5, 1)).toEqual({
      id: "live-2",
      speaker: "caller",
      text,
      at: 4.5,
    });
  });

  it("turns permission and connection failures into actionable copy", () => {
    expect(mapElevenLabsError("NotAllowedError: microphone permission denied")).toBe(callCopy.micPermissionError);
    expect(mapElevenLabsError("transport failed")).toBe(callCopy.connectionError);
  });
});

describe("stripElevenLabsAudioTags", () => {
  it("removes a leading audio tag", () => {
    expect(stripElevenLabsAudioTags("[happy] Hi Raven.")).toBe("Hi Raven.");
  });

  it("removes a mid-string audio tag", () => {
    expect(stripElevenLabsAudioTags("Sure. [pause] One moment.")).toBe("Sure. One moment.");
  });

  it("removes multiple audio tags from one message", () => {
    expect(stripElevenLabsAudioTags("[warmly] Welcome. [long pause] How can I help? [supportive]"))
      .toBe("Welcome. How can I help?");
  });

  it("returns an empty string for a tag-only message", () => {
    expect(stripElevenLabsAudioTags(" [pause] ")).toBe("");
  });

  it("passes through a message with no tags byte-identically", () => {
    const message = "  Hi Raven.\nHow can I help?  ";

    expect(stripElevenLabsAudioTags(message)).toBe(message);
  });
});
