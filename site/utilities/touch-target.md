# Touch Target

V0 ships two touch utilities with different minimum-size rules:

- `touch-target` sets both the minimum width and minimum height.
- `touch-target-inline` sets the minimum height and adds horizontal padding for text links; it does not independently guarantee a 44px minimum width.

Consumers must choose a layout that honors minimum sizes, such as `inline-flex`, `block`, or a grid item. Ordinary `display: inline` links ignore these minimum sizes. Neither utility sets display or alignment.

```txt
touch-target
touch-target-inline
```

## Preview

<div class="grid gap-4 sm:grid-cols-2">
  <button class="touch-target rounded-control border demo-control">
    44px target
  </button>
  <a class="inline-flex items-center touch-target-inline rounded-control border no-underline demo-control" href="#neo-brutal-pressable" style="color: var(--text-accent);">
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
