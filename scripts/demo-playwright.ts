import { spawnSync } from "node:child_process";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { parseReport } from "../src/adapters/playwright/parser.js";
import { analyze } from "../src/core/analyzer.js";
import { render } from "../src/renderers.js";
const run = spawnSync(
  process.execPath,
  [
    "node_modules/@playwright/test/cli.js",
    "test",
    "--config",
    "examples/demo-shop/playwright.config.ts",
  ],
  { stdio: "inherit" },
);
// Only the demo harness absorbs intentional failures; consumer CI keeps Playwright's exit.
if (run.status !== 1)
  throw new Error(
    `Expected intentional Playwright failure exit 1, received ${run.status}`,
  );
const failures = parseReport(
  await readFile("artifacts/demo-results.json", "utf8"),
);
if (failures.length !== 5)
  throw new Error(`Expected five demo cases, received ${failures.length}`);
const analyses = [];
for (const e of failures) {
  const a = await analyze(e);
  const expected = e.title.match(
    /(product_bug|test_bug|flaky_suspect|environment|unknown):/,
  )?.[1];
  if (a.result.category !== expected)
    throw new Error(
      `Demo mismatch: expected ${expected}, received ${a.result.category}`,
    );
  analyses.push(a);
}
await mkdir("artifacts", { recursive: true });
await writeFile("artifacts/demo-triage.md", render(analyses, "markdown"));
console.log(render(analyses, "console"));
console.log(
  "Verified five intentional scenarios against real Playwright JSON.",
);
