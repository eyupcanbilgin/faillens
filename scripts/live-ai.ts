import { readFile } from "node:fs/promises";
import { parseReport } from "../src/adapters/playwright/parser.js";
import { analyze } from "../src/core/analyzer.js";
import { OpenAITriageProvider } from "../src/providers/openai.js";
if (!process.env.OPENAI_API_KEY)
  throw new Error(
    "Set OPENAI_API_KEY explicitly to opt in to a paid live smoke test.",
  );
const e = parseReport(
  await readFile("fixtures/product-bug/backend-500/input.json", "utf8"),
)[0]!;
const a = await analyze(
  e,
  new OpenAITriageProvider(process.env.FAILLENS_MODEL ?? "gpt-4.1-mini"),
);
if (a.engine !== "openai")
  throw new Error("Live AI smoke failed; deterministic fallback was used.");
console.log(
  JSON.stringify({
    provider: a.engine,
    category: a.result.category,
    validEvidenceIds: a.result.evidenceIds,
  }),
);
