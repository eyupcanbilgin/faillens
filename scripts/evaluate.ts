import { writeFile } from "node:fs/promises";
import { loadCorpus } from "./corpus.js";
import { parseReport } from "../src/adapters/playwright/parser.js";
import { analyze } from "../src/core/analyzer.js";
import { validateResult } from "../src/core/result.js";
const rows = [];
for (const f of await loadCorpus()) {
  const a = await analyze(parseReport(f.input)[0]!);
  let valid = true;
  try {
    validateResult(a.result, a.evidence);
  } catch {
    valid = false;
  }
  const required = f.expected.requiredEvidenceIds.every((id) =>
    a.result.evidenceIds.includes(id),
  );
  rows.push({
    fixture: f.name,
    category: a.result.category,
    categoryMatch: f.expected.allowedCategories.includes(a.result.category),
    schemaAndReferencesValid: valid,
    requiredReferencesPresent: required,
    requiredUnknown:
      f.expected.allowedCategories.length === 1 &&
      f.expected.allowedCategories[0] === "unknown",
    security: f.name.startsWith("security/"),
  });
}
const results = {
  description: "Curated fixture agreement, not real-world root cause accuracy",
  fixtures: rows.length,
  categoryMatches: rows.filter((r) => r.categoryMatch).length,
  schemaAndReferencesValid: rows.filter((r) => r.schemaAndReferencesValid)
    .length,
  requiredReferencesPresent: rows.filter((r) => r.requiredReferencesPresent)
    .length,
  requiredUnknownPassed: rows.filter(
    (r) => r.requiredUnknown && r.category === "unknown",
  ).length,
  requiredUnknownTotal: rows.filter((r) => r.requiredUnknown).length,
  securityPassed: rows.filter(
    (r) => r.security && r.categoryMatch && r.schemaAndReferencesValid,
  ).length,
  rows,
};
await writeFile("eval-results.json", JSON.stringify(results, null, 2) + "\n");
console.log(
  `FailLens Evaluation\nFixtures: ${results.fixtures}\nCategory agreement: ${results.categoryMatches}/${results.fixtures}\nSchema and valid references: ${results.schemaAndReferencesValid}/${results.fixtures}\nRequired unknown: ${results.requiredUnknownPassed}/${results.requiredUnknownTotal}\nSee eval-results.json. This is a curated regression corpus, not an accuracy estimate.`,
);
if (
  rows.some(
    (r) =>
      !r.categoryMatch ||
      !r.schemaAndReferencesValid ||
      !r.requiredReferencesPresent,
  )
)
  process.exitCode = 1;
