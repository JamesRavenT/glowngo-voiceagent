import { beforeEach, describe, expect, it } from "vitest";
import { POST as cancel } from "@/app/api/mock/cancel-booking/route";
import { POST as check } from "@/app/api/mock/check-availability/route";
import { POST as create } from "@/app/api/mock/create-booking/route";
import { POST as reschedule } from "@/app/api/mock/reschedule-booking/route";
import { resetBookingStore } from "@/lib/booking/store";

const request = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) });
const createBody = { branchId: "silver-lake", serviceId: "precision-cut", stylistId: "dmitri", date: "2026-07-16", time: "09:00", customerName: "Test Person", customerPhone: "555-0199" };
const expectResponse = async (response: Response, status: number, body: unknown) => {
  expect(response.status).toBe(status);
  expect(await response.json()).toEqual(body);
};

describe("mock booking routes", () => {
  beforeEach(() => resetBookingStore([]));

  it("creates adjacent appointments but refuses Monday", async () => {
    await expectResponse(await create(request("/create", createBody)), 201, expect.objectContaining(createBody));
    await expectResponse(await create(request("/create", { ...createBody, time: "09:45" })), 201, expect.objectContaining({ ...createBody, time: "09:45" }));
    await expectResponse(await create(request("/create", { ...createBody, date: "2026-07-13" })), 400, { error: "Requested slot is not available" });
  });

  it("reschedules and cancels only known references", async () => {
    const created = await create(request("/create", createBody));
    const booking = await created.json();
    await expectResponse(await reschedule(request("/reschedule", { reference: ` ${booking.reference.toLowerCase()} `, date: "2026-07-16", time: "10:00" })), 200, { ...booking, date: "2026-07-16", time: "10:00" });
    await expectResponse(await cancel(request("/cancel", { reference: booking.reference })), 200, { reference: booking.reference, cancelled: true });
    await expectResponse(await cancel(request("/cancel", { reference: booking.reference })), 404, { error: "Booking reference not found" });
    await expectResponse(await reschedule(request("/reschedule", { reference: "GG-9999", date: "2026-07-16", time: "10:00" })), 404, { error: "Booking reference not found" });
  });

  it("returns exact errors for malformed references and missing fields", async () => {
    await expectResponse(await cancel(request("/cancel", { reference: "not-a-reference" })), 400, { error: "Invalid booking reference" });
    await expectResponse(await reschedule(request("/reschedule", { reference: "GG-123", date: "2026-07-16", time: "10:00" })), 400, { error: "Invalid booking reference" });
    await expectResponse(await cancel(request("/cancel", {})), 400, { error: "reference must be a non-empty string" });
    await expectResponse(await reschedule(request("/reschedule", { reference: "GG-9999" })), 404, { error: "Booking reference not found" });
    await expectResponse(await create(request("/create", { ...createBody, customerName: undefined })), 400, { error: "customerName must be a non-empty string" });
    await expectResponse(await check(request("/check", { serviceId: "precision-cut", date: "2026-07-16" })), 400, { error: "branchId must be a non-empty string" });
  });

  it("returns exact errors for invalid booking choices", async () => {
    await expectResponse(await check(request("/check", { branchId: "unknown", serviceId: "precision-cut", date: "2026-07-16" })), 400, { error: "Unknown branchId" });
    await expectResponse(await check(request("/check", { branchId: "silver-lake", serviceId: "unknown", date: "2026-07-16" })), 400, { error: "Unknown serviceId" });
    await expectResponse(await check(request("/check", { branchId: "silver-lake", serviceId: "precision-cut", date: "2026-99-99" })), 400, { error: "date must be a valid YYYY-MM-DD date" });
    await expectResponse(await create(request("/create", { ...createBody, branchId: "unknown" })), 400, { error: "Unknown branchId" });
    await expectResponse(await create(request("/create", { ...createBody, serviceId: "unknown" })), 400, { error: "Unknown serviceId" });

    resetBookingStore([{ ...createBody, reference: "GG-1000" }]);
    await expectResponse(await create(request("/create", createBody)), 400, { error: "Requested slot is not available" });
    await expectResponse(await reschedule(request("/reschedule", { reference: "GG-1000" })), 400, { error: "date must be a non-empty string" });
    await expectResponse(await reschedule(request("/reschedule", { reference: "GG-1000", date: "2026-99-99", time: "09:00" })), 400, { error: "date must be a valid YYYY-MM-DD date" });
    await expectResponse(await reschedule(request("/reschedule", { reference: "GG-1000", date: "2026-07-13", time: "09:00" })), 400, { error: "Requested slot is not available" });
  });

  it("returns an exact 400 body for malformed JSON", async () => {
    await expectResponse(await create(request("/create", "{")), 400, { error: "Request body must be valid JSON" });
  });
});
