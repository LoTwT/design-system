# @ayingott/theme

CSS-first Tailwind CSS v4 theme package for Ayingott projects.

## Install

```bash
pnpm add @ayingott/theme tailwindcss
```

## Usage

```css
@import "tailwindcss";
@import "@ayingott/theme";
```

The theme includes tokens, semantic runtime variables, base styles, and small utilities. It does not load web fonts by default.

Opt in to bundled fonts:

```css
@import "tailwindcss";
@import "@ayingott/theme/fonts.css";
@import "@ayingott/theme";
```

## Contract

- Foundation tokens generate Tailwind utilities through `@theme`.
- Semantic variables such as `--surface-canvas` and `--text-primary` are runtime CSS variables.
- V0 does not publish component primitives or framework adapters.
