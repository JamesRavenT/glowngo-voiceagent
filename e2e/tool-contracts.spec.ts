import { expect, test } from "@playwright/test";

const validQuery = {
  branchId: "silver-lake",
  serviceId: "precision-cut",
  stylistId: "dmitri",
  date: "2026-07-16",
};

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "API contracts only need one Chromium project");
});

test("check-availability returns slots for an open day and none on Monday", async ({ request }) => {
  const openDay = await request.post("/api/mock/check-availability", { data: validQuery });
  expect(openDay.status()).toBe(200);
  expect((await openDay.json()).slots.length).toBeGreaterThan(0);

  const monday = await request.post("/api/mock/check-availability", {
    data: { ...validQuery, date: "2026-07-13" },
  });
  expect(monday.status()).toBe(200);
  expect(await monday.json()).toEqual({ slots: [] });
});

test("create-booking returns a reference and a valid booking can be cancelled", async ({ request }) => {
  const availability = await request.post("/api/mock/check-availability", { data: validQuery });
  const { slots } = await availability.json();
  const created = await request.post("/api/mock/create-booking", {
    data: {
      ...validQuery,
      time: slots[0].time,
      customerName: "Playwright Guest",
      customerPhone: "555-0102",
    },
  });
  expect(created.status()).toBe(201);
  const booking = await created.json();
  expect(booking.reference).toMatch(/^GG-\d{4}$/);

  const cancelled = await request.post("/api/mock/cancel-booking", {
    data: { reference: booking.reference },
  });
  expect(cancelled.status()).toBe(200);
  expect(await cancelled.json()).toMatchObject({ reference: booking.reference, cancelled: true });
});

test("cancel-booking returns 404 for an unknown reference", async ({ request }) => {
  const response = await request.post("/api/mock/cancel-booking", { data: { reference: "GG-9999" } });
  expect(response.status()).toBe(404);
});

test("reschedule-booking requires a valid reference", async ({ request }) => {
  const response = await request.post("/api/mock/reschedule-booking", {
    data: { reference: "GG-9999", date: "2026-07-16", time: "10:00" },
  });
  expect(response.status()).toBe(404);
});

test("malformed request bodies return 400 rather than 500", async ({ request }) => {
  const response = await request.post("/api/mock/create-booking", {
    headers: { "content-type": "application/json" },
    data: "{",
  });
  expect(response.status()).toBe(400);
});
