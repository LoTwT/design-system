# Agent Guide

This repository is the source for the Ayingott design system.

## Start Here

- V0 scope is `@ayingott/theme` only.
- Use Tailwind CSS v4 CSS-first features.
- Keep the package framework-agnostic.
- Do not add component primitives, Vue packages, adapters, playgrounds, or fixtures unless a later decision explicitly expands scope.
- The VitePress showcase lives only under `site/`; keep `docs/` as source RFC/spec/decision markdown.
- AI tools that need to consume this design system for UI output should start with `skills/ayingott-design-system/SKILL.md`. The skill is repository documentation only and is not part of the `@ayingott/theme` npm package.

## Package Contract

- Public CSS exports are limited to `.`, `./index.css`, `./fonts.css`, and `./fonts/*`.
- `@ayingott/theme` must not import `fonts.css`; Space Grotesk, Space Mono, and Newsreader loading is consumer opt-in.
- Semantic variables such as `--surface-canvas` and `--text-primary` are runtime CSS variables, not guaranteed Tailwind utilities.
- If font files ship in the npm package, `THIRD_PARTY_NOTICES.md` must ship with them.

## Verification

Run:

```bash
pnpm check
```

This covers package-name import smoke and npm package dry-run.

## Release

- Release versions are shared by every repository `package.json`.
- Use `pnpm release:bump` for a patch bump, or `pnpm release:bump X.Y.Z` for an explicit version.
- Run release bumps only from `main` after the release PR has merged.
- The release script uses bumpp's built-in commit/tag format: `chore: release vX.Y.Z` and `vX.Y.Z`.
- The `vX.Y.Z` tag triggers `.github/workflows/release.yml`; an unprivileged validation job produces a checksummed tarball and release notes, the protected publish job receives only artifact-read and OIDC permissions, a separate job creates the GitHub Release, and a final job runs registry install smoke.
- Stable releases publish with npm dist-tag `latest` and may become the latest GitHub Release. Prereleases publish with dist-tag `next`, are marked as GitHub prereleases, and must not become latest.
- The protected GitHub environment for publish is `npm-publish`.

For the display-only VitePress showcase, run:

```bash
pnpm site:build
```

This only proves the showcase builds; it is not a package contract gate.

## More Context

- RFC: `docs/rfc/0001-theme-v0.md`
- Release: `docs/release/DS-D-09-release.md`
- Package: `packages/theme/README.md`
- Notices: `packages/theme/THIRD_PARTY_NOTICES.md`
