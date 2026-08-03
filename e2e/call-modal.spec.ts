import { expect, test, type Page } from "@playwright/test";

import { callCopy } from "@/content";

const floatingButton = (page: Page) => page
  .getByRole("button", { name: "Book now — call Gigi, the Glow & Go voice agent", exact: true })
  .and(page.locator("button.floating-call-button"));
const dialog = (page: Page) => page.getByRole("dialog", { name: "Glow & Go voice assistant" });
const minimizedCallButton = (page: Page) => page.getByRole("button", { name: callCopy.minimizedCallButtonAccessibleName });

async function revealFloatingButton(page: Page) {
  await page.locator("#services").scrollIntoViewIfNeeded();
}

async function startCall(page: Page) {
  await expect(page.getByText(callCopy.statusLabels.consent, { exact: true })).toBeVisible();
  const startButton = page.getByRole("button", { name: callCopy.startCallButton });
  await expect(startButton).toBeVisible();
  await page.clock.install();
  await startButton.click();
  await expect(page.getByText(callCopy.statusLabels.connecting, { exact: true })).toBeVisible();
  await page.clock.fastForward(1_000);
  await expect(page.getByText(callCopy.statusLabels.speaking, { exact: true })).toBeVisible();
  await expect(page.getByLabel("Call transcript")).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("opens from the floating button and ends the call", { tag: "@smoke" }, async ({ page }) => {
  await revealFloatingButton(page);
  await floatingButton(page).focus();
  await page.keyboard.press("Enter");
  await expect(dialog(page)).toBeVisible();
  await expect(page.getByText(callCopy.simulatedBadge)).toBeVisible();
  await startCall(page);
  await page.getByRole("button", { name: callCopy.endCallButton }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(callCopy.statusLabels.ended)).toBeVisible();
  await expect(page.getByText(callCopy.thankYou, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: callCopy.closeButton, exact: true }).last().click();
  await expect(dialog(page)).toBeHidden();
  await expect(floatingButton(page)).toBeFocused();
});

test("Escape before starting closes and restores focus to the Contact opener", async ({ page }) => {
  const contactButton = page.locator("#contact").getByRole("button").filter({ hasText: "Talk to Gigi" });
  await contactButton.scrollIntoViewIfNeeded();
  await contactButton.click();
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await expect(contactButton).toBeFocused();
});

test("Escape during a call minimizes to the focused bubble, which reopens from the keyboard", async ({ page }) => {
  await revealFloatingButton(page);
  await floatingButton(page).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: callCopy.startCallButton }).click();
  await expect(page.getByText(callCopy.statusLabels.connecting)).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await expect(minimizedCallButton(page)).toBeFocused();
  await expect(page.getByRole("status").filter({ hasText: callCopy.minimizedCallAnnouncement })).toBeAttached();

  await page.keyboard.press("Enter");
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page)).toContainText("Glow & Go voice assistant");
  await expect.poll(() => page.evaluate(() => document.querySelector("dialog")?.contains(document.activeElement))).toBe(true);
});

test("scripted transcript and timer advance in order", async ({ page }) => {
  await revealFloatingButton(page);
  await floatingButton(page).focus();
  await page.keyboard.press("Enter");
  await startCall(page);
  await page.clock.fastForward(3_000);

  const transcript = page.getByLabel("Call transcript");
  await expect(transcript).toHaveAttribute("aria-live", "polite");
  await expect(transcript.locator("p")).toHaveCount(2);
  await expect(transcript.locator("p").nth(0)).toContainText("Agent");
  await expect(transcript.locator("p").nth(0)).toContainText("Thanks for calling Glow & Go");
  await expect(transcript.locator("p").nth(1)).toContainText("Caller");
  await expect(transcript.locator("p").nth(1)).toContainText("I'd like a balayage");
  await expect(page.getByLabel(/Call duration/)).not.toHaveText("00:00");
});

test("focus cannot move to controls behind the open modal", async ({ page }) => {
  await revealFloatingButton(page);
  await floatingButton(page).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: callCopy.startCallButton }).click();
  const endCall = page.getByRole("button", { name: callCopy.endCallButton });
  await endCall.focus();
  await page.keyboard.press("Tab");
  await expect(dialog(page)).toContainText("Glow & Go voice assistant");
  await expect.poll(() => page.evaluate(() => {
    const activeElement = document.activeElement;
    const activeOutsideDialog = activeElement instanceof HTMLElement && activeElement !== document.body
      && !document.querySelector("dialog")?.contains(activeElement);
    return !activeOutsideDialog;
  })).toBe(true);
  await page.keyboard.press("Shift+Tab");
  await expect(endCall).toBeFocused();
});
