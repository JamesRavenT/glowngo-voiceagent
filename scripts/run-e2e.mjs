import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { artifactSentinels } from "./security-sentinels.mjs";

const require = createRequire(import.meta.url);
const bddCli = path.join(path.dirname(require.resolve("playwright-bdd")), "cli", "index.js");
const projectRoot = path.resolve(process.cwd());
const bddOutputDirectory = path.resolve(projectRoot, ".features-gen");
const runnerModeFlags = new Set(["--visual", "--live-security"]);
const forwardedPlaywrightArgs = process.argv.slice(2).filter((argument) => !runnerModeFlags.has(argument));

function run(script, args, env) {
  const result = spawnSync(process.execPath, [script, ...args], { env, stdio: "inherit" });
  if (result.error) {
    console.error("Failed to start an e2e command:", result.error);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function generateBdd(env) {
  if (path.dirname(bddOutputDirectory) !== projectRoot || path.basename(bddOutputDirectory) !== ".features-gen") {
    throw new Error("Refusing to clear an unexpected BDD output directory");
  }
  rmSync(bddOutputDirectory, { recursive: true, force: true });
  run(bddCli, ["--config", "playwright.config.ts"], env);
}

function runPlaywright(modeArgs, env) {
  run(require.resolve("@playwright/test/cli"), [
    "test",
    "--config",
    "playwright.config.ts",
    ...forwardedPlaywrightArgs,
    ...modeArgs,
  ], env);
}

const commonEnv = {
  ...process.env,
  ELEVENLABS_API_KEY: artifactSentinels.server["elevenlabs-api-key"],
  N8N_WEBHOOK_SECRET: artifactSentinels.server["n8n-webhook-secret"],
};

if (process.argv.includes("--visual")) {
  const visualEnv = { ...commonEnv, E2E_INCLUDE_VISUAL: "1" };
  run(fileURLToPath(new URL("./build-e2e.mjs", import.meta.url)), [], visualEnv);
  generateBdd(visualEnv);
  runPlaywright([
    "--grep",
    "@visual",
    "--project",
    "desktop-bdd",
  ], visualEnv);
} else if (process.argv.includes("--live-security")) {
  const liveEnv = { ...commonEnv, E2E_INCLUDE_DEPLOYMENT: "1", E2E_SKIP_WEBSERVER: "1" };
  run(fileURLToPath(new URL("./build-live-security.mjs", import.meta.url)), [], liveEnv);
  generateBdd(liveEnv);
  runPlaywright(["--grep", "@deployment"], liveEnv);
} else {
  run(fileURLToPath(new URL("./build-e2e.mjs", import.meta.url)), [], commonEnv);
  generateBdd(commonEnv);
  runPlaywright([], commonEnv);
}
