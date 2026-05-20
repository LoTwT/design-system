# RFC 0002: reading token layer V0.1

## Status

Accepted for V0.1 implementation.

## Context

MIRU needs a long-form reading layer for its V0 document experience. The same
layer should also be reusable by ayingott.me blog pages and documentation
surfaces.

V0 already ships layout width tokens:

- `--container-reading: 42rem`
- `--layout-prose-width: var(--container-reading)`

Those remain layout/container primitives. V0.1 adds a font-relative reading
measure for body text:

- `--reading-measure: 65ch`

The two concepts intentionally coexist. Use `--layout-prose-width` to size a
page section or shell. Use `--reading-measure` for the long-form text column
inside that shell.

## Decisions

- Add `--font-reading` to `foundation/typography.css`.
- Add `--leading-reading: 1.7` to the existing leading scale.
- Add a new semantic partial: `semantic/reading.css`.
- Import `semantic/reading.css` through `index.css` after light/dark semantic
  variables, before utilities and base.
- Bundle Newsreader Latin and Latin Extended `opsz` variable normal files in
  `src/fonts/`.
- Keep fonts opt-in. `@ayingott/theme` must not import `fonts.css`.
- Do not bundle CJK serif fonts. CJK serif names stay as CSS fallback
  references only.
- Ship V0.1 as a minor additive package release.

## Token contract

`foundation/typography.css`:

```css
--font-reading: "Newsreader", Georgia, "Songti SC", "Noto Serif CJK SC", serif;
--leading-reading: 1.7;
```

`semantic/reading.css`:

```css
--reading-font-body: var(--font-reading);
--reading-font-heading: var(--font-reading);
--reading-font-mono: var(--font-mono);
--reading-measure: 65ch;
--reading-font-size: var(--text-lg);
--reading-line-height: var(--leading-reading);
--reading-paragraph-gap: 1.2em;
--reading-fg: var(--text-primary);
--reading-bg: var(--surface-canvas);
--reading-fg-muted: var(--text-secondary);
--reading-link: var(--text-accent);
--reading-link-hover: var(--accent-primary-active);
--reading-accent: var(--accent-primary);
--reading-code-fg: var(--text-primary);
--reading-code-bg: var(--surface-subtle);
--reading-rule: var(--border-subtle);
--reading-scale-h1: var(--text-3xl);
--reading-scale-h2: var(--text-2xl);
--reading-scale-h3: var(--text-xl);
--reading-scale-h4: var(--text-lg);
```

Dark mode reuses existing semantic overrides. The only reading-specific dark
override is `--reading-link-hover: var(--color-lavender-200)`.

## Accessibility gate

Reading body links must satisfy WCAG AA for normal text. `--reading-link` uses
`--text-accent`, not `--accent-primary`, because current light-mode
`--accent-primary` has insufficient contrast on `--surface-canvas`.

Current expected contrast ratios:

| Pair | Ratio |
| --- | ---: |
| `--reading-fg` on `--reading-bg`, light | >= 4.5:1 |
| `--reading-fg-muted` on `--reading-bg`, light | >= 4.5:1 |
| `--reading-link` on `--reading-bg`, light | >= 4.5:1 |
| `--reading-code-fg` on `--reading-code-bg`, light | >= 4.5:1 |
| `--reading-fg` on `--reading-bg`, dark | >= 4.5:1 |
| `--reading-fg-muted` on `--reading-bg`, dark | >= 4.5:1 |
| `--reading-link` on `--reading-bg`, dark | >= 4.5:1 |
| `--reading-code-fg` on `--reading-code-bg`, dark | >= 4.5:1 |

`pnpm check` enforces these ratios in the package smoke test.

## Consumer recipe

Long-form surfaces should constrain body copy with the reading measure while
remaining mobile-safe:

```css
.reading-body {
  max-inline-size: min(100%, var(--reading-measure));
  font-family: var(--reading-font-body);
  font-size: var(--reading-font-size);
  line-height: var(--reading-line-height);
  color: var(--reading-fg);
}
```

Use `--container-reading` or `--layout-prose-width` for page-level layout
containers, not as a substitute for the text measure.

## Verification gate

V0.1 PRs must pass:

```bash
pnpm check
git diff --check
```

`pnpm check` must prove:

- Tailwind emits `font-reading`.
- The package output contains `--font-reading`, `--leading-reading`, and
  `--reading-*` variables.
- `fonts.css` emits Newsreader `@font-face` declarations.
- `pnpm pack --dry-run` includes Newsreader `.woff2` files and
  `THIRD_PARTY_NOTICES.md`.
- Reading foreground, muted foreground, link, and code text pass 4.5:1 contrast
  in light and dark mode.
