export { parseReport } from "./adapters/playwright/parser.js";
export { analyze } from "./core/analyzer.js";
export type { Analysis } from "./core/analyzer.js";
export type { FailureEvidence, FailureCategory } from "./core/evidence.js";
export { TriageResultSchema, validateResult } from "./core/result.js";
export type { TriageResult, DiagnosticSignal } from "./core/result.js";
export type { TriageProvider } from "./core/provider.js";
export { deterministicTriage, detectSignals } from "./core/signals.js";
export {
  redactText,
  redactUrl,
  redactHeaders,
  redactEvidence,
} from "./privacy/redact.js";
export { render } from "./renderers.js";
