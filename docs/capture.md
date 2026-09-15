# Capture contract v1

The optional collector watches a single Playwright `Page` from creation of the collector until `finish(testInfo)`. Start it before the interaction and finish inside `finally`, before page teardown. Use `test.step` for meaningful user steps; the JSON reporter does not serialize every internal Playwright API call as a user step.

The inline attachment name is `faillens-evidence-v1`, content type `application/json`, and body is UTF-8 JSON that the reporter base64-encodes. Its fields are `version: 1`, `networkComplete`, `requestsObserved`, `consoleErrors`, and `networkFailures`. The parser validates this schema and ignores invalid/oversized captures with a limitation. It never follows attachment paths, including path-only JSON attachments made by other helpers.

The collector uses `testInfo.attachments.push` with a Buffer to preserve an inline body in JSON. `testInfo.attach()` may materialize a file; FailLens intentionally does not open that path. The browser integration test verifies the chosen inline mechanism against the locked version.

Requests include all page request events during the capture interval, not only failed requests. Network failure records contain method, redacted URL, HTTP status or failure text. Console errors contain type and redacted text. Headers and bodies are never captured. A page closing early or more than 40 network failures marks capture incomplete. Console entries are capped at 40.

`networkComplete` describes this interval and this page only. It does not cover earlier navigation, popup pages, separate contexts, or worker traffic outside these page events. A zero-request locator signal additionally requires a prior passed step and a locator timeout. It suggests inspecting the test; it does not prove the UI is correct.

Screenshots and traces can still be produced by Playwright for local human investigation. Neither is decoded or uploaded by FailLens. Raw Playwright reports and local artifacts may themselves contain sensitive data; FailLens cannot sanitize files produced independently by Playwright.
