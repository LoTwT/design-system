# Package Contract

> [!IMPORTANT]
> This page describes the current `main` branch. npm `latest` is `0.1.0` and does not include the `./brutal.css` export yet.

`@ayingott/theme` on `main` exposes five public entries:

```json
{
  ".": "./src/index.css",
  "./index.css": "./src/index.css",
  "./brutal.css": "./src/brutal.css",
  "./fonts.css": "./src/fonts.css",
  "./fonts/*": "./src/fonts/*"
}
```

## Consumer Requirements

- Tailwind CSS `^4.0.0` is a required peer dependency.
- The default `@ayingott/theme` entry does not load bundled fonts; consumers opt in through `@ayingott/theme/fonts.css`.
- The default entry does not load Neo-Brutalism; after its package release, consumers opt in by importing `@ayingott/theme/brutal.css` after the default entry.

## In Scope

- Foundation tokens through Tailwind CSS v4 `@theme static`.
- Runtime semantic variables through `:root` and `.dark`, including the V0.1 long-form `--reading-*` layer.
- Base styles.
- Focus and touch target utilities.
- Opt-in Neo-Brutal Light/Dark semantic mappings, hard shadows, structure role remapping, and the scoped pressable utility through `brutal.css`.
- Optional self-hosted font assets for Bricolage Grotesque, Space Mono, and Literata.

The semantic roles and the `--border-width-surface` / `--border-width-control` structure roles are consumer-facing. The family-local `--brutal-*` palette variables are contract-owned implementation details and are not a consumer direct-use API.

## Out of Scope

- Component primitives.
- Vue or Nuxt adapters.
- Reka UI or other UI framework integration.
- Playground, live editor, and visual regression tooling.
- Committed ayingott.me adoption or family persistence.

The long-form source-of-truth documents remain in `/docs`: RFCs, decision records, and the V1 spec.
