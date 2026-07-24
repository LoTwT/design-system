# Effects

Effects include radius, shadow, border, and motion tokens.

## Radius

<TokenPreview source="radius" prefix="radius-" preview="radius" />

## Shadow

<TokenPreview source="shadow" prefix="shadow-" preview="shadow" />

Importing `brutal.css` adds the `--shadow-hard-color`, `--shadow-hard-sm`, `--shadow-hard-md`, and `--shadow-hard-lg` physical tokens at `:root`, together with utilities for the three size tokens. They use positive offsets with zero blur, do not appear in the default entry, and remain available even when the current theme root does not carry `.brutal`.

## Border Width

<TokenPreview source="border" prefix="border-width-" preview="border" />

`--border-width-surface` and `--border-width-control` are foundation structure roles that default to `--border-width-thin`. Inside `.brutal`, both remap to `--border-width-heavy`. Unlike the entry-global hard-shadow tokens, they resolve in every family, so consumer CSS references them directly:

```css
.card {
  border: var(--border-width-surface) solid var(--border-default);
}

.button {
  border: var(--border-width-control) solid var(--border-default);
}
```

## Motion Duration

<TokenPreview source="motion" prefix="duration-" preview="motion" />

## Transition Groups

<TokenPreview source="transitions" prefix="transition-" preview="plain" />
