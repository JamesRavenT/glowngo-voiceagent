import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

import { artifactSentinels } from "../scripts/security-sentinels.mjs";

const { Before, Given, When, Then } = createBdd();

type Match = { file: string; sentinelClass: string };

let artifactDirectory = "";
let serverMatches: Match[] = [];
let publicAgentMatches: Match[] = [];

Before({ tags: "@security" }, async ({ $testInfo }) => {
  $testInfo.skip($testInfo.project.name !== "desktop-bdd", "Client artifacts are viewport-independent and are scanned once");
  artifactDirectory = "";
  serverMatches = [];
  publicAgentMatches = [];
});

async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  }));
  return nested.flat();
}

Given("the site has been built with known sentinel credentials", async () => {
  artifactDirectory = path.join(process.cwd(), ".next", "static");
});

Given("a live-mode build with known sentinel credentials", async () => {
  artifactDirectory = path.join(process.cwd(), ".next-live-security", "static");
});

When("the shipped client artifacts are scanned", async () => {
  const files = await listFiles(artifactDirectory);
  expect(files.length, `No client artifacts were found under ${path.relative(process.cwd(), artifactDirectory)}`).toBeGreaterThan(0);

  for (const file of files) {
    const bytes = await readFile(file);
    const relativeFile = path.relative(process.cwd(), file);
    for (const [sentinelClass, sentinel] of Object.entries(artifactSentinels.server)) {
      if (bytes.includes(Buffer.from(sentinel))) serverMatches.push({ file: relativeFile, sentinelClass });
    }
    if (bytes.includes(Buffer.from(artifactSentinels.publicAgentIdentifier))) {
      publicAgentMatches.push({ file: relativeFile, sentinelClass: "public-agent-identifier" });
    }
  }
});

Then(/^no server credential sentinel appears(?: in them)?$/, async () => {
  expect(serverMatches, "Server credential sentinel matches (file and class only)").toEqual([]);
});

Then("the public agent identifier sentinel is present", async () => {
  expect(publicAgentMatches.length, "The live client artifacts should contain the public agent identifier sentinel").toBeGreaterThan(0);
});
