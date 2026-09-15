import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { Categories } from "../src/core/evidence.js";
import { SignalSchema } from "../src/core/result.js";
const Expected = z.object({
  allowedCategories: z.array(z.enum(Categories)),
  requiredEvidenceIds: z.array(z.string()),
  normalizedEvidence: z.unknown(),
  signals: z.array(SignalSchema),
});
export async function loadCorpus(
  root = "fixtures",
): Promise<
  { name: string; input: string; expected: z.infer<typeof Expected> }[]
> {
  const cases = [];
  for (const group of await readdir(root, { withFileTypes: true })) {
    if (!group.isDirectory()) continue;
    for (const dir of await readdir(join(root, group.name), {
      withFileTypes: true,
    })) {
      if (!dir.isDirectory()) continue;
      const name = `${group.name}/${dir.name}`,
        path = join(root, name);
      cases.push({
        name,
        input: await readFile(join(path, "input.json"), "utf8"),
        expected: Expected.parse(
          JSON.parse(await readFile(join(path, "expected.json"), "utf8")),
        ),
      });
    }
  }
  return cases;
}
