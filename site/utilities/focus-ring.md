# Focus Ring

V0 ships two focus utilities:

```css
focus-ring
focus-ring-inset
```

## Preview

<div class="grid gap-4 sm:grid-cols-2">
  <button class="touch-target rounded-control border px-4 focus-ring-preview" style="border-color: var(--border-default); background: var(--surface-elevated); color: var(--text-primary);">
    focus-ring
  </button>
  <button class="touch-target rounded-control border px-4 focus-ring-preview focus-ring-preview--inset" style="border-color: var(--border-default); background: var(--surface-elevated); color: var(--text-primary);">
    focus-ring-inset
  </button>
</div>

The page forces the ring shape for inspection. In products, the utilities apply
only on `:focus-visible` so mouse interaction does not leave a persistent ring.

## Keyboard behavior

<div class="grid gap-4 sm:grid-cols-2">
  <button class="touch-target rounded-control border px-4 focus-ring" style="border-color: var(--border-default); background: var(--surface-elevated); color: var(--text-primary);">
    Tab focus-ring
  </button>
  <button class="touch-target rounded-control border px-4 focus-ring-inset" style="border-color: var(--border-default); background: var(--surface-elevated); color: var(--text-primary);">
    Tab focus-ring-inset
  </button>
</div>

Use keyboard navigation to inspect the real utility behavior. These controls
render the ring only when they match `:focus-visible`.
