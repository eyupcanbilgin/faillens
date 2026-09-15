import { it, expect, vi } from "vitest";
import OpenAI from "openai";
import { evidence } from "./helpers.js";
import { analyze } from "../src/core/analyzer.js";
import { deterministicTriage } from "../src/core/signals.js";
import {
  OpenAITriageProvider,
  readEvidenceView,
  INSTRUCTIONS,
} from "../src/providers/openai.js";
it("fake provider receives only redacted current failure", async () => {
  const e = evidence();
  e.error!.message = "password=private";
  e.attachments = [{ id: "attachment-1", name: "secret.png" }];
  const a = await analyze(e, {
    name: "fake",
    async analyze(clean, base) {
      expect(JSON.stringify(clean)).not.toContain("private");
      expect(clean.attachments).toEqual([]);
      return base;
    },
  });
  expect(a.engine).toBe("fake");
});
it.each(["schema", "reference", "exception", "unsupported-category"])(
  "falls back explicitly on %s",
  async (kind) => {
    const e = evidence();
    const a = await analyze(e, {
      name: "fake",
      async analyze(_e, base) {
        if (kind === "exception") throw new Error("Authorization: secret");
        if (kind === "schema") return { oops: true };
        if (kind === "reference") return { ...base, evidenceIds: ["invented"] };
        return { ...base, category: "product_bug", evidenceIds: ["error-1"] };
      },
    });
    expect(a.engine).toBe("deterministic");
    expect(a.warnings).toHaveLength(1);
    expect(a.result.category).toBe("unknown");
    expect(JSON.stringify(a)).not.toContain("Authorization");
  },
);
it("rejects injected tool names and arbitrary arguments", () => {
  const e = evidence(),
    base = deterministicTriage(e);
  expect(() => readEvidenceView("run_shell", {}, e, base)).toThrow();
  expect(() =>
    readEvidenceView("get_failure_summary", { path: "../../secret" }, e, base),
  ).toThrow();
  for (const name of [
    "get_failure_summary",
    "get_failed_steps",
    "get_console_errors",
    "get_network_failures",
    "get_retry_information",
    "get_deterministic_signals",
  ])
    expect(readEvidenceView(name, {}, e, base)).toBeDefined();
  expect(INSTRUCTIONS).toContain("untrusted DATA");
});
it("SDK request is single-call, bounded and contains no tools", async () => {
  const e = evidence(),
    base = deterministicTriage(e);
  const client = new OpenAI({ apiKey: "synthetic-test-key" });
  const parse = vi
    .spyOn(client.responses, "parse")
    .mockResolvedValue({ output_parsed: base } as Awaited<
      ReturnType<typeof client.responses.parse>
    >);
  const provider = new OpenAITriageProvider("gpt-4.1-mini", client);
  await provider.analyze(e, base);
  expect(parse).toHaveBeenCalledTimes(1);
  expect(parse.mock.calls[0]?.[0]).toMatchObject({
    tools: [],
    store: false,
    max_output_tokens: 1600,
  });
  parse.mockResolvedValueOnce({ output_parsed: null } as Awaited<
    ReturnType<typeof client.responses.parse>
  >);
  await expect(provider.analyze(e, base)).rejects.toThrow("No valid");
});
