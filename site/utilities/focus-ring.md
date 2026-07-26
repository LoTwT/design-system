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
