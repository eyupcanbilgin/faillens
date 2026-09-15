import { z } from "zod";

export const Categories = [
  "product_bug",
  "test_bug",
  "environment",
  "flaky_suspect",
  "unknown",
] as const;
export type FailureCategory = (typeof Categories)[number];
const text = z.string().max(4000);
export const CaptureSchema = z
  .object({
    version: z.literal(1),
    networkComplete: z.boolean(),
    requestsObserved: z.number().int().nonnegative(),
    consoleErrors: z
      .array(z.object({ text, type: z.string().max(40) }))
      .max(40),
    networkFailures: z
      .array(
        z.object({
          method: z.string().max(20),
          url: text,
          status: z.number().int().min(100).max(599).optional(),
          failureText: text.optional(),
        }),
      )
      .max(40),
  })
  .strict();
export type Capture = z.infer<typeof CaptureSchema>;
export interface FailureEvidence {
  testId: string;
  title: string;
  file?: string;
  error?: { id: string; message: string; stack?: string };
  steps: {
    id: string;
    title: string;
    status: "passed" | "failed" | "skipped";
    durationMs?: number;
  }[];
  consoleErrors: { id: string; type?: string; text: string }[];
  networkFailures: {
    id: string;
    method: string;
    url: string;
    status?: number;
    failureText?: string;
  }[];
  retry: {
    id: string;
    attempt: number;
    previousAttempts: number;
    eventuallyPassed: boolean;
  };
  capture: { id: string; networkComplete: boolean; requestsObserved?: number };
  attachments: { id: string; name: string; contentType?: string }[];
  limitations: string[];
}
export function evidenceMap(e: FailureEvidence): Map<string, string> {
  return new Map([
    ...(e.error ? [[e.error.id, e.error.message] as const] : []),
    ...e.steps.map((s) => [s.id, `${s.title} (${s.status})`] as const),
    ...e.consoleErrors.map((s) => [s.id, s.text] as const),
    ...e.networkFailures.map(
      (s) =>
        [
          s.id,
          `${s.method} ${s.url} → ${s.status ?? s.failureText ?? "failure"}`,
        ] as const,
    ),
    [
      e.retry.id,
      `Attempt ${e.retry.attempt}; recovered on retry: ${e.retry.eventuallyPassed}`,
    ],
    [
      e.capture.id,
      `Network capture complete: ${e.capture.networkComplete}; requests observed: ${e.capture.requestsObserved ?? "unknown"}`,
    ],
  ]);
}
