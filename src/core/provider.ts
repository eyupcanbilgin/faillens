import type { FailureEvidence } from "./evidence.js";
import type { TriageResult } from "./result.js";
/** Receives only the redacted current failure and deterministic diagnosis. */
export interface TriageProvider {
  readonly name: string;
  analyze(evidence: FailureEvidence, baseline: TriageResult): Promise<unknown>;
}
