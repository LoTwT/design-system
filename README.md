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

```bash
pnpm install
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
pnpm site:browser
```

`site:build` is the portable static build and emitted-output gate. `site:browser`
then verifies the built site with a local Chrome/Chromium binary; set
`CHROME_PATH` when it is outside a standard location. `playwright-core` does not
download a browser; to reproduce the pinned gate locally, run:

```bash
pnpm dlx @puppeteer/browsers@3.0.6 install chrome@150.0.7871.125 --path .cache/chrome-for-testing --format "{{path}}"
CHROME_PATH=/absolute/path/from-above EXPECTED_CHROME_VERSION=150.0.7871.125 pnpm site:browser
```

CI and release validation use the same exact Chrome for Testing version and
reject browser-version drift.

`site/` is display-only and does not replace the package smoke or pack gates.
