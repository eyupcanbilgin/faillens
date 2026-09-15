import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/core/**/*.ts",
        "src/privacy/**/*.ts",
        "src/adapters/playwright/parser.ts",
      ],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 80 },
    },
  },
});
