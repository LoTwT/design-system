# Semantic Variables

Semantic variables are runtime CSS variables. They do not generate Tailwind utilities in V0.

## Light

<ColorSwatchGrid title="Surfaces" prefix="surface-" source="semantic-light" />

<ColorSwatchGrid title="Text" prefix="text-" source="semantic-light" />

<ColorSwatchGrid title="Accent" prefix="accent-" source="semantic-light" />

<ColorSwatchGrid title="Status" prefix="status-" source="semantic-light" />

## Dark

The same semantic names are overridden under `.dark`.

<div class="dark rounded-card border p-4" style="border-color: var(--border-default); background: var(--surface-canvas);">
  <ColorSwatchGrid title="Dark surfaces" prefix="surface-" source="semantic-dark" />
  <ColorSwatchGrid title="Dark text" prefix="text-" source="semantic-dark" />
  <ColorSwatchGrid title="Dark accent" prefix="accent-" source="semantic-dark" />
</div>

## Reading

The reading layer is for long-form prose. It inherits light and dark semantic
colors and adds a font-relative measure for body copy.

| Variable | Value / source |
| --- | --- |
| `--reading-font-body` | `var(--font-reading)` |
| `--reading-font-heading` | `var(--font-reading)` |
| `--reading-measure` | `65ch` |
| `--reading-font-size` | `var(--text-lg)` |
| `--reading-line-height` | `var(--leading-reading)` |
| `--reading-paragraph-gap` | `1.2em` |
| `--reading-fg` | `var(--text-primary)` |
| `--reading-bg` | `var(--surface-canvas)` |
| `--reading-fg-muted` | `var(--text-secondary)` |
| `--reading-link` | `var(--text-accent)` |
| `--reading-code-bg` | `var(--surface-subtle)` |

Use `--reading-measure` for the body text column. Use
`--container-reading` or `--layout-prose-width` for the outer layout shell.
