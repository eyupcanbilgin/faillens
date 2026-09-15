import { z } from "zod";
import { Categories, evidenceMap, type FailureEvidence } from "./evidence.js";
export const SignalSchema = z
  .object({
    category: z.enum([
      "product_bug",
      "test_bug",
      "environment",
      "flaky_suspect",
    ]),
    strength: z.enum(["weak", "medium", "strong"]),
    reason: z.string().min(1).max(500),
    evidenceIds: z.array(z.string().min(1).max(80)).min(1).max(10),
  })
  .strict();
export type DiagnosticSignal = z.infer<typeof SignalSchema>;
export const TriageResultSchema = z
  .object({
    category: z.enum(Categories),
    confidence: z.number().min(0).max(1),
    hypothesis: z.string().min(1).max(800),
    evidenceIds: z.array(z.string().min(1).max(80)).max(10),
    nextSteps: z.array(z.string().min(1).max(400)).max(3),
    missingEvidence: z.array(z.string().min(1).max(200)).max(10),
    signals: z.array(SignalSchema).max(10),
  })
  .strict();
export type TriageResult = z.infer<typeof TriageResultSchema>;
export function validateResult(
  value: unknown,
  evidence: FailureEvidence,
): TriageResult {
  const result = TriageResultSchema.parse(value);
  const ids = evidenceMap(evidence);
  for (const id of [
    ...result.evidenceIds,
    ...result.signals.flatMap((s) => s.evidenceIds),
  ]) {
    if (!ids.has(id)) throw new Error("Result references unsupported evidence");
  }
  if (result.category !== "unknown" && !result.evidenceIds.length)
    throw new Error("Classification requires evidence");
  return result;
}
