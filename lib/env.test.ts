import { describe, expect, it } from "vitest";

import { resolveAgentMode } from "@/lib/env";

describe("resolveAgentMode", () => {
  it.each([
    ["live", "agent-123", "live"],
    ["live", undefined, "simulated"],
    ["live", "   ", "simulated"],
    ["simulated", "agent-123", "simulated"],
    [undefined, "agent-123", "simulated"],
    ["anything-else", "agent-123", "simulated"],
  ] as const)("resolves %s with agent id %s to %s", (mode, agentId, expected) => {
    expect(resolveAgentMode(mode, agentId)).toBe(expected);
  });
});
