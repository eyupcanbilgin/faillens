# OpenTelemetry

Off by default. To send OTLP/HTTP traces to a local collector in a POSIX shell:

```sh
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
node dist/cli.js analyze artifacts/results.json --telemetry
```

PowerShell uses `$env:OTEL_EXPORTER_OTLP_ENDPOINT = 'http://localhost:4318'`. The standard trace-specific endpoint and exporter headers are also supported by the OTLP exporter. Configure only trusted collectors and keep header credentials out of reports and source control.

Spans: `faillens.analyze`, `evidence.redact`, `signals.detect`, `agent.triage`, `result.validate`. The SDK is initialized only on explicit CLI opt-in, then flushed at shutdown. Library users may initialize their own SDK. No console exporter is enabled, so JSON stdout remains machine-readable. Provider errors set a span error status without recording the error object or message.

No prompt, evidence, raw response, test title, filesystem path, or exception message is written to spans. The in-memory exporter regression test inspects exported attributes, events, and status. Resource auto-detection and HTTP auto-instrumentation are disabled to avoid unrelated host and request data.
