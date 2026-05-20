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

## Dark Mode

V0 uses a `.dark` class:

```html
<html class="dark">
  ...
</html>
```

The semantic variables update through CSS cascade. Consumers do not need a framework adapter.
