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

## Choose a family and scheme

Paper and Ink remain the defaults. Import the opt-in family entry after the default theme to add Neo-Brutal Light and Dark:

```css
@import "tailwindcss";
@import "@ayingott/theme";
@import "@ayingott/theme/brutal.css";
```

| Family class | Scheme class | Effective theme |
| --- | --- | --- |
| absent | absent | Paper |
| absent | `.dark` | Ink |
| `.brutal` | absent | Neo-Brutal Light |
| `.brutal` | `.dark` | Neo-Brutal Dark |

Place the family and scheme classes together on the same theme root:

```html
<html class="brutal dark">
  ...
</html>
```

V0 supports these co-located root states. Arbitrary mixed nested theme islands are unsupported because splitting the two axes across nested scopes can produce hybrid semantic mappings. See [Theme overview](./theme-overview) for the four-state specimens.

Keep consumer CSS on semantic and structure roles. The `--brutal-*` palette variables are contract-owned implementation details, not a consumer direct-use API. See [Effects](../tokens/effects) for hard-shadow and border-width scope, and [Semantic variables](../tokens/semantic) for family-relative intent guidance.

## Status roles

The legacy `--status-success`, `--status-warning`, `--status-danger`, and `--status-info` variables are compatibility accent aliases. They do not carry a standalone contrast guarantee. Status text and components should use the verified foreground, background, and border roles together:

```css
.status-success {
  color: var(--status-success-fg);
  background: var(--status-success-bg);
  border-color: var(--status-success-border);
}
```

## Reduced motion

The package intentionally does not add a global `prefers-reduced-motion` override. Consumers own reduced-motion behavior for the animations they apply. Scope the override to the consumer's animated elements:

```css
.motion-enter {
  animation: var(--animate-fade-in);
}

@media (prefers-reduced-motion: reduce) {
  .motion-enter {
    animation: none;
    transition: none;
  }
}
```
