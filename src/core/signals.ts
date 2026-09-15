import type { FailureEvidence } from "./evidence.js";
import {
  validateResult,
  type DiagnosticSignal,
  type TriageResult,
} from "./result.js";
export function detectSignals(e: FailureEvidence): DiagnosticSignal[] {
  const signals: DiagnosticSignal[] = [];
  const add = (
    category: DiagnosticSignal["category"],
    strength: DiagnosticSignal["strength"],
    reason: string,
    evidenceIds: string[],
  ) =>
    signals.push({
      category,
      strength,
      reason,
      evidenceIds: evidenceIds.slice(0, 10),
    });
  const server = e.networkFailures.filter(
    (n) => n.status !== undefined && n.status >= 500,
  );
  if (server.length)
    add(
      "product_bug",
      "medium",
      "HTTP 5xx observed; application or upstream service failure is possible",
      server.map((n) => n.id),
    );
  const auth = e.networkFailures.filter(
    (n) => n.status === 401 || n.status === 403,
  );
  if (auth.length)
    add(
      "environment",
      "medium",
      "HTTP 401/403 observed; check credentials and permissions",
      auth.map((n) => n.id),
    );
  const infra =
    /ECONNREFUSED|ERR_CONNECTION_REFUSED|ENOTFOUND|ERR_NAME_NOT_RESOLVED|ECONNRESET|ERR_CONNECTION_RESET|browser.*crash/i;
  const infraIds = [
    ...(e.error && infra.test(e.error.message) ? [e.error.id] : []),
    ...e.networkFailures
      .filter((n) => infra.test(n.failureText ?? ""))
      .map((n) => n.id),
  ];
  if (infraIds.length)
    add(
      "environment",
      "strong",
      "Connection or browser infrastructure failure observed",
      infraIds,
    );
  if (e.retry.eventuallyPassed)
    add(
      "flaky_suspect",
      "strong",
      "A failed attempt was followed by a successful retry; cause remains unverified",
      [e.retry.id],
    );
  if (
    e.error &&
    /locator|waiting for getBy/i.test(e.error.message) &&
    /timeout|timed out/i.test(e.error.message) &&
    e.capture.networkComplete &&
    e.capture.requestsObserved === 0 &&
    e.steps.some((s) => s.status === "passed")
  )
    add(
      "test_bug",
      "medium",
      "Locator timed out after a completed step with zero requests in a complete capture",
      [
        e.error.id,
        e.capture.id,
        e.steps.find((s) => s.status === "passed")!.id,
      ],
    );
  return signals;
}
export function deterministicTriage(e: FailureEvidence): TriageResult {
  const signals = detectSignals(e);
  const candidates = [...new Set(signals.map((s) => s.category))];
  const category = e.retry.eventuallyPassed
    ? "flaky_suspect"
    : candidates.length === 1
      ? candidates[0]!
      : "unknown";
  const relevant =
    category === "unknown"
      ? signals
      : signals.filter((s) => s.category === category);
  const next = {
    product_bug: "Inspect service logs for the observed failing request.",
    environment:
      "Check dependency availability, credentials, and runner configuration.",
    test_bug:
      "Compare the locator with the current UI and test intent before editing it.",
    flaky_suspect:
      "Compare attempts and investigate timing or shared state; recovery alone does not identify cause.",
    unknown:
      "Collect request/console evidence and verify the assertion intent.",
  };
  return validateResult(
    {
      category,
      confidence:
        category === "unknown"
          ? 0.2
          : category === "flaky_suspect"
            ? 0.8
            : 0.65,
      hypothesis:
        category === "unknown"
          ? signals.length
            ? "The observed signals conflict; there is insufficient evidence to favor one explanation."
            : "There is insufficient evidence to classify this failure safely."
          : `The evidence suggests ${category.replaceAll("_", " ")} behavior. This is a diagnostic hypothesis, not a verified root cause.`,
      evidenceIds: [...new Set(relevant.flatMap((s) => s.evidenceIds))].slice(
        0,
        10,
      ),
      nextSteps: [next[category]],
      missingEvidence: [
        ...e.limitations.slice(0, 6),
        ...(category === "product_bug"
          ? ["Backend service logs"]
          : category === "unknown"
            ? ["Additional runtime context"]
            : []),
      ],
      signals,
    },
    e,
  );
}
