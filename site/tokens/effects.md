# Effects

Effects include radius, shadow, border, and motion tokens.

## Radius

<TokenPreview source="radius" prefix="radius-" preview="radius" />

## Shadow

<TokenPreview source="shadow" prefix="shadow-" preview="shadow" />

Importing `brutal.css` adds the `--shadow-hard-color`, `--shadow-hard-sm`, `--shadow-hard-md`, and `--shadow-hard-lg` physical tokens at `:root`, together with utilities for the three size tokens. They use positive offsets with zero blur, do not appear in the default entry, and remain available even when the current theme root does not carry `.brutal`.

## Border Width

<TokenPreview source="border" prefix="border-width-" preview="border" />

Inside `.brutal`, `--border-width-surface` and `--border-width-control` both map to `--border-width-heavy`. Unlike the entry-global hard-shadow tokens, these structure roles are family-scoped. Use the canonical fallbacks when the same consumer CSS must work with or without Neo:

```css
.card {
  border: var(--border-width-surface, var(--border-width-thin)) solid var(--border-default);
}

.button {
  border: var(--border-width-control, var(--border-width-thin)) solid var(--border-default);
}
```

If a referenced custom property is missing and the `var()` has no fallback, the containing declaration becomes invalid at computed-value time. The declaration behaves as `unset`: an inherited property inherits, while a non-inherited property takes its initial value. An earlier cascaded declaration is not revived, and CSS does not invent a family fallback.

## Motion Duration

<TokenPreview source="motion" prefix="duration-" preview="motion" />

## Transition Groups

<TokenPreview source="transitions" prefix="transition-" preview="plain" />
