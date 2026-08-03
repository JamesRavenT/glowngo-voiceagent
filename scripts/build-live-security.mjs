import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

import { artifactSentinels } from "./security-sentinels.mjs";

const require = createRequire(import.meta.url);
const nextCli = require.resolve("next/dist/bin/next");
const buildEnv = { ...process.env };
delete buildEnv.SENTRY_AUTH_TOKEN;

const result = spawnSync(process.execPath, [nextCli, "build", "--webpack"], {
  env: {
    ...buildEnv,
    NEXT_DIST_DIR: ".next-live-security",
    NEXT_PUBLIC_AGENT_MODE: "live",
    NEXT_PUBLIC_ELEVENLABS_AGENT_ID: artifactSentinels.publicAgentIdentifier,
    ELEVENLABS_API_KEY: artifactSentinels.server["elevenlabs-api-key"],
    N8N_WEBHOOK_SECRET: artifactSentinels.server["n8n-webhook-secret"],
  },
  stdio: "inherit",
});

if (result.error) {
  console.error("Failed to start the isolated live security build:", result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
