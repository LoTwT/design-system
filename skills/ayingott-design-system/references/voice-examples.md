# Voice examples

Short before/after rewrites that demonstrate the Ayingott voice rules. Read this when a draft you have written feels off-tone or marketing-flavored.

## Headings

| Wrong | Right |
| --- | --- |
| `Getting Started!` | `Getting started` |
| `THE TOKEN SYSTEM` | `Token system` |
| `Beautiful Type Scale` | `Type scale` |
| `Welcome to Ayingott!` | `Ayingott` |

Headings are nouns in sentence case. No emoji, no exclamation points, no superlatives.

## Body prose

**Wrong**
> We've crafted a delightful and powerful design system that brings warmth and personality to your projects. With our beautiful warm-cream palette and seamless dark mode, you'll be shipping amazing interfaces in no time!

**Right**
> The design system ships warm-cream surfaces, a lavender accent, and a `.dark` class that flips semantic variables. Components are out of scope for V0.

The right version states facts and stops. No "we", no "you", no superlatives, no exclamation point, no hedging.

## Decision records and changelog entries

**Wrong**
> We're really excited to announce that we've decided to go with Tailwind v4 — it's going to enable so many great things going forward. The team had a lot of fun exploring the options.

**Right**
> Tailwind v4 is the build target. Decision DS-D-02. CSS-first `@theme` directive removes the JS config layer; `@theme static` prevents pruning of unused token vars.

State the decision, the identifier, and the technical reason. The reader does not need the team's emotional state.

## Errors and edge cases

**Wrong**
> Oops! It looks like the font failed to load. Don't worry — we'll automatically fall back to a great system font!

**Right**
> If `fonts.css` is not imported, `--font-display` and `--font-mono` fall back to system equivalents. This is intentional, not a regression.

Even error states stay flat. Apologies and reassurance read as marketing on this brand.

## Component documentation

**Wrong**
> Buttons are super flexible! You can use them anywhere — they automatically adapt to any context with our magical variant system.

**Right**
> A primary button uses `var(--accent-primary)` background and `var(--text-inverse)` text. Hover lifts (`translateY(-1px)`, `--shadow-md`); press settles. Min-height matches `--touch-target-min`.

Describe the contract, not the feeling.

## What "third-person imperative" looks like

| First person plural (avoid) | Third-person / imperative (use) |
| --- | --- |
| "We use a `.dark` class for dark mode." | "V0 uses a `.dark` class for dark mode." |
| "We don't ship any icons." | "The package ships zero icon assets." |
| "Our tokens are organized in three layers." | "Tokens are organized in three layers: foundation, layer, semantic." |
| "Let's import the theme:" | "Import the theme:" |

The voice is a contract document, not a tour.

## Bilingual prose

Chinese long-form content stays in the same flat tone:

**Wrong**
> 我们打造了一套美轮美奂的设计系统，让你的产品体验丝滑流畅！

**Right**
> V0 仅交付 `@ayingott/theme` token 包，不含组件、不含图标库、不含框架适配。详见 spec §13。

Code spans, token names, and path references stay in their original Latin form even inside Chinese prose: `--surface-canvas` / `packages/theme/src/`.
