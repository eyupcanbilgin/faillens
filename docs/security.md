# Security and privacy threat model

## Trust boundaries

Reports, titles, error messages, stacks, console output, URLs, steps and attachment metadata are attacker-controlled. The report path is user-selected; everything inside the report is data. The external provider is a separate data processor. Generated prose is untrusted even when syntactically valid.

| Threat                                | Mitigation                                                                                                              | Residual limitation                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Prompt injection in logs/artifacts    | Explicit data-only instructions; zero executable tools; schema, ID and category-envelope validation                     | A model may still write misleading prose                                     |
| Secret or PII leakage                 | Explicit field selection; common-secret redaction; query values removed; no bodies, headers, screenshots or traces sent | Unknown encodings, custom secrets and route-segment PII may evade patterns   |
| Malicious URLs                        | Never fetched; credentials, fragments and query values removed; Markdown escaped                                        | Hostnames and paths remain evidence and may be sensitive                     |
| Untrusted/changed reports             | Runtime structure validation, length and nesting limits                                                                 | Only the supported JSON shape is handled                                     |
| Oversized input/cost abuse            | Bounded file read and parser, failure cap, capture caps, provider payload/output limits, no retry loop                  | Processing up to the selected cap still costs time and may incur API charges |
| Path traversal / arbitrary file reads | No reads of artifact paths; only explicit CLI input file and output destination are used                                | The invoking user controls input/output paths with their own OS permissions  |
| Output injection                      | Strip terminal controls and bidi controls; escape Markdown markup and links                                             | JSON consumers must still treat values as data                               |
| Provider data exposure                | Opt-in AI, minimal redacted payload, `store: false`, fixed official endpoint                                            | Provider policies still apply; this does not promise zero retention          |
| Telemetry leakage                     | Fixed span names, no exception text/evidence, no auto-instrumentation or resource detection                             | Users must protect exporter credentials and collector configuration          |
| CI secret exposure                    | Default CI makes zero LLM calls and has read-only repository permissions                                                | Raw Playwright artifacts may need access restrictions in consumer CI         |

## Redaction policy

Redact Authorization, Proxy-Authorization, Cookie, Set-Cookie, common API-key/Bearer/token/password/client-secret/session-id forms, JWT-looking strings, email addresses and local home paths. All URL query values are redacted by default, including unknown keys. URL userinfo and fragments are removed. Structured attachment metadata is removed from the analysis result and provider payload.

String redaction uses bounded regular expressions against already-size-limited evidence. This is a heuristic detector, not a data-loss-prevention guarantee. Review the redacted JSON locally before choosing external AI. Never add real credentials or customer data to fixtures. Test secrets in this repository are clearly synthetic.

## Bounded AI

One request per failure. No tool calls are accepted or dispatched, no browser or filesystem is exposed, and no code is executed. An unused read-only view helper rejects unknown view names and nonempty argument objects; it cannot open a path. Unsupported categories and nonexistent IDs are rejected locally. Fake provider tests verify mechanical controls, not claims of universal model resistance to prompt injection.

## Local artifacts

FailLens does not modify the source report. A separately produced Playwright trace or screenshot can contain secrets; keep it local or restrict artifact access. The consumer workflow uploads only the sanitized triage output by default. Do not run untrusted fork code with production secrets.

See [SECURITY.md](../SECURITY.md) for reporting guidance.
