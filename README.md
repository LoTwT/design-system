# Ayingott Design System

Design system source for `@ayingott/theme`.

V0 is intentionally narrow:

- Tailwind CSS v4 CSS-first theme package.
- Foundation tokens, layer tokens, semantic variables, base styles, and small accessibility utilities.
- Optional self-hosted font entry.
- No component primitives, Vue package, adapter, playground, or fixtures.
- A separate `site/` VitePress showcase displays the shipped tokens and visual language.

## Package

```css
@import "tailwindcss";
@import "@ayingott/theme";
```

Opt in to self-hosted font files when the consumer wants the bundled Space Grotesk and Space Mono assets:

```css
@import "tailwindcss";
@import "@ayingott/theme/fonts.css";
@import "@ayingott/theme";
```

## Development

```bash
pnpm install
pnpm check
```

`pnpm check` runs the package-name import smoke test and npm package dry-run.

## Release

Release versions are shared by every repository `package.json`.

```bash
pnpm release:bump        # patch bump
pnpm release:bump 0.0.1  # explicit version
```

Run the release script from `main` after the release PR has merged. It uses `bumpp@11.1.0` and creates `chore: release vX.Y.Z` commits with `vX.Y.Z` tags. The tag push triggers the protected release workflow, which validates release metadata, publishes `@ayingott/theme` through npm Trusted Publishing / OIDC, runs registry install smoke, and creates a GitHub Release from git-cliff notes. See `docs/release/DS-D-09-release.md`.

The showcase site is intentionally separate from source docs:

```bash
pnpm site:dev
pnpm site:build
```

`site/` is display-only and does not replace the package smoke or pack gates.
