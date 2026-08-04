import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

import { callCopy } from "@/content";
import { test } from "../e2e/fixtures/access-gate";

const { Given, When, Then } = createBdd(test);

Given("a call is in progress", async ({ page }) => {
  await page.goto("/");
  await page.locator("#services").scrollIntoViewIfNeeded();
  await page.locator("button.floating-call-button").click();
  await page.clock.install();
  await page.getByRole("button", { name: callCopy.startCallButton }).click();
  await page.clock.fastForward(1_000);
  await expect(page.getByText(callCopy.statusLabels.speaking, { exact: true })).toBeVisible();
});

When("the caller clicks the area outside the call modal", async ({ page }) => {
  await page.mouse.click(1, 1);
});

Then("the call modal closes", async ({ page }) => {
  await expect(page.getByRole("dialog", { name: "Glow & Go voice assistant" })).toBeHidden();
});

Then("the floating call button reports a call in progress", async ({ page }) => {
  await expect(page.getByRole("button", { name: callCopy.minimizedCallButtonAccessibleName })).toBeVisible();
});

Then("the call is still in progress", async ({ page }) => {
  await page.getByRole("button", { name: callCopy.minimizedCallButtonAccessibleName }).click();
  await expect(page.getByText(callCopy.statusLabels.speaking, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: callCopy.endCallButton })).toBeVisible();
});
