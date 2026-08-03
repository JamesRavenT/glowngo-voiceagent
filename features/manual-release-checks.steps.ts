import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

Given(/^(?:the ElevenLabs account has exhausted its quota|a live call to the hosted agent|the deployed Cloudflare URL)$/, async ({ $testInfo }) => {
  $testInfo.skip(true, "Manual release check; excluded from the automated run by Playwright tag filtering");
});

When(/^(?:a caller starts a call|the caller asks one question)$/, async () => {});
Then(/^(?:the caller is not told to check their own connection|the agent gives one answer and then waits for at least five seconds|the deployed bundle carries the expected agent mode)$/, async () => {});
