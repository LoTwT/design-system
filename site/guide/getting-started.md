# Getting Started

Install the theme package in a Tailwind CSS v4 project:

```bash
pnpm add @ayingott/theme tailwindcss
```

Import the theme CSS:

```css
@import "tailwindcss";
@import "@ayingott/theme";
```

Opt in to bundled fonts when the project should use Space Grotesk, Space Mono, and Newsreader:

```css
@import "tailwindcss";
@import "@ayingott/theme/fonts.css";
@import "@ayingott/theme";
```

## Paper & Ink

Paper is active by default. Apply `.dark` to activate Ink:

```html
<html class="dark">
  ...
</html>
```

The same semantic variables update through CSS cascade. Typography, spacing, layout, component anatomy, radius, icons, copy, and interaction structure remain unchanged. Consumers do not need a framework adapter.
