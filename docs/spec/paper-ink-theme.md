# Paper & Ink paired theme

Status: implemented contract

Paper & Ink is a paired semantic theme for `@ayingott/theme`. Paper is the default light mode on `:root`; Ink is the dark companion on `.dark`.

## Invariants

- Paper remains the default `:root` mapping.
- Ink remains the `.dark` override.
- Both modes use the same fonts, spacing, layout, component anatomy, radius, icons, copy, and interaction model.
- Only semantic color, border, accent, focus, status, reading, and depth responses change by mode.
- Existing package entry points, exports, public token names, and opt-in font behavior remain compatible.
- The theme adds no gradient, glow, glass, or blur treatment.

## Source of truth

The exact executable mapping is [`paper-ink-theme-contract.json`](./paper-ink-theme-contract.json). It defines:

- foundation and mode declarations;
- legal text, focus, status, and non-text contrast pairs;
- showcase state selectors and their required semantic declarations; and
- the source files checked by `pnpm site:check`.

The verifier fails closed on an unknown mode, duplicate legal pair, unsupported color syntax, missing state selector, declaration drift, or contrast below the declared threshold.

## State model

Primary actions use separate foreground roles for default, hover, and active states. Neutral surfaces use `--focus-ring-*`; accent surfaces use `--focus-ring-on-accent-*`. Disabled controls use text, surface, and border roles without relying on opacity alone.

Status treatments use a five-part contract for each status: legacy accent, foreground, background, border, and a non-color text label in the consuming interface.

## Reading model

The reading layer keeps its existing Newsreader opt-in, `65ch` measure, scale, and paragraph rhythm. It adds explicit letter-spacing and focus aliases so long-form content can use the same Paper/Ink mode response without local values.

## Consumer boundary

Consumers activate Ink by applying `.dark` to an ancestor. They do not need a framework adapter. MIRU and ayingott.me compatibility is validated from the same packed tarball; this contract does not authorize consumer repository changes, release, publish, rollout, or settings writes.
