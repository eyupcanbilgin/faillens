# Consumer GitHub Actions integration

Install your selected FailLens tarball or published version as a locked dev dependency first. The example assumes a configured Playwright JSON reporter writing `artifacts/results.json`. It does not assume that the proposed npm package name is already available.

```yaml
name: Playwright with triage
on: [push, pull_request]
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - name: Run Playwright
        run: npx playwright test
      - name: Explain failures
        if: always() && hashFiles('artifacts/results.json') != ''
        run: npx --no-install faillens analyze artifacts/results.json --ai off --format markdown --output artifacts/triage.md
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: sanitized-triage
          path: artifacts/triage.md
          if-no-files-found: ignore
          retention-days: 7
```

The Playwright step has no `continue-on-error` and no `|| true`. Its failure remains the job outcome even if FailLens exits zero. `if: always()` allows triage and upload after failure. If report generation fails entirely, the triage step is skipped and the original failure remains visible.

This workflow needs no API key or GitHub write permission. Raw reports, traces and screenshots are not uploaded by this example. If you add them, assess their sensitivity separately. Do not use `pull_request_target` to execute untrusted fork tests with secrets.

PR comments are intentionally omitted. If added later, keep that permission and publishing operation in a separate reviewed step; FailLens itself only writes a sanitized report.
