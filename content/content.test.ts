import { describe, expect, it } from "vitest";

import { branches, faq, services, stylists } from "./index";

const expectUniqueIds = (items: readonly { id: string }[]) => {
  expect(new Set(items.map(({ id }) => id)).size).toBe(items.length);
};

describe("content invariants", () => {
  it("assigns every stylist to a real branch", () => {
    const branchIds = new Set(branches.map(({ id }) => id));
    expect(stylists.every(({ branchId }) => branchIds.has(branchId))).toBe(true);
  });

  it("assigns exactly three stylists to every branch", () => {
    for (const branch of branches) {
      expect(stylists.filter(({ branchId }) => branchId === branch.id)).toHaveLength(3);
    }
  });

  it("uses unique ids within every collection", () => {
    expectUniqueIds(branches);
    expectUniqueIds(stylists);
    expectUniqueIds(services);
    expectUniqueIds(faq);
  });

  it("uses positive integer durations and prices", () => {
    for (const service of services) {
      expect(Number.isInteger(service.durationMinutes)).toBe(true);
      expect(service.durationMinutes).toBeGreaterThan(0);
      expect(Number.isInteger(service.priceCents)).toBe(true);
      expect(service.priceCents).toBeGreaterThan(0);
    }
  });
});
