# RFC 0001: `@ayingott/theme` V0

## Status

Implemented as the historical V0 baseline. The current additive package contract also includes the opt-in Neo-Brutalism family defined by [`docs/spec/rfc-brutal-theme.md`](../spec/rfc-brutal-theme.md); that accepted addendum extends, but does not replace, this theme-only boundary.

## Repository Addendum (DS-D-05)

DS-D-05 later added the repository-level `site/` VitePress showcase. The site
is a display and documentation surface only: it is not part of the npm package
payload, public exports, or consumer contract. `@ayingott/theme` therefore
remains theme-only, and the showcase does not supersede this RFC's package
boundary.

## Decisions

- V0 publishes one package: `@ayingott/theme`.
- Engine is Tailwind CSS v4.
- Repository is `LoTwT/design-system`.
- V0 is framework-agnostic and does not include component primitives, Vue wrappers, adapters, playgrounds, fixtures, or VitePress.

## Package Contract

Public exports:

- `@ayingott/theme`
- `@ayingott/theme/index.css`
- `@ayingott/theme/brutal.css`
- `@ayingott/theme/fonts.css`
- `@ayingott/theme/fonts/*`

`@ayingott/theme` imports the default Paper/Ink CSS layers. It does not import `fonts.css` or `brutal.css`.

`brutal.css` is an opt-in additive entry imported after `@ayingott/theme`. It adds the `.brutal` family selector, Neo Light/Dark semantic mappings, hard-shadow variables/utilities, structure roles, and the scoped `pressable` utility. `.dark` remains the scheme selector. The executable boundary lives in [`docs/spec/brutal-theme-contract.json`](../spec/brutal-theme-contract.json).

`fonts.css` is opt-in and contains only `@font-face` declarations that point to package-local `.woff2` files.

## CSS Layers

The package keeps UX sections as separate CSS source files:

- `foundation/*`: color, typography, spacing, sizing, radius, shadow, border, motion.
- `layers/*`: z-index, breakpoints, containers, grid, layout, aspect, opacity, transitions, touch target.
- `semantic/*`: Paper/Ink runtime variables plus the opt-in `semantic/brutal.css` family mapping.
- `utilities/*`: small reusable utilities such as focus ring and touch target, plus the opt-in `utilities/pressable.css` interaction.
- `base.css`: base document styles.
- `index.css`: default Paper/Ink aggregate import entry.
- `brutal.css`: opt-in family aggregate entry; it is never imported by `index.css`.

## Tailwind Boundary

Foundation and layer tokens use `@theme static` so the package emits the full token CSS variable contract while still generating Tailwind utilities.

Runtime semantic aliases use `:root` and `.dark` by default; the additive family entry uses `.brutal` and `.brutal.dark`. The package does not promise semantic utility classes such as `bg-surface-canvas` or `text-primary`.

Consumers may choose to map runtime variables into Tailwind utilities in their own app CSS later, but that is outside the V0 package contract.

## Fonts

V0 ships open-source font files:

- Space Grotesk variable Latin and Latin Extended, from `@fontsource-variable/space-grotesk@5.2.10`.
- Space Mono Latin regular and bold, from `@fontsource/space-mono@5.2.9`.

All packaged fonts are SIL Open Font License 1.1. System Chinese fallback names such as PingFang SC, Hiragino Sans GB, and Microsoft YaHei are CSS references only and are not redistributed.

The npm package must include:

- `src/fonts.css`
- `src/fonts/*.woff2`
- `THIRD_PARTY_NOTICES.md`

## Verification Gate

V0 PRs must pass:

```bash
pnpm install --frozen-lockfile
pnpm check
git diff --check
```

`pnpm check` must prove:

- Tailwind can process package-name imports: `@import "@ayingott/theme/fonts.css"` and `@import "@ayingott/theme"`.
- Foundation utilities such as lavender color, font, radius, shadow, focus ring, and touch target are generated.
- Runtime variables such as `--surface-canvas`, `--text-primary`, and `.dark` are present.
- `@font-face` output references packaged font files.
- `pnpm pack --dry-run` includes CSS entries, `.woff2` files, and `THIRD_PARTY_NOTICES.md`.
