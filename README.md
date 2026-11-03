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

Opt in to self-hosted font files when the consumer wants the bundled Bricolage Grotesque, Space Mono, Literata, and LXGW WenKai assets:

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

Python 3 is required for the font-vendoring tests. See [docs/development.md](docs/development.md) for the full verification set, the showcase site commands, and the pinned Chrome browser gate.

## Release

```bash
pnpm release:bump        # patch bump
pnpm release:bump X.Y.Z  # explicit version
```

Run the release script from clean `main` after the release PR has merged. See [docs/release.md](docs/release.md) for the release steps, workflow, and rollback.

## Documentation

Start at [docs/index.md](docs/index.md).
