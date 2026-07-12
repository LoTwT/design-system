# DS-D-09 Release Workflow

## Scope

DS-D-09 defines the release flow for the `LoTwT/design-system`
repository and the `@ayingott/theme` npm package.

The repository uses a single release version across all `package.json`
files. The root package is private but carries the same `version` as
`packages/theme/package.json` so repository tags, docs, and package
metadata stay aligned.

The canonical cross-repo runbook lives in
[`LoTwT/ai/docs/npm-release-from-zero-to-shipped.md`](https://github.com/LoTwT/ai/blob/main/docs/npm-release-from-zero-to-shipped.md).
This file records only the design-system-specific implementation.

## Version Bump

Use the root release script:

```bash
pnpm release:bump        # patch bump
pnpm release:bump 0.0.3  # explicit version
pnpm release:bump minor  # semver release class
```

The script runs `bumpp@11.1.0` with `bump.config.ts`:

- version files: `package.json` and `packages/theme/package.json`
- commit and tag use the built-in bumpp format: `chore: release vX.Y.Z` and `vX.Y.Z`
- `noGitCheck: false` keeps bumpp's working-tree check enabled
- the `execute` function runs `pnpm changelog` before the release commit
  and adds `CHANGELOG.md` to the commit file set without making it a
  version-bump target
- push is enabled so the tag triggers release CI

## Changelog and Release Notes

`pnpm changelog` uses `git-cliff` to prepend the next generated entry to
`CHANGELOG.md`. Existing hand-written entries are preserved below the
new generated entries.

`CHANGELOG.md` is not listed in bumpp `files`: bumpp treats non-manifest
files as text replacement targets and would rewrite older changelog
headers that contain the previous version. The `bump.config.ts`
`execute` function runs the changelog command and then explicitly adds
`CHANGELOG.md` to the release commit file set.

The unprivileged validation job generates GitHub Release notes from the tag with:

```bash
pnpm exec git-cliff --latest --strip header --output release-artifact/release-notes.md
```

The validation job packages the theme into a tarball, stores the tarball
and release notes in a one-day workflow artifact, and records their SHA-256
digests. The publish and GitHub Release jobs independently verify those
digests before using the files.

After npm publish succeeds, a separate least-privilege job runs
`softprops/action-gh-release` with only `contents: write`. Registry install
smoke runs after GitHub Release creation, so npm CDN propagation lag cannot
prevent release notes from being published after a successful package publish.

## Release Gate

The release workflow is triggered only by semver tag pushes. The
unprivileged validation job validates:

- tag format is semver with a leading `v`
- root `package.json` version equals the tag version
- `packages/theme/package.json` version equals the tag version
- release commit subject equals `chore: release vX.Y.Z`
- tagged commit is contained in `origin/main`
- npm CLI satisfies `>= 11.5.1`
- `@ayingott/theme@X.Y.Z` does not already exist on npm

The job then runs:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm site:typecheck
pnpm site:build
```

It also creates the actual tarball used by the publish job. All third-party
actions in the workflow are pinned to full commit SHAs, and checkout disables
credential persistence.

The jobs are separated by trust boundary:

- `validate`: `contents: read`; installs dependencies, runs repository code,
  creates the package tarball and release notes, then uploads checksums.
- `publish`: `actions: read` and `id-token: write`; downloads the validated
  artifact and publishes it without repository contents permission, checkout,
  or execution of repository build scripts.
- `github-release`: `actions: read` and `contents: write`; downloads the
  validated release notes and creates the GitHub Release after publish succeeds.
- `registry-smoke`: no repository permissions; verifies the published package
  from a new temporary consumer after the GitHub Release exists.

## npm Publish

Publish is performed from the validated tarball by GitHub Actions using npm
Trusted Publishing / OIDC:

```bash
npm publish release-artifact/ayingott-theme-X.Y.Z.tgz --access public --tag latest --ignore-scripts
```

For a prerelease tag such as `v1.0.0-rc.1`, the workflow uses npm dist-tag
`next`, marks the GitHub Release as a prerelease, and sets `make_latest: false`.
Stable versions use npm dist-tag `latest` and may set `make_latest: true`.

Only the publish job has `id-token: write`; it runs in the protected
`npm-publish` environment. The npm Trusted Publisher should
point at:

- package: `@ayingott/theme`
- repository: `LoTwT/design-system`
- workflow: `release.yml`
- environment: `npm-publish`

npm Trusted Publishing requires npm CLI 11.5.1 or later and Node
22.14.0 or later. The release workflow uses Node 24.

Trusted Publishing automatically generates provenance attestations
server-side, so the workflow does not pass the client-side
`--provenance` flag.

Publishing the tarball does not rely on npm `gitHead` metadata, so the workflow
uses version absence and artifact SHA-256 verification as its retry and
handoff checks. If a version has already reached npm, fix forward with the next
patch instead of rerunning the same publish.

## Post-Publish Smoke

After publish and GitHub Release creation, CI creates a temporary
package, installs `@ayingott/theme@X.Y.Z`, `tailwindcss@4.2.4`, and
`@tailwindcss/cli@4.2.4`, then builds a CSS file that imports:

```css
@import "tailwindcss";
@import "@ayingott/theme/fonts.css";
@import "@ayingott/theme";
```

The smoke waits for npm registry propagation with a bounded retry
budget (`20` attempts with `60s` delay). Each attempt first checks
version visibility with `npm view`; after the package version is
visible, it runs a fresh install to catch tarball or dependency
propagation lag separately.

The smoke checks generated CSS for semantic variables, reading tokens
(`--reading-link`, `--reading-measure`), Tailwind token utilities
(`font-reading` included), `@font-face`, Space Grotesk and Newsreader
font asset references, focus-ring utilities, and touch-target
utilities.

## Rollback

- If a tag or GitHub Release is wrong before npm publish, delete the
  GitHub Release and tag, fix the release commit, and create a new tag.
- If a version has been published to npm, do not rely on unpublish.
  Deprecate the bad version and publish the next patch.
- If CI fails before publish, fix the release commit and re-tag only
  after removing the failed tag.
- If publish partially succeeds, inspect npm registry state first; do
  not retry blindly against a version that already exists.

## References

- Canonical runbook: <https://github.com/LoTwT/ai/blob/main/docs/npm-release-from-zero-to-shipped.md>
- npm Trusted Publishing: <https://docs.npmjs.com/trusted-publishers/>
- npm provenance statements: <https://docs.npmjs.com/generating-provenance-statements/>
