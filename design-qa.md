# Paper & Ink design QA

## Source references

- `paper-ink-light-default-final.png` (1440 x 1024)
- `paper-ink-dark-companion-final.png` (1440 x 1024)
- `design-system-paper-ink-paired-theme-spec.zh-CN.md`
- Executable mapping: `docs/spec/paper-ink-theme-contract.json`

The approved source board and implementation were placed in the same comparison
input at 1440 x 1024 for both modes:

- `comparison-paper-source-implementation-1440x1024.png`
- `comparison-ink-source-implementation-1440x1024.png`

## Required matrix

| Mode | 1440 x 1024 comparison | 1280 x 800 | 390 x 844 | 320 x 844 |
| --- | --- | --- | --- | --- |
| Paper (`:root`) | Passed | Passed | Passed | Passed |
| Ink (`.dark`) | Passed | Passed | Passed | Passed |

Desktop and mobile evidence includes viewport and full-page captures. The
1280 x 800 and 390 x 844 matrices also include actual input focus captures in
both modes. The built preview was checked separately in a fresh tab.

## Interaction and state checks

- Primary action hover visibly changes the accent while retaining readable
  foreground contrast in Paper and Ink.
- Disabled action is programmatically disabled and visually distinct without
  depending on color alone.
- The selected control remains checked in both modes.
- The actual text input receives a solid focus outline and visible focus shadow
  in both modes.
- Success, warning, and danger examples each retain distinct foreground,
  background, border, and text labels.
- Primary, disabled, and input controls remain at least 44 px high on mobile.
- The mobile `On this page` control itself is 44 px high at 390 and 320 px.
- Saved and all four status roles use distinct Lucide icons with one shared
  16 px anatomy in both modes.
- Paper and Ink have no horizontal overflow at 1440, 1280, 390, or 320 px.
- A fresh built-preview tab reported zero console errors.
- Package fallbacks cover forced colors and increased contrast. Reduced-motion
  behavior remains consumer-owned; the VitePress consumer retains its exact
  appearance/action override.

## Active muted-text headroom

- Normal-size active `--text-muted` keeps the WCAG `4.5:1` conformance floor
  and adds a separate unrounded `5:1` release target.
- Paper `#6b6252` passes canvas, panel, and elevated at `5.621166:1`,
  `5.869062:1`, and `6.010179:1`. Ink is unchanged and passes the same
  surfaces at `7.157697:1`, `6.754477:1`, and `6.229389:1`.
- Paper/Ink desktop and mobile before/after captures cover muted page metadata,
  placeholders, and the disabled control. Paper retains a clear hierarchy
  below secondary text; Ink is pixel-identical before/after.
- `surface-subtle` is not declared as an active muted pair. The native disabled
  muted-on-muted state remains an inactive-component exemption, and reading
  tokens remain unchanged.

## Iteration history

| Iteration | Finding | Resolution |
| --- | --- | --- |
| 0 | P1: sparse card-heavy composition and an open mobile-menu artifact diverged from the source | Rebuilt the page as an unframed document layout and captured a clean mobile state |
| 1 | P1: main-column x/y rhythm and section density were misaligned; P2: the brand mark was undersized | Matched the source gutter, rules, section rhythm, and 44 x 29 logo treatment |
| 2 | P1: Interaction and Token source did not fully enter the 1440 reference frame | Compacted the action/status matrix and aligned the source-size vertical rhythm |
| 3 | P1: the 320 px header overflowed to 369 px | Hid only the long brand label below 350 px while retaining the `Lo` mark; Paper and Ink now report `scrollWidth === 320` |
| 4 | Quality P1: package reduced-motion scope contradicted the public spec; mapping/pair verification trusted self-reported data. Experience P2: saved/status icons were missing and the mobile `On this page` button was only 24 px high | Removed the package override, pinned the exact required ID sets and payload digests with deletion/wrong-value negatives, restored five Lucide icons, and made the actual mobile button 44 px. Fresh Chrome checks passed at 390/320 in both modes with visible focus, zero overflow, and zero console warnings/errors |
| 5 | Paper active muted text met WCAG AA but missed the internal `5:1` headroom target on canvas; panel/elevated use was not declared | Moved only Paper `--text-muted` to semantic literal `#6b6252`, declared Paper/Ink muted pairs on canvas/panel/elevated, and added fail-closed minimum/target checks while preserving foundation, Ink, reading, and disabled contracts |

No P0, P1, or P2 finding remains after the final comparison pass. Intentional
differences are limited to the repository's current documentation navigation,
mode-neutral copy, and accessible 44 px controls; typography, spacing, content
anatomy, radii, icons, and interaction structure do not fork between modes.

## Evidence inventory

The final evidence directory contains:

- `paper-1440x1024.png`, `ink-1440x1024.png`
- `paper-1280x800.png`, `ink-1280x800.png`
- `paper-1280-full.png`, `ink-1280-full.png`
- `paper-1280x800-input-focus.png`, `ink-1280x800-input-focus.png`
- `paper-390x844.png`, `ink-390x844.png`
- `paper-390-full.png`, `ink-390-full.png`
- `paper-390x844-input-focus.png`, `ink-390x844-input-focus.png`
- `paper-320x844.png`, `ink-320x844.png`
- `paper-320-full.png`, `ink-320-full.png`
- `built-preview-ink-1512x771.png`
- `before-paper-1280x800.png`, `after-paper-1280x800.png`
- `before-ink-1280x800.png`, `after-ink-1280x800.png`
- `before-paper-390x844.png`, `after-paper-390x844.png`
- `before-ink-390x844.png`, `after-ink-390x844.png`

## Engineering gates

- `pnpm install --frozen-lockfile`
- `pnpm check`
- `pnpm site:typecheck`
- `pnpm site:build`
- `pnpm audit --prod --audit-level=high`
- Fail-closed text, focus, action, status, disabled, state, forced-colors,
  increased-contrast, and reduced-motion coverage
- Actual package tarball SHA-256:
  `cd3621fdfc853fb76579c714e05e36108b67120f9a1f024db36faea45b63d2ac`
- The same tarball built successfully in temporary copies of exact-main MIRU
  `90474f265e3038d87db1b7fe08a16370abbafa42` and ayingott.me
  `e423626af77df2a291f7c572f31a7d453c20942e`; neither consumer repository was
  modified.

final result: passed
