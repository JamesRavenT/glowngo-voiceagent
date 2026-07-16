import { describe, expect, it } from "vitest";

import { getPanelSnapOffsets } from "@/components/layout/section-snap";

describe("getPanelSnapOffsets", () => {
  it("normalizes actual panel offsets against the page scroll range", () => {
    expect(getPanelSnapOffsets([0, 900, 2100, 3000], 3000)).toEqual([0, 0.3, 0.7, 1]);
  });

  it("clamps offsets to the ScrollTrigger progress range", () => {
    expect(getPanelSnapOffsets([-20, 400, 1200], 1000)).toEqual([0, 0.4, 1]);
  });
});
