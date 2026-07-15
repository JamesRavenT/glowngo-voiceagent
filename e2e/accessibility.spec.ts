import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("skip link is first in the keyboard order and reaches main content", async ({ page }) => {
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
  await expect(page.locator("#main-content")).toBeInViewport();
});

test("keyboard-only users can open and close the modal, with textual speaker identities", async ({ page }) => {
  const callButton = page.getByRole("button", { name: "Call the salon voice agent", exact: true });
  await callButton.focus();
  await page.keyboard.press("Enter");
  const transcript = page.getByLabel("Call transcript");
  await expect(page.getByRole("dialog", { name: "Glow & Go voice assistant" })).toBeVisible();
  await expect(transcript).toHaveAttribute("aria-live", "polite");

  await page.clock.install();
  await page.clock.fastForward(4_000);
  await expect(transcript.locator("p").nth(0).locator("span").first()).toHaveText("Agent");
  await expect(transcript.locator("p").nth(1).locator("span").first()).toHaveText("Caller");

  await page.keyboard.press("Escape");
  await expect(callButton).toBeFocused();
});
