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

Release CI generates GitHub Release notes from the tag with:

```bash
npx --yes git-cliff@2.13.1 --latest --strip header --output /tmp/release-notes.md
```

`softprops/action-gh-release` then creates or updates the GitHub Release
using that file as `body_path`.

## Release Gate

The release workflow is triggered only by `vX.Y.Z` tag pushes. The
release job validates:

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
pnpm site:build
pnpm --filter @ayingott/theme pack:dry
```

## npm Publish

Publish is performed by GitHub Actions using npm Trusted Publishing /
OIDC:

```bash
cd packages/theme
pnpm publish --access public --no-git-checks
```

The release job must have `id-token: write` permission and run in the
protected `npm-publish` environment. The npm Trusted Publisher should
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

`pnpm publish` does not write npm `gitHead` metadata, so the workflow no
longer uses `gitHead` as a retry-safety check. The workflow checks npm
version absence before publishing; if a version has already reached npm,
fix forward with the next patch instead of rerunning the same publish.

## Post-Publish Smoke

After publish, CI creates a temporary package, installs
`@ayingott/theme@X.Y.Z`, `tailwindcss@4.2.4`, and
`@tailwindcss/cli@4.2.4`, then builds a CSS file that imports:

```css
@import "tailwindcss";
@import "@ayingott/theme/fonts.css";
@import "@ayingott/theme";
```

The smoke checks generated CSS for semantic variables, Tailwind token
utilities, `@font-face`, font asset references, focus-ring utilities,
and touch-target utilities.

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
