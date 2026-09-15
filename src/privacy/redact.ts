import type { FailureEvidence } from "../core/evidence.js";
const sensitive =
  /authorization|cookie|api[-_]?key|token|password|passwd|secret|session|credential|signature/i;
const marker = "[REDACTED]";
export function redactHeaders(
  headers: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [
      k,
      sensitive.test(k) ? marker : redactText(v),
    ]),
  );
}
export function redactUrl(value: string): string {
  try {
    const url = new URL(value, "https://relative.invalid");
    url.username = "";
    url.password = "";
    // All query values are private by default; names and route retain diagnostic utility.
    for (const key of [...url.searchParams.keys()])
      url.searchParams.set(key, marker);
    url.hash = "";
    const result = url.toString();
    return value.startsWith("/")
      ? result.replace("https://relative.invalid", "")
      : result;
  } catch {
    return marker;
  }
}
export function redactText(value: string): string {
  return value
    .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(
      /[\u0000-\u0008\u000b-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,
      "",
    )
    .replace(/https?:\/\/[^\s<>"']+/gi, (v) => redactUrl(v))
    .replace(/([?&][\w.-]+=)[^&#\s"']+/g, `$1${marker}`)
    .replace(
      /((?:proxy-)?authorization|set-cookie|cookie)(["']?\s*[:=]\s*["']?)[^\r\n]+/gi,
      `$1$2${marker}`,
    )
    .replace(/\bBearer\s+[^\s"',;]+/gi, `Bearer ${marker}`)
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, marker)
    .replace(/\b(?:sk|pk)[-_][A-Za-z0-9_-]{12,}\b/g, marker)
    .replace(
      /((?:api[-_]?key|access[-_]?token|refresh[-_]?token|password|passwd|client[-_]?secret|session[-_]?id|secret|token)["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;&}]+)/gi,
      `$1${marker}`,
    )
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, marker)
    .replace(/(?:[A-Z]:\\|\/(?:Users|home)\/)[^\s"'<>]+/gi, "[LOCAL_PATH]");
}
export function redactEvidence(e: FailureEvidence): FailureEvidence {
  // Explicit normalized fields only: no raw metadata, attachment bytes, or paths.
  return {
    testId: e.testId,
    title: redactText(e.title),
    file: e.file ? redactText(e.file) : undefined,
    error: e.error
      ? {
          id: e.error.id,
          message: redactText(e.error.message),
          stack: e.error.stack ? redactText(e.error.stack) : undefined,
        }
      : undefined,
    steps: e.steps.map((s) => ({
      id: s.id,
      status: s.status,
      durationMs: s.durationMs,
      title: redactText(s.title),
    })),
    consoleErrors: e.consoleErrors.map((c) => ({
      id: c.id,
      text: redactText(c.text),
      type: c.type ? redactText(c.type) : undefined,
    })),
    networkFailures: e.networkFailures.map((n) => ({
      id: n.id,
      status: n.status,
      method: redactText(n.method),
      url: redactText(redactUrl(n.url)),
      failureText: n.failureText ? redactText(n.failureText) : undefined,
    })),
    attachments: [],
    retry: {
      id: e.retry.id,
      attempt: e.retry.attempt,
      previousAttempts: e.retry.previousAttempts,
      eventuallyPassed: e.retry.eventuallyPassed,
    },
    capture: {
      id: e.capture.id,
      networkComplete: e.capture.networkComplete,
      requestsObserved: e.capture.requestsObserved,
    },
    limitations: e.limitations.map(redactText),
  };
}
