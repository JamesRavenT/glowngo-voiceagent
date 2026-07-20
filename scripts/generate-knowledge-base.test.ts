import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { branches } from "@/content/branches";
import { services } from "@/content/services";
import { stylists } from "@/content/stylists";
import { generateKnowledgeBase } from "@/scripts/generate-knowledge-base";

describe("generated knowledge base", () => {
  it("includes every booking tool ID from content", () => {
    const generated = generateKnowledgeBase();

    for (const service of services) {
      expect(generated).toContain(`\`${service.id}\``);
    }
    for (const branch of branches) {
      expect(generated).toContain(`\`${branch.id}\``);
    }
    for (const stylist of stylists) {
      expect(generated).toContain(`\`${stylist.id}\``);
    }
  });

  it("matches the committed artifact byte-for-byte", () => {
    const committed = readFileSync(resolve(process.cwd(), "artifacts/knowledge-base.md"), "utf8");
    expect(generateKnowledgeBase()).toBe(committed);
  });
});
