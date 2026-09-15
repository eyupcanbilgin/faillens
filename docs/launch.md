# GitHub launch checklist

The local implementation does not publish to GitHub or npm.

1. Choose the GitHub owner/repository and verify availability/ownership of `faillens` on npm. Use a scope if necessary; update package name and documented install commands consistently.
2. Set `repository`, `bugs`, and `homepage` package metadata to the real repository URLs. Do not publish invented links. Confirm contributor copyright attribution and MIT choice.
3. Configure a private maintainer conduct contact and enable GitHub private vulnerability reporting. Update the security and conduct policies with actual contact details.
4. Push the source and lockfile. Run the included Linux/Windows CI, inspect the artifacts, and enable branch protection.
5. Run `npm run test:ai:live` with an explicitly supplied provider key if advertising live OpenAI compatibility. Verify model availability for your account. The implementation session performs no paid calls.
6. Record the GIF using `docs/demo-script.md`; link it from README after recording. Remove the recording-pending notice only when the asset exists.
7. Run `npm ci`, format check, typecheck, lint, coverage, evaluation, build, package smoke, and the real browser demo from a fresh checkout. Inspect the npm tarball contents.
8. Review documentation and package for secrets/internal data; review lockfile dependency alerts. Set npm 2FA/trusted publishing and choose release provenance policy.
9. Tag `v0.1.0`, use `docs/release-v0.1.0.md`, and publish only after maintainer approval.

Suggested description: **Evidence-first failure triage for Playwright with deterministic diagnostics, optional bounded AI, and CI integration.**

Suggested topics: `playwright`, `testing`, `test-automation`, `qa`, `quality-engineering`, `ai`, `ai-agent`, `github-actions`, `opentelemetry`, `flaky-tests`, `typescript`.
