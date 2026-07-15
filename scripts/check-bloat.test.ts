import { closeSync, ftruncateSync, mkdtempSync, mkdirSync, openSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const fixtures: string[] = [];

function createFixture(): string {
  const fixture = mkdtempSync(join(tmpdir(), "glow-and-go-bloat-"));
  fixtures.push(fixture);
  return fixture;
}

function createSparseFile(path: string, size: number): void {
  const descriptor = openSync(path, "w");
  ftruncateSync(descriptor, size);
  closeSync(descriptor);
}

function runCheck(root: string) {
  return spawnSync(process.execPath, [join(__dirname, "check-bloat.ts"), root], {
    encoding: "utf8",
  });
}

afterEach(() => {
  for (const fixture of fixtures.splice(0)) {
    rmSync(fixture, { recursive: true, force: true });
  }
});

describe("findBloatedDirectories", () => {
  it("reports a directory over 50 MB", () => {
    const fixture = createFixture();
    const oversized = join(fixture, "oversized");
    mkdirSync(oversized);
    createSparseFile(join(oversized, "large.bin"), 50 * 1024 * 1024 + 1);

    const result = runCheck(fixture);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(oversized);
    expect(result.stderr).toContain("50.0 MB");
    expect(result.stderr).toContain("1 files");
  });

  it("passes a directory under both thresholds", () => {
    const fixture = createFixture();
    const normal = join(fixture, "normal");
    mkdirSync(normal);
    writeFileSync(join(normal, "small.txt"), "small");

    const result = runCheck(fixture);

    expect(result.status).toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("");
  });

  it("skips an allow-listed directory without descending into it", () => {
    const fixture = createFixture();
    const nodeModules = join(fixture, "node_modules");
    mkdirSync(nodeModules);
    createSparseFile(join(nodeModules, "large.bin"), 50 * 1024 * 1024 + 1);

    const result = runCheck(fixture);

    expect(result.status).toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("");
  });
});
