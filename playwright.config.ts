import { defineConfig } from "@playwright/test";

const e2ePort = Number(process.env.E2E_PORT ?? "3000");

if (!Number.isInteger(e2ePort) || e2ePort < 1 || e2ePort > 65_535) {
  throw new Error(
    `Invalid E2E_PORT "${process.env.E2E_PORT}": expected an integer between 1 and 65535.`,
  );
}

const e2eBaseUrl = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }], ["allure-playwright"]]
    : [["list"], ["html", { open: "never" }], ["allure-playwright"]],
  globalSetup: "./scripts/allure-clean.mjs",
  use: {
    baseURL: e2eBaseUrl,
    contextOptions: { reducedMotion: "reduce" },
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop",
      use: { browserName: "chromium", viewport: { width: 1280, height: 800 } },
    },
    {
      name: "mobile",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: `node node_modules/next/dist/bin/next start --port ${e2ePort} --hostname 127.0.0.1`,
    url: e2eBaseUrl,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
