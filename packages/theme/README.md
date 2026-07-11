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

`fonts.css` currently provides Space Grotesk, Space Mono, and Newsreader. The
reading layer uses the `--font-reading` token, but the webfont file is still
loaded only when the consumer imports `fonts.css`.

## Contract

- Foundation tokens use `@theme static` so all token CSS variables are emitted and Tailwind utilities are generated.
- Semantic variables such as `--surface-canvas` and `--text-primary` are runtime CSS variables.
- Long-form reading variables such as `--reading-measure`, `--reading-line-height`, and `--reading-link` live in the semantic layer and inherit light/dark runtime variables.
- `--container-reading` / `--layout-prose-width` are layout width tokens. `--reading-measure` is the font-relative measure for long-form body copy.
- V0 does not publish component primitives or framework adapters.
