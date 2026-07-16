import { describe, expect, it } from "vitest";

import { about, branches, faq, serviceCategories, services, stylists, voiceAgent } from "./index";

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

  it("assigns every service to the ordered service categories", () => {
    expect(serviceCategories).toEqual(["Cuts & Styling", "Treatments", "Color Services"]);
    expect(serviceCategories.map((category) =>
      services.filter((service) => service.category === category).length,
    )).toEqual([4, 2, 6]);
  });

  it("defines the voice receptionist identity", () => {
    expect(voiceAgent).toMatchObject({ name: "Gigi", pronouns: "she/her" });
  });

  it("keeps stylists named in the About copy in the stylist roster", () => {
    const stylistNames = new Set(stylists.map(({ name }) => name));

    expect(about.featuredStylistNames.every((name) => stylistNames.has(name))).toBe(true);
  });
});
