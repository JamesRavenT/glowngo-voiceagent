import { expect, test } from "@playwright/test";

test("floating call button follows the desktop and mobile behavior", async ({ page, isMobile }) => {
  await page.goto("/");
  const button = page.getByRole("button", { name: "Call the salon voice agent", exact: true });
  await expect(button).toBeVisible();
  await expect(button).toHaveAccessibleName("Call the salon voice agent");

  const box = await button.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);

  if (!isMobile) {
    expect(box!.x).toBeGreaterThan(1280 / 2);
    expect(box!.y).toBeGreaterThan(800 / 2);
    await expect(button.locator("span.md\\:inline")).toBeVisible();
    return;
  }

  await page.evaluate(() => window.scrollTo(0, 600));
  await expect(button).toHaveAttribute("data-expanded", "false");
  await expect(button.locator("[data-visible]" )).toHaveAttribute("data-visible", "false");
  await expect(button).toHaveAccessibleName("Call the salon voice agent");

  await page.evaluate(() => window.scrollBy(0, -150));
  await expect(button).toHaveAttribute("data-expanded", "true");
  await expect(button.locator("[data-visible]" )).toHaveAttribute("data-visible", "true");

  await page.locator("footer").scrollIntoViewIfNeeded();
  const footerDisclaimer = page.locator("footer").getByText(/demonstration built by James Raven Tabag/i);
  const [buttonAtBottom, disclaimerBox] = await Promise.all([button.boundingBox(), footerDisclaimer.boundingBox()]);
  expect(buttonAtBottom).not.toBeNull();
  expect(disclaimerBox).not.toBeNull();
  const overlaps = !(
    buttonAtBottom!.x + buttonAtBottom!.width <= disclaimerBox!.x ||
    disclaimerBox!.x + disclaimerBox!.width <= buttonAtBottom!.x ||
    buttonAtBottom!.y + buttonAtBottom!.height <= disclaimerBox!.y ||
    disclaimerBox!.y + disclaimerBox!.height <= buttonAtBottom!.y
  );
  expect(overlaps).toBe(false);
});
