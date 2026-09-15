# Contributing

Use Node.js 20.19 or newer. Install with `npm ci`. Before proposing a change:

```sh
npm run format
npm run check
npm run test:coverage
npm run eval
npm run test:package
npm exec playwright install chromium
npm run demo:playwright
```

Default tests must make **zero external model calls**. Use injected fake providers or an SDK method spy. Fetch is blocked by the default test setup. `test:ai:live` is an explicit opt-in command and is never part of PR CI.

## Architecture rules

- `core/` must never import a vendor provider or Playwright types.
- `adapters/playwright/` owns framework-specific report interpretation.
- `providers/` owns vendor SDK imports. No shell, file, browser or write capabilities.
- Redaction happens before any external provider sees evidence.
- New failure behavior should have a synthetic fixture with normalized evidence, deterministic signals, allowed categories and required IDs.
- Expected fixture data must be reviewed independently; do not blindly bless implementation output.
- No customer, company, production or real credential data in fixtures or issues.
- Assert category and evidence invariants, not exact model prose.
- Preserve unknown when information is insufficient; do not inflate confidence to improve a demo.
- Keep the npm package small. Do not add roadmap infrastructure to v0.1.

The 14 fixtures are intentionally transparent and small. Cases under `product-bug/frontend-console-error` and `test-bug/stale-assertion` describe the scenario family but correctly expect unknown because the supplied evidence does not establish that category.

## Pull requests

Explain the observed failure, the behavior change, its supporting fixture, validation performed and limitations. Run the real browser demo for collector/parser changes. Public issue reports must use synthetic/redacted content. See the security policy for sensitive reports.
