// Run with `node scripts/capture-screenshots.mjs` after `pnpm build`.
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, expect } from "@playwright/test";

const require = createRequire(import.meta.url);
const nextCli = require.resolve("next/dist/bin/next");
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const outputDirectory = path.join(projectRoot, "docs", "assets");
const port = 3100;
const baseURL = `http://127.0.0.1:${port}`;

const serverEnvironment = {
  ...process.env,
  NEXT_PUBLIC_AGENT_MODE: "simulated",
  NEXT_PUBLIC_ELEVENLABS_AGENT_ID: "",
  PORT: String(port),
};

const server = spawn(
  process.execPath,
  [nextCli, "start", "-p", String(port)],
  {
    cwd: projectRoot,
    env: serverEnvironment,
    stdio: ["ignore", "inherit", "inherit"],
  },
);
// Equivalent to `reuseExistingServer: false`: every capture starts a new server process.

const contextOptions = {
  deviceScaleFactor: 2,
  locale: "en-US",
  timezoneId: "America/Los_Angeles",
  colorScheme: "dark",
  reducedMotion: "reduce",
};

async function waitForServer() {
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Next.js exited before becoming ready (exit code ${server.exitCode}).`);
    }

    try {
      const response = await fetch(baseURL);
      if (response.ok) return;
    } catch {
      // The server may still be starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Next.js did not become ready at ${baseURL} within 30 seconds.`);
}

async function preparePage(page) {
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("body")).toBeVisible();
  await expect(page.locator("#hero")).toBeVisible();
  await expect(page.locator("#hero").getByRole("heading").first()).toBeVisible();
}

async function assertSafeModal(page) {
  await expect(page.getByText(/^Simulated preview/)).toBeVisible();
  const bodyText = await page.locator("body").innerText();

  for (const forbiddenValue of ["agent_3601", "glowngo-voiceagentdemo"]) {
    if (bodyText.includes(forbiddenValue)) {
      throw new Error(`Safety assertion failed: page body contains "${forbiddenValue}".`);
    }
  }
}

async function openCallModal(page) {
  const callButton = page
    .getByRole("button", {
      name: "Book now — call Gigi, the Glow & Go voice agent",
      exact: true,
    })
    .and(page.locator("button.floating-call-button"));
  await page.locator("#services").scrollIntoViewIfNeeded();
  await expect(callButton).toBeVisible();
  await callButton.click();
  await expect(page.getByRole("dialog", { name: "Glow & Go voice assistant" })).toBeVisible();
  await assertSafeModal(page);
}

await mkdir(outputDirectory, { recursive: true });

let browser;
try {
  await waitForServer();
  browser = await chromium.launch();

  const desktopContext = await browser.newContext({
    ...contextOptions,
    viewport: { width: 1280, height: 800 },
  });
  const desktopPage = await desktopContext.newPage();
  await preparePage(desktopPage);
  await desktopPage.screenshot({
    path: path.join(outputDirectory, "hero-desktop.png"),
  });

  const servicesSection = desktopPage.locator("#services");
  await servicesSection.scrollIntoViewIfNeeded();
  await expect(servicesSection.getByRole("heading", { level: 2 })).toBeVisible();
  await desktopPage.screenshot({
    path: path.join(outputDirectory, "sections-desktop.png"),
  });

  await openCallModal(desktopPage);
  await desktopPage.screenshot({
    path: path.join(outputDirectory, "call-modal-desktop.png"),
  });
  await desktopContext.close();

  const mobileContext = await browser.newContext({
    ...contextOptions,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await preparePage(mobilePage);
  await mobilePage.screenshot({
    path: path.join(outputDirectory, "hero-mobile.png"),
  });
  await mobileContext.close();
} finally {
  await browser?.close();
  if (server.exitCode === null) {
    server.kill();
  }
}
