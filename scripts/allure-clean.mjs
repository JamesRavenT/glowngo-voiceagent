import { rm } from "node:fs/promises";
import { resolve } from "node:path";

export default async function cleanAllureResults() {
  await rm(resolve(process.cwd(), "allure-results"), {
    recursive: true,
    force: true,
  });
}
