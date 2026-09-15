import { evidenceMap } from "./core/evidence.js";
import type { Analysis } from "./core/analyzer.js";
export type Format = "console" | "json" | "markdown";
const safe = (v: string) =>
  v
    .replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!)
    .replace(/([\\`*_{}\[\]()#+.!|~-])/g, "\\$1")
    .replace(/\r?\n/g, " ");
export function render(analyses: Analysis[], format: Format): string {
  if (format === "json")
    return JSON.stringify({ version: 1, analyses }, null, 2) + "\n";
  if (!analyses.length)
    return "No failed Playwright tests found. Analysis completed successfully.\n";
  return (
    analyses
      .map((a) => {
        const md = format === "markdown";
        const t = md ? safe : (v: string) => v;
        const map = evidenceMap(a.evidence);
        const observations = a.result.evidenceIds.map(
          (id) => `- [${t(id)}] ${t(map.get(id)!)}`,
        );
        return [
          (md ? "# " : "") + "FailLens — Playwright Failure Triage",
          "",
          `Test: ${t(a.evidence.title)}`,
          `Classification: ${a.result.category.toUpperCase()}`,
          `Diagnostic confidence: ${a.result.confidence.toFixed(2)} (uncalibrated)`,
          "",
          `${md ? "## " : ""}Observations`,
          ...(observations.length
            ? observations
            : ["- No discriminating evidence available."]),
          "",
          `${md ? "## " : ""}Hypothesis`,
          t(a.result.hypothesis),
          "",
          `${md ? "## " : ""}Suggested next investigation`,
          ...a.result.nextSteps.map((s) => `- ${t(s)}`),
          "",
          `${md ? "## " : ""}Missing evidence`,
          ...a.result.missingEvidence.map((s) => `- ${t(s)}`),
          "",
          `Engine: ${t(a.engine)}`,
          ...a.warnings.map((w) => `Warning: ${t(w)}`),
        ].join("\n");
      })
      .join("\n\n---\n\n") + "\n"
  );
}
