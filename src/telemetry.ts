import { trace, SpanStatusCode } from "@opentelemetry/api";
export async function operation<T>(
  name: string,
  fn: () => T | Promise<T>,
): Promise<T> {
  return trace
    .getTracer("faillens", "0.1.0")
    .startActiveSpan(name, async (span) => {
      try {
        return await fn();
      } catch {
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw new Error(`Operation failed: ${name}`);
      } finally {
        span.end();
      }
    });
}
export async function startTelemetry(
  enabled: boolean,
): Promise<() => Promise<void>> {
  if (!enabled) return async () => {};
  const [{ NodeSDK }, { OTLPTraceExporter }] = await Promise.all([
    import("@opentelemetry/sdk-node"),
    import("@opentelemetry/exporter-trace-otlp-http"),
  ]);
  const sdk = new NodeSDK({
    autoDetectResources: false,
    logRecordProcessors: [],
    traceExporter: new OTLPTraceExporter(),
    instrumentations: [],
  });
  sdk.start();
  return () => sdk.shutdown();
}
