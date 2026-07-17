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
- legal text, focus, status, and non-text contrast pairs, including separate conformance floors and release targets where required;
- explicit contrast exemptions with their applicable state, modes, reason, and standards references;
- showcase state selectors and their required semantic declarations; and
- the source files checked by `pnpm site:check`.

The verifier fails closed on an unknown mode, duplicate legal pair or exemption, missing or modified required exemption, missing or invalid required release target, unsupported color syntax, missing state selector, declaration drift, or contrast below the declared minimum or target.

## State model

Primary actions use separate foreground roles for default, hover, and active states. Neutral surfaces use `--focus-ring-*`; accent surfaces use `--focus-ring-on-accent-*`. Disabled controls use native disabled semantics plus text, surface, and border roles without relying on opacity alone. Their text and non-text contrast is explicitly recorded as an inactive-component exemption under WCAG 2.2 Success Criteria 1.4.3 and 1.4.11 rather than silently omitted from the legal-pair set.

Active normal-size `--text-muted` retains the WCAG 2.2 minimum of `4.5:1` and adds an internal release target of `5:1`, evaluated without rounding. The executable contract applies both thresholds to the current real active backgrounds: canvas, panel, and elevated in Paper and Ink. Paper uses the semantic direct literal `#6b6252`, producing `5.621166:1`, `5.869062:1`, and `6.010179:1`; Ink remains `#aa9e8b`, producing `7.157697:1`, `6.754477:1`, and `6.229389:1`.

`surface-subtle` is not a declared active muted pair until a real component needs it. `text-muted` on `surface-muted` remains limited to the native disabled state and its inactive-component exemption. The reading layer keeps its separate `--reading-fg-muted` mapping and is not governed by this role-specific target.

Status treatments use a five-part contract for each status: legacy accent, foreground, background, border, and a non-color text label in the consuming interface.

Ink warning intentionally retains the shipped `#ffdc7a` value (equal to decorative `--color-amber-200`). Matching numeric steps across decorative hue ramps is not a status contract invariant; each status foreground is instead verified against its paired background.

## Ink dependency policy

Ink mode values follow these dependency rules:

1. A public foundation token must be a stable physical token designed to remain mode-independent and to support direct consumer composition or generated utilities.
2. A value used only by the `.dark` semantic mapping remains a contract-owned direct literal in the semantic layer.
3. Equal values do not create a dependency. A semantic role may reference a decorative or foundation token only when both are intentionally versioned together and a change to either should update the other.
4. Public foundation names describe a stable physical family or scale and do not include the Paper or Ink mode name. The existing decorative `--color-ink-50` through `--color-ink-950` names and values remain unchanged.
5. A mode-agnostic foundation RFC is reconsidered only when a second mode or a real consumer needs the same raw physical colors or utilities and can define how those values should change together.

The Paper `--text-muted` literal does not change or alias public `--color-neutral-600`; the foundation ramp and generated utilities remain stable.

## Reading model

The reading layer keeps its existing Newsreader opt-in, `65ch` measure, scale, and paragraph rhythm. It adds explicit letter-spacing and focus aliases so long-form content can use the same Paper/Ink mode response without local values.

## Consumer boundary

Consumers activate Ink by applying `.dark` to an ancestor. They do not need a framework adapter. MIRU and ayingott.me compatibility is validated from the same packed tarball; this contract does not authorize consumer repository changes, release, publish, rollout, or settings writes.
