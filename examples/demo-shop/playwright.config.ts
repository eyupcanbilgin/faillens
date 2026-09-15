import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
export default defineConfig({
  testDir: ".",
  testMatch: "checkout.spec.ts",
  workers: 1,
  retries: 1,
  timeout: 10000,
  expect: { timeout: 700 },
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: fileURLToPath(
          new URL("../../artifacts/demo-results.json", import.meta.url),
        ),
      },
    ],
  ],
  outputDir: fileURLToPath(
    new URL("../../artifacts/playwright", import.meta.url),
  ),
  use: {
    baseURL: "http://127.0.0.1:4179",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node server.mjs",
    url: "http://127.0.0.1:4179",
    reuseExistingServer: false,
  },
});
