# GitHub launch checklist

Repository: [eyupcanbilgin/faillens](https://github.com/eyupcanbilgin/faillens). The release candidate is staged privately. npm publication is not yet performed.

## Prepared

- GitHub repository created; source and lockfile pushed to `main`.
- Real repository, issue and homepage metadata configured; MIT license retained.
- Maintainer-approved reporting email configured in SECURITY.md and CODE_OF_CONDUCT.md.
- CI matrix for Linux and Windows, dependency update checks and issue templates configured.
- A 30-second rendered walkthrough is included in README; see `docs/demo-script.md` for its provenance and regeneration.
- Version 0.1.0 release notes, package smoke test, and source/package artifacts prepared.
- npm registry lookup on 2026-09-16 returned HTTP 404 for `faillens`. This does not reserve the name; recheck when publishing.

## Final release gates

1. Verify the latest `main` commit has passing Linux and Windows CI checks and inspect its artifacts.
2. Confirm public GitHub visibility and release publication. Enable GitHub private vulnerability reporting when public; the approved reporting email already works as the documented fallback. Configure required CI checks where the account plan permits branch protection.
3. Sign into the intended npm account with `npm login`, confirm ownership/name availability, and publish the reviewed tarball only with maintainer authorization. No npm credentials are stored in this repository. Use account 2FA and, for subsequent automation, configure a [trusted publisher](https://docs.npmjs.com/trusted-publishers/).
4. Live OpenAI smoke testing is **explicitly deferred by the maintainer** for this release candidate. Do not advertise live-verified provider compatibility; run `npm run test:ai:live` with an explicitly supplied key before making that claim.

Release source and npm package can be reviewed independently. A GitHub release does not mean the npm package is published.

Suggested description: **Evidence-first failure triage for Playwright with deterministic diagnostics, optional bounded AI, and CI integration.**

Suggested topics: `playwright`, `testing`, `test-automation`, `qa`, `quality-engineering`, `ai`, `ai-agent`, `github-actions`, `opentelemetry`, `flaky-tests`, `typescript`.
