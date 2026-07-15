import { describe, expect, it } from "vitest";

import { formatCallDuration, formatDuration, formatPrice } from "@/lib/format";

describe("formatPrice", () => {
  it("omits cents for whole-dollar prices", () => {
    expect(formatPrice(9500)).toBe("$95");
  });

  it("preserves non-zero cents", () => {
    expect(formatPrice(9550)).toBe("$95.50");
  });
});

describe("formatDuration", () => {
  it.each([
    [15, "15 min"],
    [45, "45 min"],
    [60, "1 hr"],
    [90, "1 hr 30 min"],
    [105, "1 hr 45 min"],
    [120, "2 hr"],
    [240, "4 hr"],
  ])("formats %i minutes as %s", (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });
});

describe("formatCallDuration", () => {
  it.each([
    [0, "00:00"], [59, "00:59"], [60, "01:00"], [61, "01:01"],
    [600, "10:00"], [3599, "59:59"],
  ])("formats %i seconds as %s", (seconds, expected) => {
    expect(formatCallDuration(seconds)).toBe(expected);
  });
});
