import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import type { NodeResult, Result } from "axe-core";

import { accessCopy } from "@/content";
import { STORAGE_KEY } from "@/lib/access-gate/storage";
import {
  E2E_ACCESS_KEY,
  invalidAccess,
  rateLimitedAccess,
  routeAccessVerification,
  unavailableAccess,
  validAccess,
} from "./fixtures/access-gate";

async function seedStoredAccessKey(page: Page, value = E2E_ACCESS_KEY) {
  await page.addInitScript(({ key, storedValue }) => {
    window.localStorage.setItem(key, storedValue);
  }, { key: STORAGE_KEY, storedValue: value });
}

test("first visit without a stored key shows only the access gate", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: accessCopy.heading })).toBeVisible();
  await expect(page.locator("#hero")).toHaveCount(0);
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY)).toBeNull();
});

test("a valid key unlocks the site and is verified again after reload", async ({ page }) => {
  const requests = await routeAccessVerification(page, validAccess);
  await page.goto("/");

  await page.getByLabel(accessCopy.inputLabel).fill(E2E_ACCESS_KEY);
  await page.getByRole("button", { name: accessCopy.submitButton, exact: true }).click();
  await expect(page.locator("#hero")).toBeVisible();
  await expect.poll(() => requests.length).toBe(1);

  await page.reload();
  await expect(page.locator("#hero")).toBeVisible();
  await expect.poll(() => requests.length).toBe(2);
});

test("an invalid fresh key keeps the gate open and permits a corrected retry", async ({ page }) => {
  await routeAccessVerification(page, (_request, requestNumber) => (
    requestNumber === 1 ? invalidAccess : validAccess
  ));
  await page.goto("/");

  const input = page.getByLabel(accessCopy.inputLabel);
  const submit = page.getByRole("button", { name: accessCopy.submitButton, exact: true });
  await input.fill("TYPO-KEY");
  await submit.click();
  await expect(page.locator("#access-gate-message")).toHaveText(accessCopy.invalid);
  await expect(submit).toBeEnabled();

  await input.fill(E2E_ACCESS_KEY);
  await submit.click();
  await expect(page.locator("#hero")).toBeVisible();
});

test("a rejected stored key shows expiry wording and clears storage", async ({ page }) => {
  await seedStoredAccessKey(page);
  await routeAccessVerification(page, invalidAccess);

  await page.goto("/");

  const gateMessage = page.locator("#access-gate-message");
  await expect(gateMessage).toHaveText(accessCopy.expired);
  await expect(gateMessage).not.toHaveText(accessCopy.invalid);
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY)).toBeNull();
});

test("a 503 preserves a stored key and offers a retry", async ({ page }) => {
  await seedStoredAccessKey(page);
  await routeAccessVerification(page, unavailableAccess);

  await page.goto("/");

  await expect(page.locator("#access-gate-message")).toHaveText(accessCopy.unavailable);
  await expect(page.getByRole("button", { name: accessCopy.retryButton })).toBeEnabled();
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY))
    .toBe(E2E_ACCESS_KEY);
});

test("a 429 honors Retry-After and disables submission during the wait", async ({ page }) => {
  await routeAccessVerification(page, rateLimitedAccess("30"));
  await page.goto("/");

  const submit = page.getByRole("button", { name: accessCopy.submitButton, exact: true });
  await page.getByLabel(accessCopy.inputLabel).fill(E2E_ACCESS_KEY);
  await submit.click();

  await expect(page.getByRole("status")).toContainText("Too many attempts. Try again in");
  await expect(submit).toBeDisabled();
  await expect(page.getByRole("button", { name: accessCopy.retryButton })).toBeDisabled();
});

test("the locked access gate has no serious or critical axe violations", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: accessCopy.heading })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  const details = results.violations.map((violation: Result) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    helpUrl: violation.helpUrl,
    nodes: violation.nodes.map((node: NodeResult) => ({
      target: node.target,
      failureSummary: node.failureSummary,
    })),
  }));

  await testInfo.attach("axe-access-gate-violations", {
    body: Buffer.from(JSON.stringify(details, null, 2)),
    contentType: "application/json",
  });

  const releaseBlocking = details.filter((detail) => (
    detail.impact === "serious" || detail.impact === "critical"
  ));
  expect(releaseBlocking, "Serious or critical axe violations are attached to the test report").toEqual([]);
});
