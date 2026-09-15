import { it, expect } from "vitest";
import { loadCorpus } from "../scripts/corpus.js";
import { parseReport } from "../src/adapters/playwright/parser.js";
import { detectSignals } from "../src/core/signals.js";
import { analyze } from "../src/core/analyzer.js";
import { validateResult } from "../src/core/result.js";
for (const f of await loadCorpus()) {
  it(`fixture: ${f.name}`, async () => {
    const e = parseReport(f.input)[0]!;
    expect(e).toEqual(f.expected.normalizedEvidence);
    expect(detectSignals(e)).toEqual(f.expected.signals);
    const a = await analyze(e);
    expect(f.expected.allowedCategories).toContain(a.result.category);
    expect(() => validateResult(a.result, a.evidence)).not.toThrow();
    for (const id of f.expected.requiredEvidenceIds)
      expect(a.result.evidenceIds).toContain(id);
    if (f.name.startsWith("privacy/")) {
      expect(JSON.stringify(a)).not.toContain("SYNTHETIC_SECRET");
      expect(JSON.stringify(a)).not.toContain("SYNTHETIC_COOKIE");
      expect(JSON.stringify(a)).not.toContain("eyJhbGci");
    }
  });
}
