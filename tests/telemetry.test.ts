import { it, expect } from "vitest";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { analyze } from "../src/core/analyzer.js";
import { evidence } from "./helpers.js";
it("exports bounded spans with no evidence contents or exception text", async () => {
  const exporter = new InMemorySpanExporter();
  const sdk = new NodeSDK({
    autoDetectResources: false,
    spanProcessors: [new SimpleSpanProcessor(exporter)],
    instrumentations: [],
  });
  sdk.start();
  try {
    const e = evidence();
    e.title = "SENSITIVE_TITLE";
    e.error!.message = "Authorization: SECRET";
    await analyze(e, {
      name: "fake",
      async analyze() {
        throw new Error("SENSITIVE_EXCEPTION");
      },
    });
    const spans = exporter.getFinishedSpans();
    expect(spans.map((s) => s.name)).toContain("faillens.analyze");
    expect(spans.map((s) => s.name)).toContain("agent.triage");
    const attributes = JSON.stringify(
      spans.map((s) => ({
        attributes: s.attributes,
        events: s.events,
        status: s.status,
      })),
    );
    for (const token of ["SENSITIVE", "SECRET", "Authorization"])
      expect(attributes).not.toContain(token);
  } finally {
    await sdk.shutdown();
  }
});
