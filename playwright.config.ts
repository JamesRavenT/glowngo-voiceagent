import { defineConfig } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const bddTestDir = defineBddConfig({
  features: "features/**/*.feature",
  steps: "features/**/*.steps.ts",
  outputDir: ".features-gen",
});

const e2ePort = Number(process.env.E2E_PORT ?? "3000");

if (!Number.isInteger(e2ePort) || e2ePort < 1 || e2ePort > 65_535) {
  throw new Error(
    `Invalid E2E_PORT "${process.env.E2E_PORT}": expected an integer between 1 and 65535.`,
  );
}

const e2eBaseUrl = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  grepInvert: process.env.E2E_INCLUDE_VISUAL === "1"
    ? /@manual|@deployment/
    : process.env.E2E_INCLUDE_DEPLOYMENT === "1"
      ? /@manual|@visual/
      : /@manual|@visual|@deployment/,
  expect: {
    toHaveScreenshot: {
      pathTemplate: "e2e/visual-snapshots/{arg}-{projectName}-{platform}{ext}",
    },
  },
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
      testDir: "./e2e",
      use: { browserName: "chromium", viewport: { width: 1280, height: 800 } },
    },
    {
      name: "mobile",
      testDir: "./e2e",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "desktop-bdd",
      testDir: bddTestDir,
      use: { browserName: "chromium", viewport: { width: 1280, height: 800 } },
    },
    {
      name: "mobile-bdd",
      testDir: bddTestDir,
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: process.env.E2E_SKIP_WEBSERVER === "1" ? undefined : {
    command: `node node_modules/next/dist/bin/next start --port ${e2ePort} --hostname 127.0.0.1`,
    url: e2eBaseUrl,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
