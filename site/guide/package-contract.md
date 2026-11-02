# Package contract

`@ayingott/theme` exposes five public entries:

```json
{
  ".": "./src/index.css",
  "./index.css": "./src/index.css",
  "./brutal.css": "./src/brutal.css",
  "./fonts.css": "./src/fonts.css",
  "./fonts/*": "./src/fonts/*"
}
```

## Consumer requirements

- Tailwind CSS `^4.0.0` is a required peer dependency.
- The default `@ayingott/theme` entry does not load bundled fonts; consumers opt in through `@ayingott/theme/fonts.css`.
- The default entry does not load Neo-Brutalism; consumers opt in by importing `@ayingott/theme/brutal.css` after the default entry.

## In scope

- Foundation tokens through Tailwind CSS v4 `@theme static`.
- Runtime semantic variables through `:root` and `.dark`, including the V0.1 long-form `--reading-*` layer.
- Base styles.
- Focus and touch target utilities.
- Opt-in Neo-Brutal Light/Dark semantic mappings, hard shadows, structure role remapping, and the scoped pressable utility through `brutal.css`.
- Optional self-hosted font assets for Bricolage Grotesque, Space Mono, Literata, and original LXGW WenKai (`400` / `500` for Chinese text).

The semantic roles and the `--border-width-surface` / `--border-width-control` structure roles are consumer-facing. The family-local `--brutal-*` palette variables are contract-owned implementation details and are not a consumer direct-use API.

## Out of scope

- Component primitives.
- Vue or Nuxt adapters.
- Reka UI or other UI framework integration.
- Playground, live editor, and visual regression tooling.
- ayingott.me adoption, and persisting the selected family (this site's family switch is display-only).

The long-form source-of-truth documents remain in `/docs`: RFCs, decision records, and the V1 spec.
