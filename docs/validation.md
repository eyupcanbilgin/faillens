# Implementation validation

Verified locally on Windows with Node.js 20.19.0. These are observed results, not predictions about every platform or provider.

| Check                                 | Observed result                                                                                                            |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Fresh `npm ci`                        | Passed; 232 packages installed, audit reported 0 vulnerabilities                                                           |
| `npm run format:check`                | Passed                                                                                                                     |
| `npm run typecheck`                   | Passed, strict TypeScript                                                                                                  |
| `npm run lint`                        | Passed                                                                                                                     |
| `npm test`                            | 64 tests passed in 7 files                                                                                                 |
| `npm run test:coverage`               | Passed configured thresholds                                                                                               |
| Selected core coverage                | 97.14% lines, 96.73% statements, 95.45% branches, 97.82% functions                                                         |
| `npm run build`                       | Passed                                                                                                                     |
| `npm run eval`                        | 14/14 category matches, 14/14 schema/reference validity, 7/7 required unknown                                              |
| Privacy and prompt-injection fixtures | Passed local regression checks                                                                                             |
| `npm run demo`                        | Useful deterministic output without a model call                                                                           |
| `npm run demo:playwright`             | All five category expectations verified against real Chromium JSON output                                                  |
| `npm run test:package`                | Tarball built, installed into a fresh consumer directory, CLI analysis and npm binary resolution passed without an API key |
| Workflow YAML                         | Parsed successfully; read-only permissions and empty model-key environment checked                                         |
| Source inspection                     | No user-machine paths, internal/company identifiers or unfinished core TODOs found in distributable source                 |

Coverage is scoped to parser, privacy and core modules, not the entire repository. The schema/reference validator and redaction module each had all statements covered; coverage does not establish absence of security defects. The fixture corpus is synthetic and curated, not an independent real-world benchmark. Fake provider tests verify schema, reference, category-envelope, fallback, redaction and capability boundaries; they do not prove semantic correctness of live model prose.

The real demo intentionally produces four failed tests and one retry-recovered test. Its harness independently checks that five analyses match their expected categories, and exits successfully only then. This behavior is specific to the demo; consumer CI preserves the original Playwright failure.

## Release preparation follow-up

The project has been pushed to [eyupcanbilgin/faillens](https://github.com/eyupcanbilgin/faillens) as a private release candidate. Hosted verification is tracked in the [CI runs](https://github.com/eyupcanbilgin/faillens/actions/workflows/ci.yml). Reporting contacts are configured, and the README includes a rendered demo GIF based on actual CLI output.

## Not executed

- Live OpenAI requests: no API key provisioned or used; no paid model calls made. SDK types and request construction were checked, including a mocked structured-output request.
- Public npm/GitHub publication and npm package-name reservation. Registry lookup returned no existing `faillens` package; this is not a reservation.
- Live terminal video recording. The supplied GIF is transparently labelled as a rendered CLI walkthrough.

See [launch checklist](launch.md) for those final publishing steps and [release notes](release-v0.1.0.md) for the prepared v0.1.0 announcement.
