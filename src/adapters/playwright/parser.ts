import { createHash } from "node:crypto";
import { z } from "zod";
import { CaptureSchema, type FailureEvidence } from "../../core/evidence.js";

export const MAX_REPORT_BYTES = 10 * 1024 * 1024;
const obj = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const str = (value: unknown): string =>
  typeof value === "string" ? value : "";
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const clip = (value: unknown): string => str(value).slice(0, 4000);
const Result = z.object({
  status: z.enum(["passed", "failed", "timedOut", "skipped", "interrupted"]),
  retry: z.number().int().min(0),
  error: z.unknown().optional(),
  errors: z.array(z.unknown()).optional(),
  steps: z.array(z.unknown()).optional(),
  attachments: z.array(z.unknown()).optional(),
});
const Test = z.object({
  expectedStatus: z.enum(["passed", "failed", "skipped"]).optional(),
  projectName: z.string().optional(),
  results: z.array(Result),
});

export function parseReport(raw: string, maxFailures = 20): FailureEvidence[] {
  if (!Number.isInteger(maxFailures) || maxFailures < 1 || maxFailures > 100)
    throw new Error("max-failures must be an integer from 1 to 100");
  if (Buffer.byteLength(raw) > MAX_REPORT_BYTES)
    throw new Error("Report exceeds the 10 MiB limit");
  let report: unknown;
  try {
    report = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON. Enable the Playwright JSON reporter.");
  }
  if (!Array.isArray(obj(report).suites))
    throw new Error(
      "Unsupported report: expected Playwright JSON reporter suites",
    );
  if (arr(obj(report).errors).length)
    throw new Error(
      "Playwright reported run-level errors; per-test triage is incomplete. Inspect the runner output.",
    );
  const failures: FailureEvidence[] = [];
  let visited = 0;
  function walk(suites: unknown[], titles: string[], depth: number): void {
    if (depth > 30) throw new Error("Report nesting exceeds 30 levels");
    for (const value of suites) {
      if (++visited > 50000)
        throw new Error("Report contains too many entries");
      const suite = obj(value);
      if (typeof suite.title !== "string" || !Array.isArray(suite.specs))
        throw new Error("Unsupported Playwright suite structure");
      const path = [...titles, clip(suite.title)];
      for (const value of suite.specs) {
        const spec = obj(value);
        if (typeof spec.title !== "string" || !Array.isArray(spec.tests))
          throw new Error("Unsupported Playwright spec structure");
        for (const [index, testValue] of spec.tests.entries()) {
          const parsed = Test.safeParse(testValue);
          if (!parsed.success)
            throw new Error("Unsupported Playwright test result structure");
          const test = parsed.data;
          // Expected failures and skips are intentional; unexpected passes are out of scope.
          if (test.expectedStatus === "skipped") continue;
          const failed = test.results.filter(
            (r) =>
              ["failed", "timedOut", "interrupted"].includes(r.status) &&
              r.status !== test.expectedStatus,
          );
          const chosen = failed.at(-1);
          if (!chosen || failures.length >= maxFailures) continue;
          const error = obj(chosen.error ?? chosen.errors?.[0]);
          const identity = JSON.stringify([
            path,
            spec.title,
            spec.file,
            spec.id,
            test.projectName,
            index,
          ]);
          const e: FailureEvidence = {
            testId: createHash("sha256")
              .update(identity)
              .digest("hex")
              .slice(0, 20),
            title: [...path, clip(spec.title), test.projectName]
              .filter(Boolean)
              .join(" › ")
              .slice(0, 4000),
            file: clip(spec.file),
            steps: [],
            consoleErrors: [],
            networkFailures: [],
            retry: {
              id: "retry-1",
              attempt: chosen.retry + 1,
              previousAttempts: test.results.indexOf(chosen),
              eventuallyPassed: test.results
                .slice(test.results.indexOf(chosen) + 1)
                .some((r) => r.status === "passed"),
            },
            capture: { id: "capture-1", networkComplete: false },
            attachments: [],
            limitations: [],
          };
          if (Object.keys(error).length)
            e.error = {
              id: "error-1",
              message: clip(error.message),
              stack: clip(error.stack),
            };
          function steps(values: unknown[], depth = 0): void {
            if (depth > 20) {
              e.limitations.push("Step nesting truncated");
              return;
            }
            for (const v of values) {
              if (e.steps.length >= 80) {
                e.limitations.push("Steps truncated at 80");
                return;
              }
              const s = obj(v);
              e.steps.push({
                id: `step-${e.steps.length + 1}`,
                title: clip(s.title),
                status: s.error ? "failed" : "passed",
                ...(typeof s.duration === "number" && s.duration >= 0
                  ? { durationMs: s.duration }
                  : {}),
              });
              steps(arr(s.steps), depth + 1);
            }
          }
          steps(chosen.steps ?? []);
          for (const value of (chosen.attachments ?? []).slice(0, 20)) {
            const a = obj(value);
            e.attachments.push({
              id: `attachment-${e.attachments.length + 1}`,
              name: clip(a.name),
              contentType: clip(a.contentType),
            });
            // Only our versioned inline JSON is decoded. Never open attachment paths.
            if (
              a.name !== "faillens-evidence-v1" ||
              a.contentType !== "application/json"
            )
              continue;
            try {
              if (typeof a.body !== "string" || a.body.length > 128000)
                throw new Error("Invalid capture");
              const capture = CaptureSchema.parse(
                JSON.parse(Buffer.from(a.body, "base64").toString("utf8")),
              );
              e.consoleErrors = capture.consoleErrors.map((c, i) => ({
                ...c,
                id: `console-${i + 1}`,
              }));
              e.networkFailures = capture.networkFailures.map((n, i) => ({
                ...n,
                id: `network-${i + 1}`,
              }));
              e.capture = {
                id: "capture-1",
                networkComplete: capture.networkComplete,
                requestsObserved: capture.requestsObserved,
              };
            } catch {
              e.limitations.push(
                "Invalid or oversized FailLens capture ignored",
              );
            }
          }
          if (!e.capture.networkComplete)
            e.limitations.push(
              "Complete network capture unavailable; absence of requests is not evidence",
            );
          if (
            str(error.message).length > 4000 ||
            str(error.stack).length > 4000
          )
            e.limitations.push("Error text truncated");
          e.limitations = [...new Set(e.limitations)];
          failures.push(e);
        }
      }
      walk(arr(suite.suites), path, depth + 1);
    }
  }
  walk(obj(report).suites as unknown[], [], 0);
  return failures;
}
