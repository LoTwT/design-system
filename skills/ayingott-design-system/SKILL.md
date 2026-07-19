---
name: ayingott-design-system
description: Use this skill whenever you are building, mocking, or prototyping any UI surface — pages, components, slides, marketing one-pagers, blog layouts, settings screens, dashboards — that consumes `@ayingott/theme` or follows the Ayingott design language. Trigger this skill any time the user mentions @ayingott/theme, ayingott design, ayingott.me, the default Paper/Ink family, the opt-in Neo-Brutalism family, or asks for an interface that should match the Ayingott brand voice. The skill captures the theme-only contract, scheme and family selectors, font opt-in, and voice rules so output stays consistent across consumers.
---

# Ayingott Design System

`@ayingott/theme` is a CSS-first, Tailwind v4, framework-agnostic design token package. V0 ships **theme tokens only** — no components, no icons, no framework adapters, no imagery.

This skill exists so any AI agent that helps a user consume `@ayingott/theme` produces output aligned with the V0 contract instead of guessing at token names, inventing new ones, or drifting in voice.

If the user gives you their own conflicting instruction (e.g. "use a blue accent here"), follow the user. The rules below are the defaults when the user has not said otherwise.

## When to use this skill

Trigger this skill when the user:

- Is integrating `@ayingott/theme` into a new project, or scaffolding a page in ayingott.me itself.
- Is asking you to write CSS, JSX, Vue templates, or HTML mocks that should "look like ayingott".
- Mentions tokens like `--surface-canvas`, `--text-primary`, `--accent-primary`, or the lavender brand color.
- Asks for slides, marketing pages, blog post layouts, or any visual artifact in the Ayingott style.

Do not trigger this skill for:

- Generic CSS/Tailwind questions unrelated to Ayingott.
- Requests that explicitly ask for a different design language (Material, Apple HIG, Bootstrap, …).

## V0 contract — what the package guarantees

Public CSS exports:

| Path | What it is |
| --- | --- |
| `@ayingott/theme` (or `@ayingott/theme/index.css`) | All foundation tokens, layer tokens, semantic vars (`:root` + `.dark`), focus and touch-target utilities, and base styles. Does **not** auto-import fonts. |
| `@ayingott/theme/brutal.css` | Opt-in Neo-Brutal Light/Dark semantic mappings, zero-blur hard shadows, structure roles, and the scoped `pressable` utility. Import after the default entry. |
| `@ayingott/theme/fonts.css` | `@font-face` declarations for Space Grotesk (variable, latin + latin-ext), Space Mono (400/700), and Newsreader (variable opsz/wght, latin + latin-ext). Opt-in. |
| `@ayingott/theme/fonts/<file>.woff2` | The woff2 files referenced by `fonts.css`. |

Anything not in this list is **not** part of the contract. Do not assume `@ayingott/theme/components`, `@ayingott/theme/icons`, or any other path exists.

Package contract details live in `packages/theme/README.md` and `CLAUDE.md`. Read those if a task requires touching the package itself.

## Token layers

The theme is layered intentionally. Use the right layer for the right job.

### Foundation tokens (raw palette)

Defined in `packages/theme/src/foundation/`. Names like `--color-lavender-500`, `--color-mint-300`, `--spacing-4`, `--text-base`, `--shadow-md`, `--radius-card`, `--duration-normal`. Use these directly only when a specific hue or scale value is required regardless of theme — typically charts, decorative elements, or one-off graphics.

### Layer tokens (system primitives)

Defined in `packages/theme/src/layers/`. Names like `--z-header`, `--breakpoint-md`, `--container-reading`, `--grid-columns-page`, `--grid-gap-page`, `--touch-target-min`, `--opacity-overlay`, `--transition-interactive`. Use these directly when laying out structural concerns.

### Semantic CSS variables (the primary API)

Defined in `packages/theme/src/semantic/`. These are the variables you should reach for in 90% of consumer code. `.dark` changes the scheme; the optional `.brutal` class changes the family.

| Variable | Use for |
| --- | --- |
| `--surface-canvas` | The page background. Warm cream in light, purple-tinged near-black in dark. |
| `--surface-panel` | Sidebars, secondary panels. |
| `--surface-elevated` | Cards. The only place pure white appears in V0 (light mode only). |
| `--surface-subtle` | Inset chips, hover backgrounds, code block panels. The exact alpha and visual weight are family-relative. |
| `--surface-muted` | Borders or backgrounds that need slightly more contrast than `subtle`. |
| `--text-primary` | All body and heading text. |
| `--text-secondary` | Captions, supporting prose. |
| `--text-muted` | De-emphasized labels, helper text. |
| `--text-inverse` | Text on solid `--accent-primary` surfaces (e.g. button labels). |
| `--text-accent` | Hyperlinks and inline emphasis. Lavender-700 in light, lavender-300 in dark. |
| `--border-subtle` | Default divider weight. Alpha-on-cream in light, alpha-on-warm-white in dark. |
| `--border-default` | Card outlines. |
| `--border-strong` | Outline buttons, focus emphasis. |
| `--accent-primary` | Primary brand surfaces (CTA backgrounds, active toggle, brand decoration). |
| `--accent-primary-hover` / `-active` | Primary surface state changes. |
| `--accent-soft` | Tinted-lavender backgrounds (selection highlight, soft callouts). |
| `--accent-contrast` | Text or icons on `--accent-soft`. |
| `--focus-ring-color` / `--focus-ring-shadow` | Focus indicator. |
| `--status-success` / `-warning` / `-danger` / `-info` | State communication. Mirror decorative hues mint / amber / rose / sky. |

Full list: see `references/tokens.md`.

Use `--text-muted` for active muted UI copy such as metadata and helper text. Physical color utilities remain available for decorative or explicitly fixed-color work, but do not substitute them for semantic copy by default. Names such as `subtle`, `muted`, and `soft` express intent within the active family; they do not guarantee equal alpha, literal color, or visual weight across families.

### Reading semantic variables

V0.1 adds a long-form reading layer in `packages/theme/src/semantic/reading.css`.
Use it for article, documentation, and MIRU-style reading surfaces:

| Variable | Use for |
| --- | --- |
| `--reading-font-body` / `--reading-font-heading` | Long-form serif body and heading family. |
| `--reading-measure` | Font-relative body measure (`65ch`). Use `max-inline-size: min(100%, var(--reading-measure))` for mobile safety. |
| `--reading-font-size` / `--reading-line-height` / `--reading-paragraph-gap` | Long-form type rhythm. |
| `--reading-fg` / `--reading-bg` / `--reading-fg-muted` | Reading text and background colors. |
| `--reading-link` / `--reading-link-hover` | Reading links. `--reading-link` uses `--text-accent`, not `--accent-primary`, to pass AA on the light canvas. |
| `--reading-code-fg` / `--reading-code-bg` / `--reading-rule` | Inline code, code panels, and rules inside reading surfaces. |

`--container-reading` and `--layout-prose-width` are layout-width tokens. `--reading-measure` is the body-text measure. Do not substitute one for the other.

## Token usage rules

Always reach for semantic vars first. Drop down to foundation tokens only when there is no semantic variable that fits.

```css
/* Right */
.card {
  background: var(--surface-elevated);
  color: var(--text-primary);
  border: var(--border-width-surface, var(--border-width-thin)) solid var(--border-subtle);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

/* Wrong: hardcoded hex bypasses the dark-mode flip */
.card {
  background: #ffffff;
  color: #191713;
  border: 1px solid rgb(25 23 19 / 0.1);
}
```

Never invent new tokens to fill a gap. If you find that no existing token expresses the intent, raise it as a spec question instead of declaring a local variable that will drift.

Never use bare hex from the lavender / mint / sky / amber / rose / ink families inside component styles. The decorative palettes exist for charts and ornamental marks; semantic vars cover the rest.

## Dark mode

The theme defines a custom variant:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

Theme switching is driven by the `.dark` class on `<html>`. The package does **not** subscribe to `prefers-color-scheme`. Consumers own the toggle UX.

Minimal toggle:

```js
document.documentElement.classList.toggle("dark");
```

If the consumer wants to honor system preference, write that wiring on the consumer side. Do not modify the package.

When you write component styles, you almost never need a `.dark` block of your own. Semantic vars flip automatically. Only write a `.dark` override when a specific property cannot use a semantic var (rare).

## Neo-Brutalism family (opt-in)

Import the family after the default theme:

```css
@import "tailwindcss";
@import "@ayingott/theme";
@import "@ayingott/theme/brutal.css";
```

The selector matrix is orthogonal:

| Family | Scheme | Effective theme |
| --- | --- | --- |
| default | light | Paper |
| default | `.dark` | Ink |
| `.brutal` | light | Neo Light |
| `.brutal` | `.dark` | Neo Dark |

Place the family and scheme classes together on the same theme root:

```html
<html class="brutal dark">
```

V0 supports these four co-located root states. Arbitrary mixed nested theme islands are unsupported because splitting `.brutal` and `.dark` across nested scopes can produce an uncontracted hybrid mapping.

The family keeps the semantic API and component anatomy. It maps card/control radius to zero, card/panel depth to zero-blur hard shadows, and exposes `--border-width-surface` / `--border-width-control`. Use fallbacks when the same consumer CSS must work without the family:

```css
.card {
  border: var(--border-width-surface, var(--border-width-thin)) solid var(--border-default);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}
```

Importing `brutal.css` defines `--shadow-hard-color` and the `--shadow-hard-sm` / `md` / `lg` size tokens at `:root`. Those physical tokens and the three size utilities are entry-global after import. The surface/control width roles remain scoped to `.brutal`. If a family-scoped role is missing and its `var()` has no fallback, the containing declaration becomes invalid at computed-value time. The declaration behaves as `unset`: an inherited property inherits, while a non-inherited property takes its initial value. An earlier cascaded declaration is not revived.

Do not consume the family-local `--brutal-*` palette variables directly. They are contract-owned implementation details used to map the public semantic roles.

Use `pressable` only with the opt-in entry and compose accessibility utilities:

```html
<button class="pressable focus-ring touch-target">Action</button>
```

`pressable` excludes disabled movement and owns a local reduced-motion and forced-colors fallback. Consumers still own family persistence and initial class placement. Removing `.brutal` is the clean fallback to Paper or Ink.

## Fonts (opt-in)

Font files ship inside the npm package, but `@ayingott/theme` does not load `fonts.css` automatically. Webfonts are not loaded by default. To enable Space Grotesk, Space Mono, and Newsreader in a consumer project, import `fonts.css` explicitly:

```css
@import "tailwindcss";
@import "@ayingott/theme/fonts.css";
@import "@ayingott/theme";
```

Without that `fonts.css` import, the `--font-display`, `--font-mono`, and `--font-reading` token values keep their full fallback chains. The browser will not load the Space Grotesk, Space Mono, or Newsreader webfont, so it walks the chain to whichever system font matches first. This is intentional, not a regression.

Body text uses `--font-sans` = `system-ui` with PingFang SC / Hiragino Sans GB / Microsoft YaHei fallback for CJK. The theme does not bundle a body webfont — system fallback is the contract.

Long-form reading text uses `--font-reading` through the `--reading-font-body` token. Newsreader covers latin / latin-ext when `fonts.css` is imported; CJK serif fonts are fallback names only and are not bundled.

## Voice and tone

Match the contractual register the rest of the repo uses. The brand asserts itself through restraint, not adjectives.

- Plain and contractual. State a fact and stop.
- Sentence case for headings ("Getting started", not "Getting Started").
- Third person and imperative. "V0 uses a `.dark` class." Avoid "we".
- No emoji. Anywhere.
- No exclamation points.
- No marketing words: avoid "delightful", "powerful", "beautiful", "seamless", "magical".
- No hedging. If something is intentionally narrow, say so once and move on.
- Bilingual is acceptable. Long-form spec is mostly Chinese; package docs are English. Keep the same flat tone in either language.
- Code spans for tokens and paths in prose: `--surface-canvas`, `packages/theme/src/`.

If output reads like product marketing copy, rewrite it.

## Visual rules

When producing visual artifacts (mockups, slides, prototype HTML), follow these defaults. They mirror what the V0 deployment at https://design.ayingott.me demonstrates.

- **Page background is warm cream**, not grey, not pure white. Use `var(--surface-canvas)`.
- **Cards** sit on `var(--surface-elevated)` with `border: var(--border-width-surface, var(--border-width-thin)) solid var(--border-subtle)`, `border-radius: var(--radius-card)`, and `box-shadow: var(--shadow-card)`. Paper/Ink resolve to the existing soft anatomy; Neo resolves to a 3px border, zero radius, and hard depth.
- **Primary buttons** use `background: var(--accent-primary)` + `color: var(--text-inverse)`, `border-radius: var(--radius-control)` (`0.375rem`), font family `var(--font-display)` weight 500, min-height `var(--touch-target-min)` (44px), `transition: var(--transition-interactive)`.
- **Paper/Ink hover** may lift by `translateY(-1px)` with `var(--shadow-md)` when the consumer owns that interaction.
- **Neo press feedback** uses the shipped `pressable` utility; do not reproduce its movement locally.
- **Focus** is always visible. Use the `focus-ring` utility for buttons, `focus-ring-inset` for inputs. Never strip the outline.
- **Paper/Ink borders** are alpha derivatives at the default 1px (`thin`) thickness. **Neo borders** use the opt-in structure width roles and semantic ink color.
- **Type scale** is 13 steps from `--text-2xs` to `--text-7xl`; every step ships a paired `--text-{size}--line-height`. Use the paired line-height value, not a freehand number.
- **Long-form reading** uses the `--reading-*` semantic layer. Constrain body copy with `max-inline-size: min(100%, var(--reading-measure))`; use `--container-reading` / `--layout-prose-width` for the outer shell.
- **Display headlines** (Space Grotesk) lean tight: `letter-spacing` `tight` to `tighter`. **Mono labels** (Space Mono) lean wide: `letter-spacing` `wide` to `widest`.
- **Backgrounds** are flat warm cream surfaces. No gradients, no images, no patterns, no textures.
- **Decorative motif**: dots, lines, outlined circles, rotated squares — geometric primitives in `var(--accent-primary)`. Use sparingly at corners or section breaks; never as pattern fills or full bleed.

## Out of scope — do not invent these

V0 deliberately excludes the following. If the user asks for something here, surface the gap rather than fabricating a token, component, or asset.

- **Component library.** No `Button`, `Card`, `Modal`, `Nav`, etc. exported by the package. Build components on top of the tokens; the consumer owns components.
- **Icon library.** V0 ships zero icon assets and **does not recommend a specific library**. If the consumer needs icons, they pick. Do not write "use Lucide" or any other library as if the design system blessed it.
- **Logo / wordmark / brand mark.** Not part of the design system. ayingott personal branding lives in the ayingott.me project, not in `@ayingott/theme`.
- **Framework adapter.** No `@ayingott/theme/vue`, `/react`, `/svelte`. Consumers wire the CSS imports themselves.
- **Imagery, illustrations, gradients, patterns.** The visual rhythm is type + space + sparse geometry only.
- **Global `prefers-reduced-motion` injection at the base layer.** The default entry exposes motion tokens; the consumer handles its own animations. The scoped Neo `pressable` fallback is the only package-owned exception.
- **Component-level type-role tokens.** The theme ships family, scale, leading, and reading tokens. It does not ship `--type-h1`, `--type-meta`, or component-specific typography bundles.

When you find yourself wanting to add one of these inside `@ayingott/theme`, stop and check with the user. The right move is almost always "implement it in the consumer project, not in the theme".

## Quick start template

When the user asks for a fresh page mock or prototype, this is the minimum scaffold:

The order matters: import Tailwind first, then `fonts.css` if fonts are wanted, then the theme. This matches the official package README.

```css
/* main.css */
@import "tailwindcss";
@import "@ayingott/theme/fonts.css";
@import "@ayingott/theme";
/* Optional family: @import "@ayingott/theme/brutal.css"; */

body { padding: var(--layout-page-gutter); }

.hero h1 {
  font-family: var(--font-display);
  font-size: var(--text-5xl);
  line-height: var(--text-5xl--line-height);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
}
```

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<link rel="stylesheet" href="./main.css" />
</head>
<body>
  <main class="hero">
    <h1>Ayingott design system</h1>
    <p style="color: var(--text-secondary); max-width: var(--container-reading);">
      A calm, geometric, warm-cream-and-lavender design language.
    </p>
  </main>
  <script>
    // Optional dark-mode toggle
    document.documentElement.classList.toggle("dark");
  </script>
</body>
</html>
```

## Reference material in this skill

- `references/tokens.md` — every semantic var and the foundation tokens that back it. Read this when you need to look up an exact name or fallback chain.
- `references/voice-examples.md` — short before/after rewrites that demonstrate the voice rules. Read this when a draft feels off-tone.

## Authoritative sources outside the skill

These live in the design-system repository. Read them when the skill is not enough.

- `docs/spec/design-system-v1.0.md` — the V0 contract, including the §8 contrast table and §13 alignment notes.
- `docs/rfc/0001-theme-v0.md` — the implementation RFC.
- `docs/rfc/0002-reading-token-layer-v0.1.md` — the reading token layer RFC.
- `docs/spec/rfc-brutal-theme.md` — the accepted Neo-Brutalism family RFC.
- `docs/spec/brutal-theme-contract.json` — the executable family declarations, invariants, and legal pairs.
- `docs/decisions/index.md` — DS-D-01 through DS-D-11 design decisions.
- `packages/theme/README.md` — package consumer guide.
- `packages/theme/THIRD_PARTY_NOTICES.md` — font licensing.
- `CLAUDE.md` — repository-level agent guidance.
- Live showcase: https://design.ayingott.me

When the spec and this skill ever disagree, the spec wins. File a change to this skill.
