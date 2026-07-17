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
- Paper and Ink have no horizontal overflow at 1440, 1280, 390, or 320 px.
- A fresh built-preview tab reported zero console errors.
- Package fallbacks cover forced colors, increased contrast, and reduced motion.

## Iteration history

| Iteration | Finding | Resolution |
| --- | --- | --- |
| 0 | P1: sparse card-heavy composition and an open mobile-menu artifact diverged from the source | Rebuilt the page as an unframed document layout and captured a clean mobile state |
| 1 | P1: main-column x/y rhythm and section density were misaligned; P2: the brand mark was undersized | Matched the source gutter, rules, section rhythm, and 44 x 29 logo treatment |
| 2 | P1: Interaction and Token source did not fully enter the 1440 reference frame | Compacted the action/status matrix and aligned the source-size vertical rhythm |
| 3 | P1: the 320 px header overflowed to 369 px | Hid only the long brand label below 350 px while retaining the `Lo` mark; Paper and Ink now report `scrollWidth === 320` |

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

## Engineering gates

- `pnpm install --frozen-lockfile`
- `pnpm check`
- `pnpm site:typecheck`
- `pnpm site:build`
- `pnpm audit --prod --audit-level=high`
- Fail-closed text, focus, action, status, disabled, state, forced-colors,
  increased-contrast, and reduced-motion coverage
- Actual package tarball SHA-256:
  `6bfdb95302593cbba6dc9a89625701354f6eb224c767d9596cde62a96b0e7843`
- The same tarball built successfully in temporary copies of exact-main MIRU
  `90474f265e3038d87db1b7fe08a16370abbafa42` and ayingott.me
  `e423626af77df2a291f7c572f31a7d453c20942e`; neither consumer repository was
  modified.

final result: passed
