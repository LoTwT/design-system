# Package Contract

`@ayingott/theme` V0 exposes four public entries:

```json
{
  ".": "./src/index.css",
  "./index.css": "./src/index.css",
  "./fonts.css": "./src/fonts.css",
  "./fonts/*": "./src/fonts/*"
}
```

## In Scope

- Foundation tokens through Tailwind CSS v4 `@theme static`.
- Runtime semantic variables through `:root` and `.dark`.
- Base styles.
- Focus and touch target utilities.
- Optional self-hosted font assets.

## Out of Scope

- Component primitives.
- Vue or Nuxt adapters.
- Reka UI or other UI framework integration.
- Playground, live editor, and visual regression tooling.
- Real ayingott.me consumer validation.

The long-form source-of-truth documents remain in `/docs`: RFCs, decision records, and the V1 spec.
