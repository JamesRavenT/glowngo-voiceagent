import { expect } from "@playwright/test";

import { test } from "./fixtures/access-gate";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("sections render in the intended order and the disclaimer is visible", async ({ page }) => {
  const sectionIds = await page.locator("main > section, main > div > section").evaluateAll((sections) =>
    sections.map((section) => section.id),
  );
  expect(sectionIds).toEqual(["hero", "about", "services", "locations", "faq", "contact"]);

  const disclaimer = page.locator("#hero").getByText(/demonstration built by James Raven Tabag/i);
  await disclaimer.scrollIntoViewIfNeeded();
  await expect(disclaimer).toBeVisible();
});

test("navigation scrolls to a section and identifies the active location", async ({ page, isMobile }) => {
  if (isMobile) {
    const menuButton = page.getByRole("button", { name: "Open navigation menu", exact: true });
    await menuButton.focus();
    await page.keyboard.press("Enter");
    await page.getByRole("dialog", { name: "Primary navigation" }).getByRole("link", { name: "Services" }).click();
  } else {
    await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Services" }).click();
  }

  await expect(page).toHaveURL(/#services$/);
  await expect(page.locator("#services")).toBeInViewport();
  if (isMobile) {
    const menuButton = page.getByRole("button", { name: "Open navigation menu", exact: true });
    await menuButton.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "Primary navigation" }).getByRole("link", { name: "Services" }))
      .toHaveAttribute("aria-current", "location");
  } else {
    await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Services" }))
      .toHaveAttribute("aria-current", "location");
  }
});

test("every section heading clears the fixed navbar when navigated by hash", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload();

  for (const id of ["about", "services", "locations", "faq", "contact"]) {
    await page.locator(`a[href="#${id}"]`).first().evaluate((anchor: HTMLAnchorElement) => anchor.click());
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect.poll(async () => page.locator(`#${id}-heading`).evaluate((heading) => heading.getBoundingClientRect().top))
      .toBeGreaterThanOrEqual(80);
  }
});

test("navbar changes from transparent over the hero to solid after scrolling", async ({ page }) => {
  const navbar = page.getByRole("banner");
  await expect(navbar).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");

  await page.evaluate(() => window.scrollTo(0, document.querySelector("#services")!.getBoundingClientRect().top + window.scrollY));
  await expect.poll(async () => navbar.evaluate((element) => getComputedStyle(element).backgroundColor))
    .not.toBe("rgba(0, 0, 0, 0)");
});
