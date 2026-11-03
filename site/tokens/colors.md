# Colors

Color tokens come from `packages/theme/src/foundation/colors.css`.

## Surfaces

<ColorSwatchGrid title="Surface" prefix="color-surface-" />

## Primary accent

<ColorSwatchGrid title="Lavender" prefix="color-lavender-" />

## Neutral

<ColorSwatchGrid title="Neutral" prefix="color-neutral-" />

## Decorative hues

<ColorSwatchGrid title="Mint" prefix="color-mint-" />

<ColorSwatchGrid title="Sky" prefix="color-sky-" />

<ColorSwatchGrid title="Amber" prefix="color-amber-" />

<ColorSwatchGrid title="Rose" prefix="color-rose-" />

<ColorSwatchGrid title="Ink" prefix="color-ink-" />

## Status

<ColorSwatchGrid title="Success" prefix="color-success-" />

<ColorSwatchGrid title="Warning" prefix="color-warning-" />

<ColorSwatchGrid title="Danger" prefix="color-danger-" />

<ColorSwatchGrid title="Info" prefix="color-info-" />

## Syntax

`.dark`, `.brutal`, and `.brutal.dark` redeclare these tokens so code highlighting meets 4.5:1 on the canvas and on `--reading-code-bg` in every family. Neo Light and Neo Dark reuse the Paper and Ink keyword, string, function, and number values. Their comment and operator colors stay in each Neo family's warm neutral tones; in Neo Dark they match `--text-muted` and `--text-secondary`.

<ColorSwatchGrid title="Syntax · Paper" prefix="color-syntax-" />

<ColorSwatchGrid title="Syntax · Ink" prefix="color-syntax-" source="semantic-dark" />
