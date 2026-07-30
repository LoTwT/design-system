## 0.2.0 - 2026-07-30

### Added

- Add experience baseline safeguards (#28)
- Add Paper and Ink paired theme (#36)
- Add opt-in Neo-Brutalism family (#39)
- Add Theme Family switch (#42)
- Add cross-family border structure roles (#43)
- Improve release readiness (#45)
- Neutralize Paper surfaces, de-yellow Neo palette, and swap bundled fonts (#46)
- Remap Neo chrome and regroup the Theme Family switch (#47)

### Changed

- Harden registry smoke propagation
- Harden publish trust boundaries (#23)
- Add stable verifier checks (#27)

### Documentation

- Fix focus ring preview
- Record phase 5 readiness boundaries (#33)
- Record Dependabot settings readback (#35)
- Record Ink dependency policy (#37)
- Clarify Neo consumer boundaries (#40)
- Record main ruleset removal and promote AGENTS.md as the primary guide (#44)
- Archive design-qa snapshot and record documentation lifecycle (#48)

### Fixed

- Enforce accessible CTA contrast (#24)
- Enforce real tarball contract (#26)
- Increase muted text headroom (#38)
- Preserve dark semantic preview in light mode (#50)
- Derive registry smoke fonts from package (#51)
- Unblock v0.2 release gates (#52)

## Unreleased

### Added

- Add `--border-width-surface` and `--border-width-control` as public foundation structure roles that default to `--border-width-thin` and remap to `--border-width-heavy` under `.brutal`.
- Add the executable Paper & Ink paired-theme contract, legal contrast pairs, and showcase state coverage.
- Add semantic foreground/background/border status roles, accent-surface focus roles, and reading focus/letter-spacing aliases.

### Changed

- Refine the default Paper foundation ramp and semantic action states while preserving `:root`, `.dark`, public token names, package exports, and opt-in fonts.
- Flatten semantic card and panel depth in Ink and add a responsive paired-theme showcase.
- Increase Paper active muted-text headroom with a semantic direct literal and enforce a separate `5:1` release target across canvas, panel, and elevated surfaces in both modes.

### Migration

- Replace `var(--border-width-surface, var(--border-width-thin))` and `var(--border-width-control, var(--border-width-thin))` with direct references to `var(--border-width-surface)` and `var(--border-width-control)`. No fallback is required because both roles now resolve in every theme family.

## 0.1.0 - 2026-05-20

### Added

- Add reading token layer (#20)

### Changed

- Increase release smoke retry budget (#19)

## 0.0.4 - 2026-05-12

### Changed

- Retry npm install with backoff to handle CDN propagation (#13)
- Migrate release flow to v3 runbook (#17)

### Documentation

- Record DS-D-10 V0.0.x auto-publish + tag-protection (#14)
- Add from-zero-to-shipped runbook (#15)
- Mark runbook canonical location at LoTwT/ai (#16)

### Fixed

- Align trusted publishing release flow (#18)

## 0.0.2

Patch — scope focus-ring utilities to `:focus-visible`.

- `focus-ring` and `focus-ring-inset` utilities now apply only when the element matches `:focus-visible`, matching the existing `base.css` `:focus-visible` outline rule and the documented intent. Previously the styles applied whenever the class was present, which produced an always-on ring during mouse-driven focus (observed downstream in the `ayingott.me` consumer).
- No changes to tokens, semantic variables, base styles, fonts, or package exports.
- Consumers that previously relied on the unintended always-on behavior must add their own outline declaration.

## 0.0.1

Initial technical release for `@ayingott/theme`.

- Ships the Tailwind CSS v4 CSS-first theme entry through `@ayingott/theme` and `@ayingott/theme/index.css`.
- Ships optional self-hosted font loading through `@ayingott/theme/fonts.css` and `@ayingott/theme/fonts/*`.
- Includes foundation tokens, semantic runtime variables, base styles, focus-ring utilities, and touch-target utilities.
- Keeps V0 intentionally theme-only: no component primitives, Vue package, adapters, playground, or fixtures.
