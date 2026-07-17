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

## Neo-Brutal pressable

`pressable` ships only through `@ayingott/theme/brutal.css` and only moves inside `.brutal`. Compose it with the default accessibility utilities:

```html
<button class="pressable focus-ring touch-target">Action</button>
```

Hover lifts by `-2px` on both axes; active presses by `6px`; disabled controls do not move. The utility owns local reduced-motion and forced-colors fallbacks. It does not replace focus or target-size behavior.

<div class="brutal grid gap-5 p-5" style="overflow: visible; background: var(--surface-canvas); color: var(--text-primary);">
  <button class="theme-action theme-action--primary pressable focus-ring touch-target">Pressable</button>
  <button class="theme-action pressable focus-ring touch-target" disabled>Disabled</button>
</div>
