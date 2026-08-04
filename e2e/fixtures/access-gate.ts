import type { Page, Request } from "@playwright/test";
import { test as base } from "playwright-bdd";

import { STORAGE_KEY } from "@/lib/access-gate/storage";
import { testAccessVerificationEndpoint } from "@/scripts/security-sentinels.mjs";

export const E2E_ACCESS_KEY = "ABCD-EFGH-JKLM-NPQ";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
};

export type AccessVerificationOutcome =
  | { status: 200; valid: boolean }
  | { status: 503 }
  | { status: 429; retryAfter?: string };

type AccessVerificationResolver =
  | AccessVerificationOutcome
  | ((request: Request, requestNumber: number) => AccessVerificationOutcome);

export async function routeAccessVerification(page: Page, resolver: AccessVerificationResolver) {
  const postRequests: Request[] = [];

  await page.route(testAccessVerificationEndpoint, async (route) => {
    const request = route.request();

    if (request.method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          ...CORS_HEADERS,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "content-type",
        },
      });
      return;
    }

    if (request.method() !== "POST") {
      await route.fulfill({ status: 405, headers: CORS_HEADERS });
      return;
    }

    postRequests.push(request);
    const outcome = typeof resolver === "function"
      ? resolver(request, postRequests.length)
      : resolver;

    if (outcome.status === 200) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: CORS_HEADERS,
        body: JSON.stringify({ valid: outcome.valid }),
      });
      return;
    }

    const rateLimitHeaders: Record<string, string> = outcome.status === 429 && outcome.retryAfter !== undefined
      ? {
          "Retry-After": outcome.retryAfter,
          "Access-Control-Expose-Headers": "Retry-After",
        }
      : {};

    await route.fulfill({
      status: outcome.status,
      contentType: "application/json",
      headers: { ...CORS_HEADERS, ...rateLimitHeaders },
      body: JSON.stringify({ error: outcome.status === 429 ? "rate_limited" : "unavailable" }),
    });
  });

  return postRequests;
}

export const validAccess: AccessVerificationOutcome = { status: 200, valid: true };
export const invalidAccess: AccessVerificationOutcome = { status: 200, valid: false };
export const unavailableAccess: AccessVerificationOutcome = { status: 503 };
export function rateLimitedAccess(retryAfter?: string): AccessVerificationOutcome {
  return { status: 429, retryAfter };
}

export const test = base.extend({
  page: async ({ baseURL, page }, providePage) => {
    await page.addInitScript(({ key, value }) => {
      window.localStorage.setItem(key, value);
    }, { key: STORAGE_KEY, value: E2E_ACCESS_KEY });
    await routeAccessVerification(page, validAccess);

    const originalGoto = page.goto.bind(page);
    page.goto = async (url, options) => {
      const response = await originalGoto(url, options);
      const appOrigin = baseURL ? new URL(baseURL).origin : null;
      const requestedOrigin = baseURL ? new URL(url, baseURL).origin : null;
      const finalOrigin = new URL(response?.url() ?? page.url()).origin;
      const isHtmlNavigation = response === null
        || response.headers()["content-type"]?.includes("text/html") === true;
      const isSuccessfulAppNavigation = appOrigin !== null
        && requestedOrigin === appOrigin
        && finalOrigin === appOrigin
        && (response === null || response.ok())
        && isHtmlNavigation;

      if (isSuccessfulAppNavigation) {
        await page.locator("#main-content").waitFor({ state: "attached", timeout: 15_000 });
      }

      return response;
    };

    await providePage(page);
  },
});
