# RFC: Neo-Brutalism theme family

| Field | Value |
| --- | --- |
| Status | Accepted |
| Type | Additive minor; opt-in public CSS entry |
| Accepted | 2026-07-18 |
| Depends on | Paper & Ink paired theme, Ink dependency policy, muted headroom |
| Executable contract | `docs/spec/brutal-theme-contract.json` |

## 1. Decision

Neo-Brutalism is an opt-in visual family on the existing semantic anatomy. It does not become a third value of the Paper/Ink scheme axis.

| `.brutal` | `.dark` | Effective theme |
| --- | --- | --- |
| Absent | Absent | Paper |
| Absent | Present | Ink |
| Present | Absent | Neo-Brutal Light |
| Present | Present | Neo-Brutal Dark |

Consumers keep the default entry and add the family entry after it:

```css
@import "tailwindcss";
@import "@ayingott/theme";
@import "@ayingott/theme/brutal.css";
```

```html
<html class="brutal dark">
```

`.dark` remains the scheme axis. `.brutal` is only the family axis. `.dark` without `.brutal` is valid Ink. Removing `.brutal` or removing the extra import returns to Paper/Ink without changing the consumer's scheme mechanism.

V0 defines these four states with the family and scheme classes co-located on one theme root. Arbitrary mixed nested theme islands are unsupported. Splitting `.brutal` and `.dark` across nested scopes can combine selectors through the cascade into an uncontracted hybrid; subtree isolation requires a separate runtime and contract decision.

## 2. Accepted corrections to the draft

### 2.1 Default compiled CSS is the compatibility boundary

The default `@ayingott/theme` compiled output remains exact. Hard-shadow tokens, the family selector, the pressable utility, and its local reduced-motion policy live only in `brutal.css` and its import chain. The existing foundation files are unchanged.

### 2.2 The complete semantic declaration set is owned

Neo Light and Neo Dark declare equivalent key sets. Every current public surface, text, border, accent, focus, status, reading, radius, and depth role is either explicitly remapped or explicitly retained through the contract. A partial palette override is not conforming.

The `--brutal-*` variables exist to implement and verify those mappings. They are contract-owned implementation palette values, not a consumer direct-use API. Consumers use semantic roles, the two opt-in structure roles, and the entry-global hard-shadow physical tokens instead.

### 2.3 Structure changes through role aliases

The family remaps existing `--radius-card`, `--radius-control`, `--shadow-card`, and `--shadow-panel` roles. It adds two opt-in roles:

- `--border-width-surface`
- `--border-width-control`

Both resolve to the existing `--border-width-heavy` physical token. Existing physical radius, border, and soft-shadow scales remain unchanged. Cross-family declarations use `var(--border-width-surface, var(--border-width-thin))` or `var(--border-width-control, var(--border-width-thin))`. Without a `var()` fallback, a missing role makes the containing declaration invalid at computed-value time and leaves resolution to the normal cascade, inheritance, or initial value.

### 2.4 Invariants have a narrow verification boundary

Zero radius, minimum border width, and zero-blur shadow checks apply to the family structure roles and the Neo showcase adoption. `50%` remains a documented exception for complete circles. The no-gradient gate scans the opt-in family sources and the Neo showcase. It does not claim to constrain arbitrary consumer CSS.

### 2.5 Pressable owns its local accessibility fallback

`pressable` is scoped to `.brutal`. It uses `--duration-fast` and the existing easing token, excludes disabled states from hover/active movement, and composes with `focus-ring` and `touch-target`. It includes local `prefers-reduced-motion` and forced-colors fallbacks. The default entry still injects no global reduced-motion policy.

## 3. Package structure

```text
packages/theme/src/
├── brutal.css
├── semantic/
│   └── brutal.css
└── utilities/
    └── pressable.css
```

`brutal.css` imports the semantic and utility sources, then declares the opt-in hard-shadow variables at `:root` and their three matching utilities. The hard-shadow physical tokens are therefore entry-global after import, while the surface/control width roles remain scoped to `.brutal`. It does not import `index.css`; the consumer must import the default entry first.

The fifth public export is:

```json
{
  "./brutal.css": "./src/brutal.css"
}
```

## 4. Visual roles

The family uses flat sticker colors and direct literals held by its own contract:

| Role | Value | Text binding |
| --- | --- | --- |
| Canvas, light | `#FFF3D6` | `#111111` |
| Canvas, dark | `#17150F` | `#FFF3D6` |
| Yellow | `#FFD02F` | `#111111` |
| Pink | `#FF7AB8` | `#111111` |
| Blue | `#3D5AFE` | `#FFFFFF` |
| Green | `#3DDC84` | `#111111` |
| Purple | `#C3A6FF` | `#111111` |
| Orange | `#FF6B4A` | `#111111` |

Blue uses fixed pure white. Pure white on `#3D5AFE` is `5.132:1`; the light paper canvas on blue is only `4.654:1` and misses the internal target of `5:1`.

Hard shadows are opt-in physical tokens:

```css
--shadow-hard-color: currentcolor;
--shadow-hard-sm: 4px 4px 0 var(--shadow-hard-color);
--shadow-hard-md: 6px 6px 0 var(--shadow-hard-color);
--shadow-hard-lg: 8px 8px 0 var(--shadow-hard-color);
```

The family maps cards and panels to the 6px and 8px hard-shadow geometry with family ink, maps card/control radius to zero, and maps surface/control border width to `3px`. The physical `shadow-hard-*` utilities remain current-color utilities for direct consumer composition.

## 5. Pressable contract

The utility is used with the existing accessibility utilities:

```html
<button class="pressable focus-ring touch-target">Action</button>
```

| State | Transform | Shadow |
| --- | --- | --- |
| Rest | none | `--shadow-card` |
| Hover | `translate(-2px, -2px)` | 8px hard shadow in family ink |
| Active | `translate(6px, 6px)` | zero-offset hard shadow |
| Disabled | none | `--shadow-card` |
| Reduced motion hover/active | none | color/depth may still change immediately |

The transition duration resolves to `120ms`, inside the accepted `100–150ms` window. Disabled selectors cover native `:disabled`, `aria-disabled="true"`, and `[data-disabled]`.

## 6. Executable contract

`brutal-theme-contract.json` pins:

- the import order and selectors;
- the default source, compiled CSS, and Paper/Ink contract baselines;
- hard-shadow declarations;
- common and per-scheme semantic declarations;
- structure and interaction invariants;
- state mappings and legal contrast pairs;
- source-specific digests.

The verifier shares CSS parsing, declaration, contrast, digest, mutation, and state-mapping helpers with the Paper/Ink verifier. The Paper/Ink required IDs, digests, contrast semantics, mutation behavior, and JSON bytes remain unchanged.

Required negative fixtures fail closed for a missing role, wrong selector, unequal mode declaration sets, wrong value, blurred hard shadow, nonzero structural radius, `1px` structural border, gradient, motion outside the window, disabled movement, digest tampering, and paper-white text on blue.

## 7. Showcase and consumer boundary

The VitePress Theme Overview remains display-only. It documents the four-state selector matrix and renders Neo Light/Dark specimens that consume surface/control border width, radius, depth, pressable, focus, status, and reading roles. It is not a component library, playground, or family persistence implementation.

Consumers own:

- persistence and initial `.brutal` class placement;
- migration from fixed `1px` component borders to the opt-in width roles;
- component anatomy and copy;
- any production family switcher.

Active muted UI copy uses the semantic `--text-muted` role by default; physical color utilities remain valid for decorative or explicitly fixed-color work. `subtle` and `muted` role names express family-relative intent and do not promise equal alpha, literal color, or visual weight across families.

The rollout proof uses the real tarball in two disposable consumers. No consumer repository change is part of this feature.

## 8. Acceptance gates

- default compiled CSS exact equality;
- Paper/Ink contract JSON byte equality and unchanged verifier result;
- Neo Light/Dark declaration-set equality and all legal pairs;
- exact five-export package contract;
- real tarball install and Tailwind compilation;
- local reduced motion, forced colors, focus, touch target, and disabled-state checks;
- Paper, Ink, Neo Light, and Neo Dark at desktop and mobile;
- no FOUC, overflow, or hard-shadow clipping;
- `pnpm check`, `pnpm site:typecheck`, and `pnpm site:build`;
- clean scoped diff and recorded package hash.

## 9. Non-goals

This feature does not add Archivo Black, `fonts-brutal.css`, font assets, component primitives, framework adapters, different layouts or copy, a JavaScript theme runtime, consumer adoption, a version bump, a tag, a release, an npm publish, repository settings changes, merge authority, or branch deletion.

If Neo requires different component anatomy, layout, copy, or interaction structure, the shared-theme premise has failed and the work must move to a consumer/component project.
