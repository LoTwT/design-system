# Release

This repository follows the canonical npm release runbook:

- [`LoTwT/ai/docs/npm-release-from-zero-to-shipped.md`](https://github.com/LoTwT/ai/blob/main/docs/npm-release-from-zero-to-shipped.md)

Repo-specific implementation lives in:

- `.github/workflows/release.yml` — tag-triggered OIDC publish for `@ayingott/theme`
- `bump.config.ts` — version bump, release commit, tag push, and changelog hook
- `cliff.toml` — CHANGELOG and GitHub Release note generation

Repo-specific notes:

- `@ayingott/theme` is the only publishable package today, so CI runs
  `npm publish` on the checksummed tarball produced by the unprivileged
  validation job rather than `pnpm -r publish` from a privileged checkout.
- The root package is private but keeps the same version as
  `packages/theme/package.json` so tags, docs, and package metadata stay
  aligned.
- Stable tags publish to npm dist-tag `latest`. Prerelease tags publish to
  `next`, create a GitHub prerelease, and never become the latest release.
- The `npm-publish` environment, Trusted Publisher binding, and `v*.*.*`
  tag-protection ruleset are repository settings, not source files.

Current V0.0.x controls, package/showcase boundaries, accepted residuals, and
Phase 5 rehearsal requirements are canonical in
[`DS-D-10-v0-auto-publish.md`](DS-D-10-v0-auto-publish.md).
