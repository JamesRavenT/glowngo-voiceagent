import { expect, test } from "@playwright/test";

test("floating call button follows the desktop and mobile behavior", async ({ page, isMobile }) => {
  await page.goto("/");
  const button = page.locator("button.floating-call-button");

  if (!isMobile) {
    await expect(button).toBeVisible();
    await expect(button).toHaveAccessibleName("Book now — call Gigi, the Glow & Go voice agent");
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.x).toBeGreaterThan(1280 / 2);
    expect(box!.y).toBeGreaterThan(800 / 2);
    await expect(button.locator("span.md\\:inline")).toBeVisible();
    return;
  }

  await expect(button).toBeHidden();

  await page.locator("#services").scrollIntoViewIfNeeded();
  await expect(button).toBeVisible();
  await expect(button).toHaveAccessibleName("Book now — call Gigi, the Glow & Go voice agent");
  await expect(button.locator("span.md\\:inline")).toBeHidden();
  await expect(button.locator("[data-visible]")).toHaveCount(0);
  const box = await button.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(56);
  expect(box!.height).toBeGreaterThanOrEqual(56);

  await page.locator("footer").scrollIntoViewIfNeeded();
  const footerCopyright = page.locator("footer").getByText("© James Raven Tabag 2026", { exact: true });
  const [buttonAtBottom, copyrightBox] = await Promise.all([button.boundingBox(), footerCopyright.boundingBox()]);
  expect(buttonAtBottom).not.toBeNull();
  expect(copyrightBox).not.toBeNull();
  const overlaps = !(
    buttonAtBottom!.x + buttonAtBottom!.width <= copyrightBox!.x ||
    copyrightBox!.x + copyrightBox!.width <= buttonAtBottom!.x ||
    buttonAtBottom!.y + buttonAtBottom!.height <= copyrightBox!.y ||
    copyrightBox!.y + copyrightBox!.height <= buttonAtBottom!.y
  );
  expect(overlaps).toBe(false);
});
