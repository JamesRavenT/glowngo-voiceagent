import { describe, expect, it } from "vitest";

import { getCurrentPanelIndex } from "@/components/layout/section-snap";

describe("getCurrentPanelIndex", () => {
  it("tracks the last panel whose top the viewport has reached", () => {
    expect(getCurrentPanelIndex([0, 900, 2100, 3000], 2200)).toBe(2);
  });

  it("selects the next panel at its boundary", () => {
    expect(getCurrentPanelIndex([0, 900, 2100], 898)).toBe(1);
  });

  it("clamps scroll positions before the first panel to the first panel", () => {
    expect(getCurrentPanelIndex([20, 920], 0)).toBe(0);
  });

  it("returns -1 when there are no panels", () => {
    expect(getCurrentPanelIndex([], 0)).toBe(-1);
  });
});
