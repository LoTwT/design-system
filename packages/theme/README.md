# @ayingott/theme

CSS-first Tailwind CSS v4 theme package for Ayingott projects.

Tailwind CSS `^4.0.0` is a required peer dependency. The package itself has no runtime JavaScript dependencies.

## Install

```bash
pnpm add @ayingott/theme tailwindcss
```

## Usage

```css
@import "tailwindcss";
@import "@ayingott/theme";
```

The theme includes tokens, semantic runtime variables, the reading long-form layer, base styles, and small utilities. It does not load web fonts by default.

Opt in to bundled fonts:

```css
@import "tailwindcss";
@import "@ayingott/theme/fonts.css";
@import "@ayingott/theme";
```

`fonts.css` provides Bricolage Grotesque, Space Mono, Literata, and original
LXGW WenKai (霞鹜文楷) v1.522. WenKai supplies Chinese glyphs in all four font
roles, while Latin text keeps Bricolage Grotesque for display, system UI for
body, Literata for reading, and Space Mono for code. Loading remains opt-in.

WenKai includes real Regular `400` and Medium `500` faces. Use `font-regular`
for normal text or `font-medium` for a slightly heavier treatment, including
on a body/reading container if preferred. The default body weight stays `400`.
WenKai is not variable: `300`, `600`, and `700` do not select additional bundled
weights, and browsers may synthesize bold. Chinese glyph widths are not
guaranteed to equal two Space Mono cells.

The self-hosted WOFF2 files preserve all upstream glyphs. CSS `unicode-range`
limits WenKai to Han characters, CJK punctuation, and related Chinese ranges,
excluding emoji/text presentation selectors (`FE0E` / `FE0F`),
so Latin-only text does not request it. Each requested weight downloads a full
file (Regular 7.65 MiB; Medium 8.54 MiB); these are not subsets. All faces use `font-display: swap`. macOS and
Windows use the same loaded font files, followed by each role's system fallback
stack when needed. See `THIRD_PARTY_NOTICES.md` for source, sizes, checksums,
and the included font license.

## Paper & Ink

Paper is the default semantic theme on `:root`. Ink is its `.dark` companion:

```html
<html class="dark">
  ...
</html>
```

The pair keeps typography, spacing, layout, component anatomy, radius, icons, copy, and interaction structure unchanged. Semantic color, border, accent, focus, status, reading, and depth roles respond to the active mode.

## Neo-Brutalism opt-in

Import the family entry after the default theme:

```css
@import "tailwindcss";
@import "@ayingott/theme";
@import "@ayingott/theme/brutal.css";
```

Apply `.brutal` to the theme root. Keep using `.dark` for the scheme, and place both classes on that same root:

```html
<html class="brutal dark">
  ...
</html>
```

The entry remaps the complete semantic and reading role set, maps card/control radius to zero, remaps `--border-width-surface` and `--border-width-control` to `--border-width-heavy`, and adds zero-blur hard shadows. Removing `.brutal` falls back to Paper or Ink without changing the `.dark` mechanism.

V0 supports the four co-located root states: no classes for Paper, `.dark` for Ink, `.brutal` for Neo Light, and `.brutal.dark` for Neo Dark. Arbitrary mixed nested theme islands are unsupported because splitting the family and scheme axes across nested scopes can produce hybrid mappings.

Keep consumer styles on semantic roles and the two structure roles. `--border-width-surface` and `--border-width-control` are foundation roles that default to `--border-width-thin`; `.brutal` remaps them to `--border-width-heavy`. Importing `brutal.css` makes `--shadow-hard-color` and the `--shadow-hard-sm` / `md` / `lg` size tokens available at `:root`. The family-local `--brutal-*` palette variables are contract-owned implementation details, not a consumer direct-use API.

Physical hard shadows default to `currentColor` in all four root states. Neo card/panel shadows and `pressable` feedback use a separate family depth color.

Neo Dark uses warm charcoal surfaces, ivory text, separate default/strong borders, and dark hard shadows. Use `--border-default` or `--border-strong` for essential control boundaries; `--border-subtle` is decorative. `--accent-soft` is the deep-purple selected surface, distinct from the muted/disabled surface. The independent depth color preserves Neo Light's existing shadows; consumers continue to use `--shadow-card`, `--shadow-panel`, and `pressable`.

Use the scoped interaction utility with the existing accessibility utilities:

```html
<button class="pressable focus-ring touch-target">Action</button>
```

`pressable` moves only inside `.brutal`, excludes disabled states, and owns a local reduced-motion and forced-colors fallback. The default entry still injects no global reduced-motion policy.

## Contract

- Foundation tokens use `@theme static` so all token CSS variables are emitted and Tailwind utilities are generated.
- Semantic variables such as `--surface-canvas` and `--text-primary` are runtime CSS variables.
- Action states use `--accent-contrast`, `--accent-contrast-hover`, and `--accent-contrast-active` with their matching accent backgrounds.
- Neutral and accent surfaces have separate focus roles. Status treatments expose foreground, background, and border roles while preserving the legacy status aliases.
- Long-form reading variables such as `--reading-measure`, `--reading-line-height`, and `--reading-link` live in the semantic layer and inherit light/dark runtime variables.
- `--container-reading` / `--layout-prose-width` are layout width tokens. `--reading-measure` is the font-relative measure for long-form body copy.
- V0 does not publish component primitives or framework adapters.
- The public exports are `.`, `./index.css`, `./brutal.css`, `./fonts.css`, and `./fonts/*`.
