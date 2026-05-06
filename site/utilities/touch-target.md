# Touch Target

V0 ships two touch utilities:

```css
touch-target
touch-target-inline
```

## Preview

<div class="grid gap-4 sm:grid-cols-2">
  <button class="touch-target rounded-control border" style="border-color: var(--border-default); background: var(--surface-elevated); color: var(--text-primary);">
    44px target
  </button>
  <a class="touch-target-inline rounded-control border no-underline" href="#" style="border-color: var(--border-default); background: var(--surface-elevated); color: var(--text-accent);">
    inline touch target
  </a>
</div>

`--touch-target-min` defaults to `2.75rem` (44px).
