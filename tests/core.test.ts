import { describe, it, expect } from "vitest";
import { parseReport } from "../src/adapters/playwright/parser.js";
import { deterministicTriage } from "../src/core/signals.js";
import { validateResult } from "../src/core/result.js";
import { render } from "../src/renderers.js";
import { analyze } from "../src/core/analyzer.js";

import { report, evidence } from "./helpers.js";
describe("adapter and deterministic core", () => {
  it("does not hide global failures or unexpected timeout on test.fail", () => {
    expect(() =>
      parseReport(
        JSON.stringify({ suites: [], errors: [{ message: "compile failed" }] }),
      ),
    ).toThrow("run-level");
    expect(
      parseReport(
        report({ status: "timedOut", retry: 0 }, { expectedStatus: "failed" }),
      ),
    ).toHaveLength(1);
  });
  it("parses a failed test and declines unsupported diagnosis", () => {
    const e = evidence();
    expect(e.error?.id).toBe("error-1");
    expect(deterministicTriage(e).category).toBe("unknown");
  });
  it("rejects malformed JSON", () =>
    expect(() => parseReport("{")).toThrow("Invalid JSON"));
  it("rejects changed structure", () => {
    for (const s of [
      "{}",
      '{"suites":[{}]}',
      report({ status: "new", retry: 0 }),
    ])
      expect(() => parseReport(s)).toThrow("Unsupported");
  });
  it("returns no failures for passed, skipped or expected failures", () => {
    expect(parseReport(report({ status: "passed", retry: 0 }))).toEqual([]);
    expect(
      parseReport(report(undefined, { expectedStatus: "failed" })),
    ).toEqual([]);
    expect(
      parseReport(report(undefined, { expectedStatus: "skipped" })),
    ).toEqual([]);
  });
  it("detects retries that recover", () => {
    const e = parseReport(
      report(undefined, {
        results: [
          { status: "failed", retry: 0 },
          { status: "passed", retry: 1 },
        ],
      }),
    )[0]!;
    expect(deterministicTriage(e).category).toBe("flaky_suspect");
  });
  it("rejects input budgets and truncates errors", () => {
    expect(() => parseReport(" ".repeat(10485761))).toThrow("10 MiB");
    for (const n of [0, 101, 1.5])
      expect(() => parseReport(report(), n)).toThrow("max-failures");
    const e = parseReport(
      report({
        status: "failed",
        retry: 0,
        error: { message: "x".repeat(5000) },
      }),
    )[0]!;
    expect(e.error?.message.length).toBe(4000);
    expect(e.limitations).toContain("Error text truncated");
  });
  it("only accepts known inline captures, never attachment paths", () => {
    const e = parseReport(
      report({
        status: "failed",
        retry: 0,
        attachments: [
          { name: "trace", path: "../../secret" },
          {
            name: "faillens-evidence-v1",
            contentType: "application/json",
            path: "/secret",
          },
        ],
      }),
    )[0]!;
    expect(e.limitations).toContain(
      "Invalid or oversized FailLens capture ignored",
    );
    expect(JSON.stringify(e)).not.toContain("/secret");
  });
  it("limits failures and handles nested steps", () => {
    const e = parseReport(
      report({
        status: "failed",
        retry: 0,
        steps: Array.from({ length: 100 }, () => ({
          title: "click",
          duration: 1,
          steps: [{ title: "assert", error: { message: "failed" } }],
        })),
      }),
    )[0]!;
    expect(e.steps).toHaveLength(80);
    expect(e.steps[1]?.status).toBe("failed");
  });
  it("rejects missing IDs and non-unknown without evidence", () => {
    const e = evidence(),
      r = deterministicTriage(e);
    expect(() =>
      validateResult({ ...r, evidenceIds: ["imaginary"] }, e),
    ).toThrow();
    expect(() => validateResult({ ...r, category: "test_bug" }, e)).toThrow();
    expect(() => validateResult({ ...r, confidence: 2 }, e)).toThrow();
  });
  it("renders machine JSON, safe Markdown and terminal observations", async () => {
    const a = await analyze({
      ...evidence(),
      title: "<script>alert(1)</script> [x](https://evil.test)",
    });
    expect(JSON.parse(render([a], "json")).analyses).toHaveLength(1);
    expect(render([a], "markdown")).not.toContain("<script>");
    expect(render([a], "console")).toContain("Hypothesis");
    expect(render([], "console")).toContain("No failed");
  });
});
