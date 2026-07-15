/* eslint-disable @typescript-eslint/no-require-imports -- Avoid Node's typeless-package ESM warning for this direct CLI. */
const { readdirSync, statSync } = require("node:fs");
const { basename, resolve } = require("node:path");

const MAX_DIRECTORY_BYTES = 50 * 1024 * 1024;
const MAX_DIRECTORY_FILES = 1_000;
const ALLOWED_LARGE_DIRECTORIES = new Set(["node_modules", ".next", ".git"]);

interface DirectoryStats {
  path: string;
  size: number;
  fileCount: number;
}

function measureDirectory(path: string): Omit<DirectoryStats, "path"> {
  let size = 0;
  let fileCount = 0;

  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const entryPath = resolve(path, entry.name);

    if (entry.isDirectory()) {
      const nested = measureDirectory(entryPath);
      size += nested.size;
      fileCount += nested.fileCount;
    } else if (entry.isFile()) {
      size += statSync(entryPath).size;
      fileCount += 1;
    }
  }

  return { size, fileCount };
}

function findBloatedDirectories(root: string): DirectoryStats[] {
  const resolvedRoot = resolve(root);
  const offenders: DirectoryStats[] = [];

  for (const entry of readdirSync(resolvedRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || ALLOWED_LARGE_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const path = resolve(resolvedRoot, entry.name);
    const stats = measureDirectory(path);
    if (
      stats.size > MAX_DIRECTORY_BYTES ||
      stats.fileCount > MAX_DIRECTORY_FILES
    ) {
      offenders.push({ path, ...stats });
    }
  }

  return offenders;
}

function formatMegabytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatBloatReport(offenders: DirectoryStats[]): string {
  const details = offenders
    .map(
      ({ path, size, fileCount }) =>
        `- ${path}: ${formatMegabytes(size)}, ${fileCount.toLocaleString("en-US")} files`,
    )
    .join("\n");

  const pnpmStoreGuidance = offenders.some(
    ({ path }) => basename(path) === ".pnpm-store",
  )
    ? [
        "A repository-local .pnpm-store is a known recurring problem in this repo. pnpm's store belongs in the user profile; remove this directory and correct the store location—do not add it to the allow-list.",
      ]
    : [];

  return [
    "Repository bloat check failed. Remove or relocate these directories, or add a legitimate build/cache directory to the allow-list:",
    details,
    ...pnpmStoreGuidance,
  ].join("\n");
}

function main(): void {
  const root = process.argv[2] ?? resolve(__dirname, "..");
  const offenders = findBloatedDirectories(root);

  if (offenders.length > 0) {
    console.error(formatBloatReport(offenders));
    process.exitCode = 1;
  }
}

main();
