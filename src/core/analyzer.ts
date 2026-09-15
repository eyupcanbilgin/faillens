import { createHash } from "node:crypto";
import { redactEvidence, redactText } from "../privacy/redact.js";
import { operation } from "../telemetry.js";
import type { FailureEvidence } from "./evidence.js";
import type { TriageProvider } from "./provider.js";
import { validateResult, type TriageResult } from "./result.js";
import { deterministicTriage } from "./signals.js";
export interface Analysis {
  evidence: FailureEvidence;
  result: TriageResult;
  engine: string;
  warnings: string[];
  fingerprint: string;
}
export async function analyze(
  e: FailureEvidence,
  provider?: TriageProvider,
): Promise<Analysis> {
  return operation("faillens.analyze", async () => {
    const evidence = await operation("evidence.redact", () =>
      redactEvidence(e),
    );
    const baseline = await operation("signals.detect", () =>
      deterministicTriage(evidence),
    );
    let result = baseline;
    let engine = "deterministic";
    const warnings: string[] = [];
    if (provider) {
      try {
        const response = await operation("agent.triage", () =>
          provider.analyze(
            structuredClone(evidence),
            structuredClone(baseline),
          ),
        );
        result = await operation("result.validate", () =>
          validateResult(response, evidence),
        );
        if (
          result.category !== "unknown" &&
          (result.category !== baseline.category ||
            !baseline.signals.some(
              (s) =>
                s.category === result.category &&
                s.evidenceIds.some((id) => result.evidenceIds.includes(id)),
            ))
        )
          throw new Error(
            "AI category exceeds the deterministic evidence envelope",
          );
        // Model-authored text also passes through redaction. Signals remain observations from code.
        result = validateResult(
          {
            ...result,
            hypothesis: redactText(result.hypothesis),
            nextSteps: result.nextSteps.map(redactText),
            missingEvidence: result.missingEvidence.map(redactText),
            signals: baseline.signals,
          },
          evidence,
        );
        engine = provider.name;
      } catch {
        result = baseline;
        warnings.push(
          "AI analysis unavailable or invalid; deterministic diagnosis retained.",
        );
      }
    }
    return {
      evidence,
      result,
      engine,
      warnings,
      fingerprint: createHash("sha256")
        .update(JSON.stringify(evidence))
        .digest("hex"),
    };
  });
}
