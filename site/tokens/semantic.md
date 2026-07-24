# Semantic Variables

Semantic variables are runtime CSS variables. They do not generate Tailwind utilities in V0.

## Paper

Paper is the default `:root` mapping.

<ColorSwatchGrid title="Surfaces" prefix="surface-" source="semantic-light" />

<ColorSwatchGrid title="Text" prefix="text-" source="semantic-light" />

<ColorSwatchGrid title="Accent" prefix="accent-" source="semantic-light" />

<ColorSwatchGrid title="Status" prefix="status-" source="semantic-light" />

## Ink

The same semantic names are overridden under `.dark`. Ink also flattens semantic card and panel depth through `--shadow-none`.

<div class="dark rounded-card border p-4" style="border-color: var(--border-default); background: var(--surface-canvas);">
  <ColorSwatchGrid title="Dark surfaces" prefix="surface-" source="semantic-dark" />
  <ColorSwatchGrid title="Dark text" prefix="text-" source="semantic-dark" />
  <ColorSwatchGrid title="Dark accent" prefix="accent-" source="semantic-dark" />
</div>

## Neo-Brutal Light and Dark

Neo-Brutalism uses the same semantic and reading names through the opt-in `brutal.css` entry. `.brutal` activates Neo Light; `.brutal.dark` activates Neo Dark. Sticker colors remain fixed across schemes, including pure white text on `#3D5AFE` blue.

The family also remaps `--radius-card`, `--radius-control`, `--shadow-card`, and `--shadow-panel`, and remaps the foundation `--border-width-surface` / `--border-width-control` structure roles to `--border-width-heavy`. It does not alter the default Paper/Ink entry.

Use `--text-muted` for active muted UI copy such as helper text and metadata. A physical color utility such as `text-neutral-600` can still serve decorative or explicitly fixed-color work, but it is not the default for semantic copy.

Names such as `--surface-subtle`, `--surface-muted`, and `--accent-soft` express family-relative intent. They do not promise the same alpha, literal color, or visual weight across Paper, Ink, Neo Light, and Neo Dark.

## Interaction and status roles

| Intent | Variables |
| --- | --- |
| Primary action foreground | `--accent-contrast`, `--accent-contrast-hover`, `--accent-contrast-active` |
| Neutral focus | `--focus-ring-color`, `--focus-ring-shadow` |
| Accent focus | `--focus-ring-on-accent-color`, `--focus-ring-on-accent-shadow` |
| Success | `--status-success-fg`, `--status-success-bg`, `--status-success-border` |
| Warning | `--status-warning-fg`, `--status-warning-bg`, `--status-warning-border` |
| Danger | `--status-danger-fg`, `--status-danger-bg`, `--status-danger-border` |
| Info | `--status-info-fg`, `--status-info-bg`, `--status-info-border` |

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
| `--reading-letter-spacing` | `var(--tracking-normal)` |
| `--reading-paragraph-gap` | `1.2em` |
| `--reading-fg` | `var(--text-primary)` |
| `--reading-bg` | `var(--surface-canvas)` |
| `--reading-fg-muted` | `var(--text-secondary)` |
| `--reading-link` | `var(--text-accent)` |
| `--reading-code-bg` | `var(--surface-subtle)` |
| `--reading-focus` | `var(--focus-ring-color)` |
| `--reading-focus-shadow` | `var(--focus-ring-shadow)` |

Use `--reading-measure` for the body text column. Use
`--container-reading` or `--layout-prose-width` for the outer layout shell.
