# Tokens reference

This file enumerates the variables `@ayingott/theme` ships in V0 so you do not have to read the source to look up a name. When in doubt, the source files in `packages/theme/src/` are authoritative.

## How the layers map

```
foundation/  → raw palette and scales        (--color-*, --spacing-*, --text-*, …)
layers/      → structural primitives         (--z-*, --breakpoint-*, --container-*, …)
semantic/    → consumer-facing API           (--surface-*, --text-*, --border-*, …)
utilities/   → focus + touch-target classes  (.focus-ring, .touch-target, …)
base.css     → minimal element resets
```

Consumers should reach for **semantic vars** first.

## Semantic variables (Paper + Ink)

Paper is the default `:root` mapping. Ink overrides the same names under `.dark`.

### Surfaces

| Variable | Light source | Dark value |
| --- | --- | --- |
| `--surface-canvas` | `var(--color-surface-0)` `#fbf7ee` | `#121019` |
| `--surface-panel` | `var(--color-surface-1)` `#fffcf6` | `#191623` |
| `--surface-elevated` | `var(--color-surface-2)` `#ffffff` | `#211d2e` |
| `--surface-subtle` | `var(--color-surface-3)` `#f1ebdd` | `#2a2635` |
| `--surface-muted` | `var(--color-surface-4)` `#e4ddcf` | `#373142` |

### Text

| Variable | Light | Dark |
| --- | --- | --- |
| `--text-primary` | `--color-neutral-950` `#191713` | `#f7f1e6` |
| `--text-secondary` | `--color-neutral-700` `#514a3e` | `#d7cdbc` |
| `--text-muted` | semantic literal `#6b6252` | `#aa9e8b` |
| `--text-inverse` | `--color-surface-2` `#ffffff` | `--color-neutral-950` `#191713` |
| `--text-accent` | `--color-lavender-700` `#66569d` | `--color-lavender-300` `#c7b6f5` |

### Borders

| Variable | Light | Dark |
| --- | --- | --- |
| `--border-subtle` | `rgb(25 23 19 / 0.10)` | `rgb(247 241 230 / 0.10)` |
| `--border-default` | `rgb(25 23 19 / 0.16)` | `rgb(247 241 230 / 0.16)` |
| `--border-strong` | `rgb(25 23 19 / 0.28)` | `rgb(247 241 230 / 0.28)` |

### Accent (lavender brand)

| Variable | Light | Dark |
| --- | --- | --- |
| `--accent-primary` | `--color-lavender-500` `#9c8fd9` | `--color-lavender-300` `#c7b6f5` |
| `--accent-primary-hover` | `--color-lavender-700` `#66569d` | `--color-lavender-200` `#ded4ff` |
| `--accent-primary-active` | `--color-lavender-800` `#51457c` | `--color-lavender-100` `#eee8ff` |
| `--accent-soft` | `--color-lavender-100` `#eee8ff` | `rgb(156 143 217 / 0.18)` |
| `--accent-contrast` | `--color-lavender-950` `#251f3a` | `--color-lavender-950` `#251f3a` |
| `--accent-contrast-hover` | `--text-inverse` `#ffffff` | `--accent-contrast` `#251f3a` |
| `--accent-contrast-active` | `--text-inverse` `#ffffff` | `--accent-contrast` `#251f3a` |

### Focus

| Variable | Light | Dark |
| --- | --- | --- |
| `--focus-ring-color` | `--color-lavender-700` `#66569d` | `--color-lavender-300` `#c7b6f5` |
| `--focus-ring-shadow` | `0 0 0 4px rgb(102 86 157 / 0.18)` | `0 0 0 4px rgb(199 182 245 / 0.22), 0 0 0 1px rgb(247 241 230 / 0.18)` |
| `--focus-ring-on-accent-color` | `--accent-contrast` `#251f3a` | `--accent-contrast` `#251f3a` |
| `--focus-ring-on-accent-shadow` | `0 0 0 4px rgb(37 31 58 / 0.18)` | `0 0 0 4px rgb(37 31 58 / 0.22)` |

### Status

| Variable | Light | Dark |
| --- | --- | --- |
| `--status-success` | `--color-success-500` `#20a66b` | `#84dfbd` |
| `--status-warning` | `--color-warning-500` `#e29a13` | `#ffdc7a` |
| `--status-danger` | `--color-danger-500` `#df3d63` | `#ff9ab6` |
| `--status-info` | `--color-info-500` `#2f82df` | `#8dc5ff` |

Each status also exposes `-fg`, `-bg`, and `-border` roles. Paper uses the `700` foreground/border on the `50` background; Ink uses the bright foreground on the `950` background with the `500` border.

### Reading

| Variable | Value / source |
| --- | --- |
| `--reading-font-body` | `var(--font-reading)` |
| `--reading-font-heading` | `var(--font-reading)` |
| `--reading-font-mono` | `var(--font-mono)` |
| `--reading-measure` | `65ch` |
| `--reading-font-size` | `var(--text-lg)` |
| `--reading-line-height` | `var(--leading-reading)` |
| `--reading-letter-spacing` | `var(--tracking-normal)` |
| `--reading-paragraph-gap` | `1.2em` |
| `--reading-fg` | `var(--text-primary)` |
| `--reading-bg` | `var(--surface-canvas)` |
| `--reading-fg-muted` | `var(--text-secondary)` |
| `--reading-link` | `var(--text-accent)` |
| `--reading-link-hover` | Light: `var(--accent-primary-active)`; dark: `var(--color-lavender-200)` |
| `--reading-accent` | `var(--accent-primary)` |
| `--reading-code-fg` | `var(--text-primary)` |
| `--reading-code-bg` | `var(--surface-subtle)` |
| `--reading-rule` | `var(--border-subtle)` |
| `--reading-focus` | `var(--focus-ring-color)` |
| `--reading-focus-shadow` | `var(--focus-ring-shadow)` |
| `--reading-scale-h1` | `var(--text-3xl)` |
| `--reading-scale-h2` | `var(--text-2xl)` |
| `--reading-scale-h3` | `var(--text-xl)` |
| `--reading-scale-h4` | `var(--text-lg)` |

`--reading-link` intentionally uses `--text-accent` rather than `--accent-primary`, so normal-size links pass AA on the light canvas.

## Neo-Brutal opt-in scope

Import `@ayingott/theme/brutal.css` after the default entry. Keep the family and scheme axes on one theme root: no classes select Paper, `.dark` selects Ink, `.brutal` selects Neo Light, and `.brutal.dark` selects Neo Dark. Arbitrary mixed nested theme islands are unsupported in V0.

| Category | Scope after `brutal.css` import | Consumer guidance |
| --- | --- | --- |
| Semantic roles such as `--surface-canvas` and `--text-muted` | Remapped inside `.brutal` / `.brutal.dark` | Primary consumer API |
| `--border-width-surface`, `--border-width-control` | Foundation roles defaulting to `--border-width-thin`; remapped to `--border-width-heavy` inside `.brutal` / `.brutal.dark` | Reference directly across families |
| `--shadow-hard-color`, `--shadow-hard-sm`, `--shadow-hard-md`, `--shadow-hard-lg` | Defined at `:root` | Entry-global physical tokens for direct composition; size utilities exist for `sm` / `md` / `lg` |
| `--brutal-*` palette variables | Family-local implementation values | Contract-owned; do not use directly in consumer CSS |

Use `--text-muted` for active muted UI copy. Physical color utilities remain valid for decorative or fixed-color work. `subtle`, `muted`, and `soft` are family-relative intents, not promises of equal alpha, literal color, or visual weight.

## Foundation palettes (use only when semantic vars do not fit)

- **Surface** (warm paper ramp): `--color-surface-0` `#fbf7ee` → `--color-surface-5` `#d8d1bf`. 6 steps.
- **Lavender** (brand): `--color-lavender-50` → `--color-lavender-950`. 11 steps.
- **Neutral** (warm brown-grey): `--color-neutral-50` → `--color-neutral-950`. 11 steps.
- **Decorative hues**, 5 families × 11 steps: `mint`, `sky`, `amber`, `rose`, `ink`.
- **Status families** (4 steps each): `success`, `warning`, `danger`, `info` at `50 / 500 / 700 / 950`.
- **Syntax** (code highlighting): 6 tokens — `--color-syntax-keyword`, `--color-syntax-string`, `--color-syntax-number`, `--color-syntax-function`, `--color-syntax-comment`, `--color-syntax-operator`.

## Type

- Families: `--font-display` (Space Grotesk), `--font-sans` (system-ui), `--font-mono` (Space Mono), `--font-reading` (Newsreader + serif fallback chain).
- Scale: `--text-2xs` `10px` → `--text-7xl` `72px`. 13 steps. Each pairs with `--text-{size}--line-height`.
- Reading leading: `--leading-reading 1.7`.
- Tracking: `--tracking-tighter` `-0.04em`, `--tracking-tight` `-0.02em`, `--tracking-normal` `0`, `--tracking-wide` `0.02em`, `--tracking-wider` `0.04em`, `--tracking-widest` `0.08em`.
- Font weights: `--font-weight-light 300`, `--font-weight-regular 400`, `--font-weight-medium 500`, `--font-weight-semibold 600`, `--font-weight-bold 700`.

## Spacing

- 4px base. 19 steps from `--spacing-0-5` (`0.125rem`) to `--spacing-32` (`8rem`). Half-steps use the `-5` suffix (`0-5`, `1-5`, `2-5`, `3-5`), never `.5`.

## Layout

- `--layout-page-gutter`: `clamp(1rem, 4vw, 3rem)`
- `--layout-section-gap`: `clamp(3rem, 8vw, 7rem)`
- `--layout-prose-width`: equals `--container-reading` (`42rem`)
- `--reading-measure`: font-relative long-form body measure (`65ch`), not a layout shell width.

## Radius

- 8 named steps: `--radius-none / -xs / -sm / -md / -lg / -xl / -2xl / -full`.
- Aliases: `--radius-card` = `--radius-lg` (`0.5rem`); `--radius-control` = `--radius-md` (`0.375rem`).

## Shadow

- Levels: `--shadow-none / -xs / -sm / -md / -lg / -xl`. Two-layer warm shadows; base alpha-color is `--color-neutral-900`.
- Aliases: `--shadow-card` = `--shadow-sm`; `--shadow-panel` = `--shadow-md`; `--shadow-focus` = lavender alpha glow.
- No inset shadows in V0.

## Border weights

- 5 widths: `--border-width-hairline 0.5px`, `--border-width-thin 1px` (default), `--border-width-medium 1.5px`, `--border-width-thick 2px`, `--border-width-heavy 3px`.

## Motion

- Durations: `--duration-instant 0`, `--duration-fast 120ms`, `--duration-normal 180ms`, `--duration-slow 260ms`, `--duration-slower 420ms`.
- Easings: `--ease-standard cubic-bezier(.2,0,0,1)`, `--ease-emphasized`, `--ease-out-soft`, `--ease-in-soft`. No bounces, no springs.
- Transitions (grouped): `--transition-interactive`, `--transition-surface`, `--transition-motion`.
- Keyframes: `ayingott-fade-in`, `ayingott-pop-in`. Prefixed to avoid consumer collision.

## Layer tokens

- `--z-*`: 9 steps from `--z-base 0` to `--z-toast 1000`. Header sits at `--z-header 200`.
- `--breakpoint-*`: 6 steps (xs, sm, md, lg, xl, 2xl).
- `--container-*`: includes `--container-reading 42rem` for prose width.
- `--touch-target-min: 44px` (used by the `touch-target` utility).
- `--opacity-disabled 0.45`, `-muted 0.62`, `-subtle 0.72`, `-overlay 0.76`, `-emphasis 0.88`.

## Utilities

`@ayingott/theme` ships exactly two utility families. Both apply to all elements; they are not Tailwind variants, they are static utility classes.

- `.focus-ring` / `.focus-ring-inset` — applies `--focus-ring-color` outline + `--focus-ring-shadow`. Use `inset` on inputs, plain on buttons.
- `.touch-target` / `.touch-target-inline` — enforces `min-height` / `min-width` of `--touch-target-min` (44px).

Anything else you want — color utilities, spacing utilities, layout utilities — comes from Tailwind v4 reading the `@theme` block, not from a file in this package.
