# Ayingott Design System

Design system source for `@ayingott/theme`.

V0 is intentionally narrow:

- Tailwind CSS v4 CSS-first theme package.
- Foundation tokens, layer tokens, semantic variables, base styles, and small accessibility utilities.
- Optional self-hosted font entry, including reading fonts.
- No component primitives, Vue package, adapter, playground, or fixtures.
- A separate `site/` VitePress showcase displays the shipped tokens and visual language.

## Package

```css
@import "tailwindcss";
@import "@ayingott/theme";
```

Opt in to self-hosted font files when the consumer wants the bundled Space Grotesk, Space Mono, and Newsreader assets:

```css
@import "tailwindcss";
@import "@ayingott/theme/fonts.css";
@import "@ayingott/theme";
```

## Development

Requires Node.js >=22.13.

```bash
pnpm install --frozen-lockfile
pnpm check
```

`pnpm check` runs the source smoke, package dry-run, real-tarball consumer install/compile, and site contrast gates.

## Release

Release versions are shared by every repository `package.json`.

```bash
pnpm release:bump        # patch bump
pnpm release:bump 0.0.1  # explicit version
```

Run the release script from `main` after the release PR has merged. It uses `bumpp@11.1.0` and creates `chore: release vX.Y.Z` commits with `vX.Y.Z` tags. The tag push triggers the release workflow, which validates release metadata, publishes `@ayingott/theme` through npm Trusted Publishing / OIDC, runs registry install smoke, and creates a GitHub Release from git-cliff notes. The release tag ruleset is the pre-publish control; the `npm-publish` environment is an OIDC binding and is not a protected approval gate. See [DS-D-09](docs/release/DS-D-09-release.md) for workflow mechanics and [DS-D-10](docs/release/DS-D-10-v0-auto-publish.md) for current controls and accepted residuals.

The showcase site is intentionally separate from source docs:

```bash
pnpm site:dev
pnpm site:build
```

`site/` is display-only and does not replace the package smoke or pack gates.
