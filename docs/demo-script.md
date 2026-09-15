# 30-second demo recording

Use synthetic fixtures only. Start in the repository after `npm ci` and `npm run build`. Keep terminal width around 100 columns and clear old output. Do not show API keys or raw customer artifacts.

| Time    | Screen                                                                                  | Point                                      |
| ------- | --------------------------------------------------------------------------------------- | ------------------------------------------ |
| 0–5 s   | A failing order assertion from the real demo                                            | Playwright reports the symptom             |
| 5–10 s  | `node dist/cli.js analyze fixtures/product-bug/backend-500/input.json`                  | One local command                          |
| 10–22 s | Hold the category, uncalibrated confidence, `network-1` HTTP 500 and next investigation | Evidence leads to an actionable hypothesis |
| 22–30 s | Show sanitized CI Markdown or the architecture diagram                                  | Same result fits engineering workflow      |

After publication the recorded command can become `npx faillens analyze artifacts/results.json`, using the confirmed package name. Do not imply the deterministic output is a live AI run. An optional separate AI clip should show the provider label and fallback honestly.

`docs/assets/demo.gif` is a 30-second rendered walkthrough built from real deterministic CLI output. It is labelled as rendered output, not a recording of an interactive terminal or a live AI call. Maintainers can regenerate it with Python and Pillow using `python scripts/render-demo.py` after `npm run build`. Python is not needed to install, test or run FailLens.

For a future live recording, use a terminal recorder, trim pauses, and replace this asset. Do not describe the current rendered walkthrough as a screen recording.
