import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { generateKnowledgeBase } from "@/scripts/generate-knowledge-base";

describe("generated knowledge base", () => {
  it("matches the committed artifact byte-for-byte", () => {
    const committed = readFileSync(resolve(process.cwd(), "artifacts/knowledge-base.md"), "utf8");
    expect(generateKnowledgeBase()).toBe(committed);
  });
});
