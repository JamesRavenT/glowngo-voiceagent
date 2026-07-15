import { beforeEach, describe, expect, it } from "vitest";
import { getAvailableSlots, intervalsOverlap } from "@/lib/booking/availability";
import { generateReferenceCode, normalizeReferenceCode } from "@/lib/booking/reference-code";
import { resetBookingStore } from "@/lib/booking/store";
import type { Booking } from "@/lib/booking/types";

const novaBalayage: Booking = { reference: "GG-4821", branchId: "silver-lake", serviceId: "balayage", stylistId: "nova", date: "2026-07-16", time: "13:30", customerName: "Sample Guest", customerPhone: "555-0100" };

describe("availability engine", () => {
  it("blocks Nova for a long service while colleagues remain free", () => {
    const query = { branchId: "silver-lake", serviceId: "bang-trim", date: "2026-07-16" };
    const nova = getAvailableSlots({ ...query, stylistId: "nova" }, [novaBalayage]);
    const dmitri = getAvailableSlots({ ...query, stylistId: "dmitri" }, [novaBalayage]);
    const paloma = getAvailableSlots({ ...query, stylistId: "paloma" }, [novaBalayage]);
    expect(nova.map((slot) => slot.time)).not.toContain("13:30");
    expect(nova.map((slot) => slot.time)).not.toContain("16:15");
    expect(nova.map((slot) => slot.time)).toContain("16:30");
    expect(dmitri).toHaveLength(40);
    expect(paloma).toHaveLength(40);
  });

  it("enforces closing time while allowing a service to finish exactly at close", () => {
    const base = { branchId: "silver-lake", date: "2026-07-16", stylistId: "dmitri" };
    expect(getAvailableSlots({ ...base, serviceId: "balayage" }, []).map((slot) => slot.time)).not.toContain("17:00");
    expect(getAvailableSlots({ ...base, serviceId: "bang-trim" }, []).map((slot) => slot.time)).toContain("18:45");
  });

  it("treats adjacent intervals as non-overlapping", () => {
    expect(intervalsOverlap(540, 585, 585, 630)).toBe(false);
    const first: Booking = { ...novaBalayage, serviceId: "precision-cut", time: "09:00" };
    expect(getAvailableSlots({ branchId: "silver-lake", serviceId: "precision-cut", stylistId: "nova", date: "2026-07-16" }, [first]).map((slot) => slot.time)).toContain("09:45");
  });

  it("returns no Monday slots", () => {
    expect(getAvailableSlots({ branchId: "silver-lake", serviceId: "bang-trim", date: "2026-07-13" }, [])).toEqual([]);
  });

  it("keeps any-stylist slots until all branch stylists are busy", () => {
    const query = { branchId: "silver-lake", serviceId: "bang-trim", date: "2026-07-16" };
    const busy = (stylistId: string): Booking => ({ ...novaBalayage, reference: `GG-${stylistId.length}111`, stylistId });
    expect(getAvailableSlots(query, [busy("nova")]).find((slot) => slot.time === "14:00")?.stylistId).toBe("dmitri");
    expect(getAvailableSlots(query, [busy("nova"), busy("dmitri"), busy("paloma")]).map((slot) => slot.time)).not.toContain("14:00");
  });
});

describe("reference codes", () => {
  it("normalizes speech-friendly input and rejects malformed codes", () => {
    expect(normalizeReferenceCode("  gg-4821 ")).toBe("GG-4821");
    expect(normalizeReferenceCode("GG-482")).toBeNull();
  });

  it("retries collisions", () => {
    const values = [0.4821, 0.7314];
    expect(generateReferenceCode(new Set(["GG-4821"]), () => values.shift()!)).toBe("GG-7314");
  });
});

beforeEach(() => resetBookingStore());
