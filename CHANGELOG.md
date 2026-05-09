# Changelog

## 0.0.2

Patch — scope focus-ring utilities to `:focus-visible`.

- `focus-ring` and `focus-ring-inset` utilities now apply only when the element matches `:focus-visible`, matching the existing `base.css` `:focus-visible` outline rule and the documented intent. Previously the styles applied whenever the class was present, which produced an always-on ring during mouse-driven focus (observed downstream in the `ayingott.me` consumer).
- No changes to tokens, semantic variables, base styles, fonts, or package exports.
- Consumers that previously relied on the unintended always-on behavior must add their own outline declaration.

## 0.0.1

Initial technical release for `@ayingott/theme`.

- Ships the Tailwind CSS v4 CSS-first theme entry through `@ayingott/theme` and `@ayingott/theme/index.css`.
- Ships optional self-hosted font loading through `@ayingott/theme/fonts.css` and `@ayingott/theme/fonts/*`.
- Includes foundation tokens, semantic runtime variables, base styles, focus-ring utilities, and touch-target utilities.
- Keeps V0 intentionally theme-only: no component primitives, Vue package, adapters, playground, or fixtures.
