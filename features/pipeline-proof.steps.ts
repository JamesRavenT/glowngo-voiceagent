import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given } = createBdd();

Given("the demo home page responds successfully", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
});
