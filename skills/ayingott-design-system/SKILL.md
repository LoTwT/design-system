---
name: ayingott-design-system
description: Use this skill whenever you are building, mocking, or prototyping any UI surface — pages, components, slides, marketing one-pagers, blog layouts, settings screens, dashboards — that consumes `@ayingott/theme` or follows the Ayingott design language (calm, geometric, warm-cream-and-lavender). Trigger this skill any time the user mentions @ayingott/theme, ayingott design, ayingott.me, the lavender accent, or asks for an interface that should match the Ayingott brand voice — even when they do not explicitly ask for "the design system". The skill captures the V0 token contract, dark mode behavior, font opt-in, and voice rules so the output stays consistent across consumers.
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
| `@ayingott/theme/fonts.css` | `@font-face` declarations for Space Grotesk (variable, latin + latin-ext) and Space Mono (400/700). Opt-in. |
| `@ayingott/theme/fonts/<file>.woff2` | The woff2 files referenced by `fonts.css`. |

Anything not in this list is **not** part of the contract. Do not assume `@ayingott/theme/components`, `@ayingott/theme/icons`, or any other path exists.

Package contract details live in `packages/theme/README.md` and `AGENTS.md`. Read those if a task requires touching the package itself.

## Token layers

The theme is layered intentionally. Use the right layer for the right job.

### Foundation tokens (raw palette)

Defined in `packages/theme/src/foundation/`. Names like `--color-lavender-500`, `--color-mint-300`, `--spacing-4`, `--text-base`, `--shadow-md`, `--radius-card`, `--duration-normal`. Use these directly only when a specific hue or scale value is required regardless of theme — typically charts, decorative elements, or one-off graphics.

### Layer tokens (system primitives)

Defined in `packages/theme/src/layers/`. Names like `--z-header`, `--breakpoint-md`, `--container-reading`, `--grid-columns-page`, `--grid-gap-page`, `--touch-target-min`, `--opacity-overlay`, `--transition-interactive`. Use these directly when laying out structural concerns.

### Semantic CSS variables (the primary API)

Defined in `packages/theme/src/semantic/`. These are the variables you should reach for in 90% of consumer code, because they flip automatically under `.dark`.

| Variable | Use for |
| --- | --- |
| `--surface-canvas` | The page background. Warm cream in light, purple-tinged near-black in dark. |
| `--surface-panel` | Sidebars, secondary panels. |
| `--surface-elevated` | Cards. The only place pure white appears in V0 (light mode only). |
| `--surface-subtle` | Inset chips, hover backgrounds, code block panels. |
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

## Token usage rules

Always reach for semantic vars first. Drop down to foundation tokens only when there is no semantic variable that fits.

```css
/* Right */
.card {
  background: var(--surface-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

/* Wrong: hardcoded hex bypasses the dark-mode flip */
.card {
  background: #ffffff;
  color: #151310;
  border: 1px solid rgb(36 33 28 / 0.1);
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

## Fonts (opt-in)

Font files ship inside the npm package, but `@ayingott/theme` does not load `fonts.css` automatically. Webfonts are not loaded by default. To enable Space Grotesk and Space Mono in a consumer project, import `fonts.css` explicitly:

```css
@import "tailwindcss";
@import "@ayingott/theme/fonts.css";
@import "@ayingott/theme";
```

Without that `fonts.css` import, the `--font-display` and `--font-mono` token values keep their full fallback chains (Space Grotesk → system-ui / -apple-system / PingFang SC / Hiragino Sans GB / Microsoft YaHei / sans-serif; Space Mono → ui-monospace / SFMono-Regular / Cascadia Mono / Consolas / monospace). The browser will not load the Space Grotesk or Space Mono webfont, so it walks the chain to whichever system font matches first. This is intentional, not a regression.

Body text uses `--font-sans` = `system-ui` with PingFang SC / Hiragino Sans GB / Microsoft YaHei fallback for CJK. The theme does not bundle a body webfont — system fallback is the contract.

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
- **Cards** sit on `var(--surface-elevated)` with `border: 1px solid var(--border-subtle)` and `border-radius: var(--radius-card)` (`0.5rem`). Default shadow is `var(--shadow-card)`.
- **Primary buttons** use `background: var(--accent-primary)` + `color: var(--text-inverse)`, `border-radius: var(--radius-control)` (`0.375rem`), font family `var(--font-display)` weight 500, min-height `var(--touch-target-min)` (44px), `transition: var(--transition-interactive)`.
- **Hover** lifts: `transform: translateY(-1px); box-shadow: var(--shadow-md);`
- **Press** settles: `transform: translateY(0); box-shadow: var(--shadow-sm);`
- **Focus** is always visible. Use the `focus-ring` utility for buttons, `focus-ring-inset` for inputs. Never strip the outline.
- **Borders** are alpha derivatives, never solid grey. Default thickness is 1px (`thin`).
- **Type scale** is 13 steps from `--text-2xs` to `--text-7xl`; every step ships a paired `--text-{size}--line-height`. Use the paired line-height value, not a freehand number.
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
- **`prefers-reduced-motion` injection at the base layer.** The theme exposes motion tokens; the consumer applies reduced-motion media queries as appropriate.
- **Serif font.** Display = Space Grotesk; sans = system; mono = Space Mono. No `--font-serif` is shipped.

When you find yourself wanting to add one of these inside `@ayingott/theme`, stop and check with the user. The right move is almost always "implement it in the consumer project, not in the theme".

## Quick start template

When the user asks for a fresh page mock or prototype, this is the minimum scaffold:

The order matters: import Tailwind first, then `fonts.css` if fonts are wanted, then the theme. This matches the official package README.

```css
/* main.css */
@import "tailwindcss";
@import "@ayingott/theme/fonts.css";
@import "@ayingott/theme";

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
- `docs/decisions/index.md` — DS-D-01 through DS-D-06 design decisions.
- `packages/theme/README.md` — package consumer guide.
- `packages/theme/THIRD_PARTY_NOTICES.md` — font licensing.
- `AGENTS.md` and `CLAUDE.md` — repository-level agent guidance.
- Live showcase: https://design.ayingott.me

When the spec and this skill ever disagree, the spec wins. File a change to this skill.
