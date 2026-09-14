# DS-D-15 V0.3.x Release Controls

Accepted on 2026-09-14 for the owner's requested `@ayingott/theme@0.3.0`
stable release.

## Scope

This decision supersedes the V0.2.x version-line boundary in DS-D-12 and
extends the existing release controls to V0.3.x. DS-D-14 remains authoritative
for the atomic, exact release push. Earlier release records are historical
and are not rewritten.

`@ayingott/theme` remains the only publishable package. The private root
package shares its version. The package remains framework-agnostic,
Tailwind CSS v4 CSS-first, with the same five public CSS export patterns.
Fonts and Neo-Brutalism remain consumer opt-ins; no components, adapters,
or additional packages are introduced.

V0.3.0 is a minor release because it adds opt-in LXGW WenKai Chinese fonts
with real Regular 400 and Medium 500 assets. The release also includes the
Neo-Brutal dark palette and shadow refinements, utility accessibility
composition fixes, and exact release-push repairs merged after V0.2.0.
The full WenKai assets add about 16.2 MiB to the installed package; browser
downloads still depend on the optional font import, matching characters,
and the weights used. The package includes the upstream copyright notices,
font checksums, and full OFL-1.1 text in `THIRD_PARTY_NOTICES.md`.

## Release Controls

- The active release-tag ruleset covers `refs/tags/v*.*.*` and restricts
  creation, update, deletion, and non-fast-forward changes to the repository
  administrator bypass path. Ordinary task branches use the agent account;
  the release commit and exact tag use the administrator release path.
- `main` has no branch ruleset enforcing CI. The `check` and `site` jobs must
  still pass, and final release evidence must refer to the exact commit.
- `npm-publish` is an OIDC environment binding with no required reviewers
  or deployment branch/tag policy. It is not a protected approval gate.
- The Trusted Publisher binding is `@ayingott/theme`, repository
  `LoTwT/design-system`, workflow `release.yml`, environment `npm-publish`.
  Recheck the binding before pushing the release tag whenever readback is
  available; record any unavailable npm-side readback in the release report.
- The unprivileged validation job builds and checksums the package tarball
  and generated release notes. The publish job consumes that artifact with
  only artifact-read and OIDC permissions. GitHub Release creation and
  registry install smoke remain separate jobs.

## Stable Release Gates

1. Merge the release-preparation PR, synchronize local `main` to live
   `origin/main`, and verify a clean worktree and matching package versions.
2. Verify that the exact npm version and remote release tag do not exist.
3. Run `pnpm check`, `pnpm site:typecheck`, `pnpm site:build`, and
   `CHROME_PATH=<chrome-binary> pnpm site:browser`. CI additionally pins and
   verifies Chrome for Testing 150.0.7871.124.
4. Rehearse `pnpm release:bump 0.3.0 --yes --no-push` in an isolated checkout.
   Inspect the generated changelog, released site copy, matching versions,
   single release commit and tag; run the same gates against the bumped
   candidate, including real-tarball consumer install and compile.
5. After those gates pass, use `pnpm release:bump 0.3.0` from clean `main`.
   It creates `chore: release v0.3.0` and `v0.3.0`, then atomically pushes
   only that commit to `origin/main` and its exact tag. Do not use bumpp's
   all-tags push or rerun a completed bump after a push rejection.
6. Declare the release complete only after validation, npm publication,
   GitHub Release creation, and registry install smoke succeed. Read back
   `@ayingott/theme@0.3.0`, npm `latest`, the release tag, and the published
   package contents and provenance.

Stable versions use npm `latest` and may become the latest GitHub Release.
Prereleases use `next`, are marked as prereleases, and do not become latest.
The VitePress showcase remains a separate deployment surface.

## Retained Boundaries

The unprotected `main` and `npm-publish` environment, administrator bypass,
VitePress 1.6.4 with the Vite 6.4.3 override, and enabled rebase merges remain
accepted residuals. Squash remains the preparation-PR merge convention.
The previous missing-full-OFL-text residual no longer describes the bundled
notices. This decision does not expand the package or publish trust boundary.
A V0.4.x or major release line, new public package/component surface, or
material trust-boundary change requires a new decision.
