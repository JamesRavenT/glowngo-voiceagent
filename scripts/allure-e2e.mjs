import { spawnSync } from "node:child_process";

function run(command) {
  return spawnSync(command, {
    shell: true,
    stdio: "inherit",
  });
}

const testResult = run("pnpm test:e2e");
const testExitCode = Number.isInteger(testResult.status) ? testResult.status : 1;

run("pnpm allure:generate");
run("pnpm allure:open");

process.exit(testExitCode);
