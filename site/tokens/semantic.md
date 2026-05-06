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
