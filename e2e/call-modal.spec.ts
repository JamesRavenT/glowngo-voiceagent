import { expect, test, type Page } from "@playwright/test";

const floatingButton = (page: Page) => page
  .getByRole("button", { name: "Book now — call Gigi, the Glow & Go voice agent", exact: true })
  .and(page.locator("button.floating-call-button"));
const dialog = (page: Page) => page.getByRole("dialog", { name: "Glow & Go voice assistant" });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("opens from the floating button and ends the call", async ({ page }) => {
  await floatingButton(page).focus();
  await page.keyboard.press("Enter");
  await expect(dialog(page)).toBeVisible();
  await expect(page.getByText("Simulated preview — no live agent connected")).toBeVisible();
  await page.getByRole("button", { name: "End call" }).focus();
  await page.keyboard.press("Enter");
  await expect(dialog(page)).toBeHidden();
  await expect(floatingButton(page)).toBeFocused();
});

test("opens from Contact and Escape restores focus", async ({ page }) => {
  const contactButton = page.locator("#contact").getByRole("button").filter({ hasText: "Talk to Gigi" });
  await contactButton.scrollIntoViewIfNeeded();
  await contactButton.click();
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await expect(contactButton).toBeFocused();
});

test("scripted transcript and timer advance in order", async ({ page }) => {
  await page.clock.install();
  await floatingButton(page).focus();
  await page.keyboard.press("Enter");
  await page.clock.fastForward(4_000);

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
  await floatingButton(page).focus();
  await page.keyboard.press("Enter");
  const endCall = page.getByRole("button", { name: "End call" });
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
