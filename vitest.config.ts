import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "tests/unit/**/*.test.ts",
      "tests/property/**/*.test.ts",
      "tests/contract/**/*.test.ts",
      "tests/ai-evals/**/*.test.ts",
    ],
    coverage: {
      provider: "v8",
      include: ["src/engine/**/*.ts", "src/server/guard.ts"],
      reporter: ["text", "json-summary"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
