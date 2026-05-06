# Agent Guide

This repository is the source for the Ayingott design system.

## Start Here

- V0 scope is `@ayingott/theme` only.
- Use Tailwind CSS v4 CSS-first features.
- Keep the package framework-agnostic.
- Do not add component primitives, Vue packages, adapters, playgrounds, or fixtures unless a later decision explicitly expands scope.
- The VitePress showcase lives only under `site/`; keep `docs/` as source RFC/spec/decision markdown.

## Package Contract

- Public CSS exports are limited to `.`, `./index.css`, `./fonts.css`, and `./fonts/*`.
- `@ayingott/theme` must not import `fonts.css`; font loading is consumer opt-in.
- Semantic variables such as `--surface-canvas` and `--text-primary` are runtime CSS variables, not guaranteed Tailwind utilities.
- If font files ship in the npm package, `THIRD_PARTY_NOTICES.md` must ship with them.

## Verification

Run:

```bash
pnpm check
```

This covers package-name import smoke and npm package dry-run.

For the display-only VitePress showcase, run:

```bash
pnpm site:build
```

This only proves the showcase builds; it is not a package contract gate.

## More Context

- RFC: `docs/rfc/0001-theme-v0.md`
- Package: `packages/theme/README.md`
- Notices: `packages/theme/THIRD_PARTY_NOTICES.md`
