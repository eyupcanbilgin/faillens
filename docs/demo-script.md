# 30-second demo recording

Use synthetic fixtures only. Start in the repository after `npm ci` and `npm run build`. Keep terminal width around 100 columns and clear old output. Do not show API keys or raw customer artifacts.

| Time    | Screen                                                                                  | Point                                      |
| ------- | --------------------------------------------------------------------------------------- | ------------------------------------------ |
| 0–5 s   | A failing order assertion from the real demo                                            | Playwright reports the symptom             |
| 5–10 s  | `node dist/cli.js analyze fixtures/product-bug/backend-500/input.json`                  | One local command                          |
| 10–22 s | Hold the category, uncalibrated confidence, `network-1` HTTP 500 and next investigation | Evidence leads to an actionable hypothesis |
| 22–30 s | Show sanitized CI Markdown or the architecture diagram                                  | Same result fits engineering workflow      |

After publication the recorded command can become `npx faillens analyze artifacts/results.json`, using the confirmed package name. Do not imply the deterministic output is a live AI run. An optional separate AI clip should show the provider label and fallback honestly.

Record with a terminal recorder of your choice, trim pauses, export a GIF, and place it under `docs/assets/demo.gif`. The asset is deliberately pending; no synthetic claim of a completed recording is made.
