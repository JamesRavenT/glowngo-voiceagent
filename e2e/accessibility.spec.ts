import { expect, type Page } from "@playwright/test";

import { callCopy } from "@/content";
import { test } from "./fixtures/access-gate";

async function startCall(page: Page) {
  await expect(page.getByText(callCopy.statusLabels.consent, { exact: true })).toBeVisible();
  const startButton = page.getByRole("button", { name: callCopy.startCallButton });
  await expect(startButton).toBeVisible();
  await startButton.focus();
  await page.clock.install();
  await page.keyboard.press("Enter");
  await expect(page.getByText(callCopy.statusLabels.connecting, { exact: true })).toBeVisible();
  await page.clock.fastForward(1_000);
  await expect(page.getByText(callCopy.statusLabels.speaking, { exact: true })).toBeVisible();
  await expect(page.getByLabel("Call transcript")).toBeVisible();
}

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

test("keyboard-only users can minimize and reopen a live call, with textual speaker identities", async ({ page }) => {
  const callButton = page
    .getByRole("button", { name: "Book now — call Gigi, the Glow & Go voice agent", exact: true })
    .and(page.locator("button.floating-call-button"));
  await page.locator("#services").scrollIntoViewIfNeeded();
  await callButton.focus();
  await page.keyboard.press("Enter");
  await startCall(page);
  const transcript = page.getByLabel("Call transcript");
  await expect(page.getByRole("dialog", { name: "Glow & Go voice assistant" })).toBeVisible();
  await expect(transcript).toHaveAttribute("aria-live", "polite");

  await page.clock.fastForward(3_000);
  await expect(transcript.locator("p").nth(0).locator("span").first()).toHaveText("Agent");
  await expect(transcript.locator("p").nth(1).locator("span").first()).toHaveText("Caller");

  await page.keyboard.press("Escape");
  const minimizedCallButton = page.getByRole("button", { name: callCopy.minimizedCallButtonAccessibleName });
  await expect(minimizedCallButton).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Glow & Go voice assistant" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.querySelector("dialog")?.contains(document.activeElement))).toBe(true);
});
