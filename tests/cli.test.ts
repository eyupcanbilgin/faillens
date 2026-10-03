import { spawnSync } from "node:child_process";
import { it, expect } from "vitest";
function cli(...args: string[]) {
  return spawnSync(
    process.execPath,
    ["--import", "tsx", "src/cli.ts", ...args],
    { encoding: "utf8", env: { ...process.env, OPENAI_API_KEY: "" } },
  );
}
it("runs deterministic mode without a key and exits zero for classified failures", () => {
  const r = cli(
    "analyze",
    "fixtures/product-bug/backend-500/input.json",
    "--format",
    "json",
  );
  expect(r.status).toBe(0);
  expect(JSON.parse(r.stdout).analyses[0].result.category).toBe("product_bug");
});
it.each([
  ["analyze", "missing.json"],
  ["analyze", "package.json"],
  [
    "analyze",
    "fixtures/unknown/assertion-only/input.json",
    "--max-failures",
    "0",
  ],
  ["analyze", "fixtures/unknown/assertion-only/input.json", "--ai", "openai"],
  ["analyze", "fixtures/unknown/assertion-only/input.json", "--format", "html"],
  [
    "analyze",
    "fixtures/unknown/assertion-only/input.json",
    "--output",
    "missing/directory/file",
  ],
])("returns nonzero for invalid input/configuration %s %s", (...args) => {
  const r = cli(...args);
  expect(r.status).not.toBe(0);
  expect(r.stderr).not.toContain("TypeError");
});
it.each([
  [
    "analyze",
    "fixtures/unknown/assertion-only/input.json",
    "--max-failures",
    "1e1",
  ],
  [
    "analyze",
    "fixtures/unknown/assertion-only/input.json",
    "--max-failures",
    "0x10",
  ],
  [
    "analyze",
    "fixtures/unknown/assertion-only/input.json",
    "--max-failures",
    "08",
  ],
  [
    "analyze",
    "fixtures/unknown/assertion-only/input.json",
    "--max-failures",
    "20.0",
  ],
  [
    "analyze",
    "fixtures/unknown/assertion-only/input.json",
    "--max-failures",
    "+20",
  ],
  [
    "analyze",
    "fixtures/unknown/assertion-only/input.json",
    "--max-failures",
    " 20",
  ],
])("rejects non-canonical --max-failures values %s %s %s %s", (...args) => {
  const r = cli(...args);
  expect(r.status).not.toBe(0);
  expect(r.stderr).toContain("max-failures");
  expect(r.stderr).not.toContain("TypeError");
});
it.each(["1", "20", "100"])(
  "accepts canonical --max-failures value %s",
  (value) => {
    const r = cli(
      "analyze",
      "fixtures/product-bug/backend-500/input.json",
      "--max-failures",
      value,
      "--format",
      "json",
    );
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout).analyses[0].result.category).toBe(
      "product_bug",
    );
  },
);
it("has help", () => {
  const r = cli("--help");
  expect(r.status).toBe(0);
  expect(r.stdout).toContain("analyze");
});
