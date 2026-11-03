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

Release gates:

1. Start from clean `main` that matches live `origin/main`, with matching
   package versions.
2. Verify that the target npm version and remote release tag do not exist.
3. Run `pnpm check`, `pnpm site:typecheck`, `pnpm site:build`, and
   `CHROME_PATH=<chrome-binary> pnpm site:browser`.
4. Optionally rehearse `pnpm release:bump X.Y.Z --yes --no-push` in an
   isolated checkout and inspect the generated changelog and site copy.
5. Run `pnpm release:bump X.Y.Z` from clean `main`. It atomically pushes only
   the release commit and its exact tag. Do not rerun a completed bump after a
   push rejection.
6. Declare the release complete only after validation, npm publication,
   GitHub Release creation, and registry install smoke succeed, then read back
   the npm version and dist-tag.

Accepted residuals: `main` has no branch ruleset enforcing CI, `npm-publish`
is not a protected approval gate, and repository administrators retain
bypass. The `v*.*.*` tag ruleset is the pre-publish control.
