import { beforeEach, describe, expect, it } from "vitest";
import { POST as cancel } from "@/app/api/mock/cancel-booking/route";
import { POST as create } from "@/app/api/mock/create-booking/route";
import { POST as reschedule } from "@/app/api/mock/reschedule-booking/route";
import { resetBookingStore } from "@/lib/booking/store";

const request = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) });
const createBody = { branchId: "silver-lake", serviceId: "precision-cut", stylistId: "dmitri", date: "2026-07-16", time: "09:00", customerName: "Test Person", customerPhone: "555-0199" };

describe("mock booking routes", () => {
  beforeEach(() => resetBookingStore([]));

  it("creates adjacent appointments but refuses Monday", async () => {
    expect((await create(request("/create", createBody))).status).toBe(201);
    expect((await create(request("/create", { ...createBody, time: "09:45" }))).status).toBe(201);
    expect((await create(request("/create", { ...createBody, date: "2026-07-13" }))).status).toBe(400);
  });

  it("reschedules and cancels only known references", async () => {
    const created = await create(request("/create", createBody));
    const booking = await created.json();
    expect((await reschedule(request("/reschedule", { reference: ` ${booking.reference.toLowerCase()} `, date: "2026-07-16", time: "10:00" }))).status).toBe(200);
    expect((await cancel(request("/cancel", { reference: booking.reference }))).status).toBe(200);
    expect((await cancel(request("/cancel", { reference: booking.reference }))).status).toBe(404);
    expect((await reschedule(request("/reschedule", { reference: "GG-9999", date: "2026-07-16", time: "10:00" }))).status).toBe(404);
  });

  it("returns 400 for malformed JSON", async () => {
    expect((await create(request("/create", "{"))).status).toBe(400);
  });
});
