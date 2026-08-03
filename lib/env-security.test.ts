import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { expect, it } from "vitest";

const configurationExtensions = new Set([".env", ".js", ".json", ".mjs", ".toml", ".ts", ".tsx", ".yaml", ".yml"]);
const rootConfigurationExtensions = new Set([".json", ".mjs", ".ts"]);
const sourceDirectories = ["app", "components", "lib", "scripts", "content", "integrations", "e2e", "features"];
const serverCredentialNames = ["ELEVENLABS_API_KEY", "N8N_WEBHOOK_SECRET"];
const serverOnlyNames = [...serverCredentialNames, "N8N_WEBHOOK_HEADER_NAME"];

function sourceConfigurationFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceConfigurationFiles(entryPath);
    if (entryPath.endsWith("env-security.test.ts")) return [];
    return configurationExtensions.has(path.extname(entry.name)) || entry.name.startsWith(".env") ? [entryPath] : [];
  });
}

function configurationFiles(projectRoot: string): string[] {
  const rootFiles = readdirSync(projectRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && (
      entry.name.startsWith(".env") || rootConfigurationExtensions.has(path.extname(entry.name))
    ))
    .map((entry) => path.join(projectRoot, entry.name));
  const sourceFiles = sourceDirectories.flatMap((directory) => {
    const directoryPath = path.join(projectRoot, directory);
    return existsSync(directoryPath) ? sourceConfigurationFiles(directoryPath) : [];
  });
  return [...rootFiles, ...sourceFiles];
}

it("does not expose a server credential under a NEXT_PUBLIC_ name", () => {
  const forbiddenNames = serverOnlyNames.map((name) => `NEXT_PUBLIC_${name}`);
  const offenders = configurationFiles(process.cwd()).flatMap((file) => {
    const source = readFileSync(file, "utf8");
    return forbiddenNames.filter((name) => source.includes(name)).map((name) => ({
      file: path.relative(process.cwd(), file),
      credential: name.replace("NEXT_PUBLIC_", ""),
    }));
  });

  expect(offenders).toEqual([]);
});
