import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextCli = require.resolve("next/dist/bin/next");

const result = spawnSync(process.execPath, [nextCli, "build", "--webpack"], {
  env: {
    ...process.env,
    NEXT_PUBLIC_AGENT_MODE: "simulated",
    NEXT_PUBLIC_ELEVENLABS_AGENT_ID: "",
  },
  stdio: "inherit",
});

if (result.error) {
  console.error("Failed to start the e2e build:", result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
