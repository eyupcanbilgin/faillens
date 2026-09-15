# v0.1.0 — Evidence-first Playwright triage

FailLens turns structured Playwright failure evidence into a conservative diagnostic hypothesis with inspectable evidence references.

## Highlights

- Useful local diagnostics without a model or API key.
- Five categories, including explicit unknown for insufficient or conflicting evidence.
- Optional page-event collector, deterministic redaction, and bounded JSON parsing.
- Optional read-only OpenAI reasoning with schema and evidence validation; provider failure preserves the local diagnosis.
- Accessible terminal output, sanitized Markdown and versioned JSON.
- Synthetic fixture evaluation, secret-free CI, opt-in OTLP traces and a five-scenario Playwright demo.

## Try it

From the release source checkout:

```sh
git clone https://github.com/eyupcanbilgin/faillens.git
cd faillens
npm ci
npm run demo
```

The final package installation command must use the registry name confirmed at publication. This release draft does not claim a package has been published.

## Limits

Hypotheses are not verified root causes. Confidence is uncalibrated. The small synthetic corpus is not a real-world accuracy benchmark. No screenshot/trace uploads, historical flake analysis, autonomous fixes or MCP server are included. Redaction cannot guarantee detection of every secret. Live OpenAI smoke testing is deferred by the maintainer for this release candidate; provider request construction and fallback behavior are tested with fakes. No live provider compatibility claim is made.
