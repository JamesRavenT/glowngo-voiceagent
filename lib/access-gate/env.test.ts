import { describe, expect, it } from "vitest";

import { parseAccessProjectId, parseAccessVerifyUrl } from "@/lib/access-gate/env";

describe("parseAccessProjectId", () => {
  it.each([
    ["123e4567-e89b-12d3-a456-426614174000", "123e4567-e89b-12d3-a456-426614174000"],
    ["123E4567-E89B-12D3-A456-426614174000", "123E4567-E89B-12D3-A456-426614174000"],
    ["  123e4567-e89b-12d3-a456-426614174000  ", "123e4567-e89b-12d3-a456-426614174000"],
  ])("parses %s", (raw, expected) => {
    expect(parseAccessProjectId(raw)).toBe(expected);
  });

  it.each([
    undefined,
    "",
    "   ",
    "not-a-uuid",
    "123e4567-e89b-12d3-a456426614174000",
    "123e4567-e89b-12d3-a456-42661417400z",
  ])("rejects %s with an actionable message", (raw) => {
    expect(() => parseAccessProjectId(raw)).toThrowError(/NEXT_PUBLIC_ACCESS_PROJECT_ID/);
  });
});

describe("parseAccessVerifyUrl", () => {
  it.each([
    undefined,
    "",
    "   ",
    "/verify-access-key",
    "http://example.com/verify-access-key",
    "not a URL",
  ])("rejects %s with an actionable message", (raw) => {
    expect(() => parseAccessVerifyUrl(raw)).toThrowError(/NEXT_PUBLIC_ACCESS_VERIFY_URL/);
  });

  it("trims and normalises an absolute HTTPS URL", () => {
    expect(parseAccessVerifyUrl("  https://example.com/verify-access-key  ")).toBe(
      "https://example.com/verify-access-key",
    );
  });
});
