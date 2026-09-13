# Focus Ring

V0 ships two focus utilities:

```txt
focus-ring
focus-ring-inset
```

## Preview

<div class="grid gap-4 sm:grid-cols-2">
  <button class="theme-action focus-ring-preview">
    focus-ring
  </button>
  <button class="theme-action focus-ring-preview focus-ring-preview--inset">
    focus-ring-inset
  </button>
</div>

The page forces the ring shape for inspection. In products, the utilities apply
only on `:focus-visible` so mouse interaction does not leave a persistent ring.

## Keyboard behavior

<div class="grid gap-4 sm:grid-cols-2">
  <button class="theme-action focus-ring">
    Tab focus-ring
  </button>
  <button class="theme-action focus-ring-inset">
    Tab focus-ring-inset
  </button>
</div>

Use keyboard navigation to inspect the real utility behavior. These controls
render the ring only when they match `:focus-visible`.

Both utilities retain their offsets under `prefers-contrast: more`, increase the outline to 3px, and remove the shadow. Under forced colors they use the system Highlight outline. These fallbacks also apply when the utility is used through Tailwind variants or `@apply`.
