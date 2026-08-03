import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import type { NodeResult, Result } from "axe-core";
import { createBdd } from "playwright-bdd";

import { callCopy } from "@/content";

const { Given, When, Then } = createBdd();
const dialogName = "Glow & Go voice assistant";

async function openCallModal(page: Page) {
  await page.locator("#services").scrollIntoViewIfNeeded();
  await page.locator("button.floating-call-button").click();
  await expect(page.getByRole("dialog", { name: dialogName })).toBeVisible();
}

async function startSimulatedCall(page: Page) {
  await page.clock.install();
  await page.getByRole("button", { name: callCopy.startCallButton }).click();
  await expect(page.getByText(callCopy.statusLabels.connecting, { exact: true })).toBeVisible();
  await page.clock.fastForward(1_000);
  await expect(page.getByText(callCopy.statusLabels.speaking, { exact: true })).toBeVisible();
}

Given("a visitor on a mobile viewport", async ({ page, $testInfo }) => {
  $testInfo.skip($testInfo.project.name !== "mobile-bdd", "Horizontal overflow runs only in the mobile viewport project");
  await page.goto("/");
});

When("the page has finished laying out", async ({ page }) => {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
});

Then("the document is no wider than the screen", async ({ page }) => {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);
});

Given(/^the visitor is on (.+)$/, async ({ page }, state: string) => {
  await page.goto("/");
  if (state === "the home page") return;

  await openCallModal(page);
  if (state === "the call modal consent step") return;
  if (state === "the call modal during a call") {
    await startSimulatedCall(page);
    return;
  }
  throw new Error(`Unsupported accessibility state: ${state}`);
});

Then("an automated accessibility scan reports no serious or critical violations", async ({ page, $testInfo }) => {
  const results = await new AxeBuilder({ page }).analyze();
  const details = results.violations.map((violation: Result) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    helpUrl: violation.helpUrl,
    nodes: violation.nodes.map((node: NodeResult) => ({ target: node.target, failureSummary: node.failureSummary })),
  }));

  await $testInfo.attach("axe-accessibility-violations", {
    body: Buffer.from(JSON.stringify(details, null, 2)),
    contentType: "application/json",
  });

  const releaseBlocking = details.filter((detail: { impact: Result["impact"] }) => detail.impact === "serious" || detail.impact === "critical");
  expect(releaseBlocking, "Serious or critical axe violations are attached to the test report").toEqual([]);
});

Then("the hero section matches its visual baseline", async ({ page }) => {
  const hero = page.locator("#hero");
  await expect(hero).toBeVisible();
  await expect(hero).toHaveScreenshot("hero.png");
});

Then("the call modal consent state matches its visual baseline", async ({ page }) => {
  const consentDialog = page.getByRole("dialog", { name: dialogName });
  await expect(consentDialog).toBeVisible();
  await expect(consentDialog).toHaveScreenshot("call-modal-consent.png");
});
