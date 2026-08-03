import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    exclude: [
      "e2e/**",
      "node_modules/**",
      ".next/**",
      ".next-live-security/**",
      ".features-gen/**",
      ".open-next/**",
      ".wrangler/**",
    ],
    setupFiles: ["./vitest.setup.ts"],
  },
});
