import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
// npm_execpath avoids Windows .cmd shell quoting and invokes the actual npm CLI.
function run(command, args, cwd = process.cwd()) {
  const r = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, OPENAI_API_KEY: "" },
  });
  if (r.status !== 0)
    throw new Error(r.stderr || r.stdout || "Package smoke command failed");
  return r.stdout;
}
const npm = process.env.npm_execpath;
if (!npm) throw new Error("Run this via npm run test:package");
mkdirSync("work/package", { recursive: true });
run(process.execPath, [npm, "pack", "--pack-destination", "work/package"]);
const { version } = JSON.parse(readFileSync("package.json", "utf8"));
const tarball = resolve(`work/package/faillens-${version}.tgz`);
const consumer = mkdtempSync(resolve("work/package/consumer-"));
run(process.execPath, [
  npm,
  "install",
  "--no-audit",
  "--no-fund",
  "--ignore-scripts",
  "--prefix",
  consumer,
  tarball,
]);
const bin = resolve(consumer, "node_modules/faillens/dist/cli.js");
const output = run(process.execPath, [
  bin,
  "analyze",
  resolve("fixtures/product-bug/backend-500/input.json"),
  "--format",
  "json",
]);
if (JSON.parse(output).analyses[0].result.category !== "product_bug")
  throw new Error("Packed analysis mismatch");
if (!run(process.execPath, [bin, "--help"]).includes("analyze"))
  throw new Error("Packed CLI help missing");
if (
  !run(
    process.execPath,
    [npm, "exec", "--offline", "--", "faillens", "--help"],
    consumer,
  ).includes("analyze")
)
  throw new Error("Installed npm binary mapping failed");
console.log("Packed CLI installed and analyzed a fixture without an API key.");
