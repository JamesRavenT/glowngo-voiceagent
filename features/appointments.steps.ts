import { expect, type APIResponse } from "@playwright/test";
import { createBdd } from "playwright-bdd";

import { test } from "../e2e/fixtures/access-gate";

const { Before, Given, When, Then } = createBdd(test);

type Booking = {
  reference: string;
  branchId: string;
  serviceId: string;
  stylistId: string;
  date: string;
  time: string;
};

let originalBooking: Booking | undefined;
let response: APIResponse | undefined;

Before({ tags: "@api" }, async ({ $testInfo }) => {
  $testInfo.skip($testInfo.project.name !== "desktop-bdd", "API scenarios run once in the desktop BDD project");
  originalBooking = undefined;
  response = undefined;
});

Given("an appointment has been booked", async ({ request }) => {
  const query = {
    branchId: "silver-lake",
    serviceId: "precision-cut",
    stylistId: "dmitri",
    date: "2026-07-17",
  };
  const availability = await request.post("/api/mock/check-availability", { data: query });
  expect(availability.status()).toBe(200);
  const { slots } = await availability.json();
  expect(slots.length).toBeGreaterThan(0);

  const created = await request.post("/api/mock/create-booking", {
    data: {
      ...query,
      time: slots[0].time,
      customerName: "BDD Cancellation Guest",
      customerPhone: "555-0198",
    },
  });
  expect(created.status()).toBe(201);
  originalBooking = await created.json();
});

When("a cancellation is attempted with a reference that does not exist", async ({ request }) => {
  response = await request.post("/api/mock/cancel-booking", { data: { reference: "GG-0000" } });
});

Then("the request is refused as not found", async () => {
  expect(response?.status()).toBe(404);
});

Then("the original appointment can still be retrieved by its own reference", async ({ request }) => {
  expect(originalBooking).toBeDefined();
  const retrieved = await request.post("/api/mock/reschedule-booking", {
    data: {
      reference: originalBooking!.reference,
      date: originalBooking!.date,
      time: originalBooking!.time,
    },
  });
  expect(retrieved.status()).toBe(200);
  expect(await retrieved.json()).toMatchObject(originalBooking!);
});

Given("a booking request carrying valid JSON", async () => {
  response = undefined;
});

When("it is sent with a non-JSON content type", async ({ request }) => {
  response = await request.post("/api/mock/check-availability", {
    headers: { "content-type": "text/plain" },
    data: JSON.stringify({
      branchId: "silver-lake",
      serviceId: "precision-cut",
      stylistId: "dmitri",
      date: "2026-07-16",
    }),
  });
});

Then("it is accepted", async () => {
  expect(response?.status()).toBe(200);
});
