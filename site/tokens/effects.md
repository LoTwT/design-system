# Effects

Effects include radius, shadow, border, and motion tokens.

## Radius

<TokenPreview source="radius" prefix="radius-" preview="radius" />

## Shadow

<TokenPreview source="shadow" prefix="shadow-" preview="shadow" />

`brutal.css` adds the opt-in `--shadow-hard-sm`, `--shadow-hard-md`, and `--shadow-hard-lg` physical tokens. They use positive offsets with zero blur and do not appear in the default entry.

## Border Width

<TokenPreview source="border" prefix="border-width-" preview="border" />

Inside `.brutal`, `--border-width-surface` and `--border-width-control` both map to `--border-width-heavy`. Outside the family, consumers may use `var(--border-width-control, var(--border-width-thin))` for a clean fallback.

## Motion Duration

<TokenPreview source="motion" prefix="duration-" preview="motion" />

## Transition Groups

<TokenPreview source="transitions" prefix="transition-" preview="plain" />
