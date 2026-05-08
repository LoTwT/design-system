# DS-D-09 Release Workflow

## Scope

DS-D-09 defines the release flow for the `LoTwT/design-system` repository and publishable workspace packages.

The repository uses a single release version across all `package.json` files. The root package is private but carries the same `version` as `packages/theme/package.json` so repository tags, docs, and package metadata stay aligned.

## Version Bump

Use the root release script:

```bash
pnpm release:bump        # patch bump
pnpm release:bump 0.0.1  # explicit version
```

The script is a thin wrapper around `bumpp@11.1.0`:

- no argument defaults to `patch`
- one argument is passed as the release type or exact version
- version files: `package.json` and `packages/theme/package.json`
- commit and tag use the built-in bumpp format: `chore: release vX.Y.Z` and `vX.Y.Z`
- the script must run from `main` with an upstream branch so bumpp can push safely
- `noGitCheck: false` enables bumpp's working-tree check
- push is enabled so the tag triggers release CI

## Release Gate

The release workflow is triggered only by `vX.Y.Z` tag pushes. The release job validates:

- tag format is semver with a leading `v`
- root `package.json` version equals the tag version
- release commit subject equals `chore: release vX.Y.Z`
- tagged commit is contained in `origin/main`
- npm CLI satisfies `>= 11.5.1`
- each publish allowlist package exists, is not `private`, and has a version matching the tag
- if any allowlist package already exists on npm for `X.Y.Z`, its `gitHead` equals the release commit SHA

The job then runs:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm site:build
pnpm --filter @ayingott/theme pack:dry
```

## Publish Allowlist

All packages in the repository share one release version, but publish targets are explicit. The release workflow uses a `PUBLISH_PACKAGES` JSON allowlist. The initial allowlist is:

```json
["packages/theme"]
```

Do not use `pnpm -r publish`. When a future public package is ready to ship, add its package directory to `PUBLISH_PACKAGES` and add package-specific pack/smoke gates in the same PR.

## npm Publish

Publish is performed per allowlist package by GitHub Actions using npm Trusted Publishing / OIDC:

```bash
cd <package-directory>
npm publish --access public --no-git-checks
```

The release job must have `id-token: write` permission and run in the protected `npm-publish` environment. The npm Trusted Publisher should point at:

- package: each package in `PUBLISH_PACKAGES`
- repository: `LoTwT/design-system`
- workflow: `release.yml`
- environment: `npm-publish`

npm Trusted Publishing requires npm CLI 11.5.1 or later and Node 22.14.0 or later. The release workflow uses Node 24 and the official `npm publish` path so npm can detect the OIDC environment. npm Trusted Publishing automatically generates provenance for public packages published from public repositories; no `--provenance` flag is required.

The publish step is retry-safe. If a previous run already published an allowlist package at `X.Y.Z`, the workflow verifies the published package `gitHead` matches the current release commit, skips only that package publish, then still runs registry install smoke and creates or updates the GitHub Release. If the existing npm version points at any other commit, the workflow fails hard.

If npm requires the package to exist before Trusted Publishing can be configured, the first `0.0.1` publish may use a one-time fine-grained token in the protected environment. Revoke that token after the package exists and migrate the package to Trusted Publishing.

## Post-Publish Smoke

After publish, CI creates a temporary package, installs `@ayingott/theme@X.Y.Z`, `tailwindcss@4.2.4`, and `@tailwindcss/cli@4.2.4`, builds a CSS file that imports:

```css
@import "tailwindcss";
@import "@ayingott/theme/fonts.css";
@import "@ayingott/theme";
```

The smoke checks generated CSS for semantic variables, Tailwind token utilities, `@font-face`, font asset references, focus-ring utilities, and touch-target utilities.

## Rollback

- If a tag or GitHub Release is wrong before npm publish, delete the GitHub Release and tag, fix the release commit, and create a new tag.
- If a version has been published to npm, do not rely on unpublish. Deprecate the bad version and publish the next patch.
- If CI fails before publish, fix the release commit and re-tag only after removing the failed tag.

## References

- npm Trusted Publishing: <https://docs.npmjs.com/trusted-publishers/>
- npm provenance statements: <https://docs.npmjs.com/generating-provenance-statements/>
