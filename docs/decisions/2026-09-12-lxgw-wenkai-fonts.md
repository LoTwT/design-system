# 2026-09-12 · Original LXGW WenKai for Chinese text

Status: implemented in the working branch; not released.

## Decision

Use original LXGW WenKai v1.522 for Chinese text. Bundle Regular 400 and Medium
500, reflecting the preference for slightly heavier text with a real weight
choice. Do not bundle Light 300 or use the Screen edition. The default body
weight remains 400; consumers can opt into 500 with `font-medium`.

This supersedes the earlier system-only CJK fallback choice in the font roles.
Add WenKai to the existing display, sans, reading, and mono stacks. Limit its
CSS faces to Han characters, CJK punctuation, and related Chinese ranges so
Latin text retains Bricolage Grotesque, system UI, Literata, and Space Mono.
Chinese text in the mono role is not guaranteed to occupy two Space Mono cells.

Keep font loading opt-in through `@ayingott/theme/fonts.css`, with no new public
exports, dependencies, or automatic font import in the default theme entry.
The VitePress site already imports that entry and now demonstrates both weights.
Loaded webfonts take precedence over the existing macOS/Windows fallback stacks;
OS text rasterization can still differ. No platform detection is required.

## Assets and provenance

Download the pinned [official v1.522 release](https://github.com/lxgw/LxgwWenKai/releases/tag/v1.522).
Compress the original Regular and Medium TTFs as full WOFF2 files with fontTools
4.60.1 and Brotli 1.1.0. Preserve names, glyph coverage, metrics, and original
400/500 weights. `scripts/vendor-wenkai.py` checks upstream SHA-256 digests and
validates the conversion; package notices record source/output hashes and the
full upstream OFL 1.1 license.

The current Fontsource package was not used because its font version and weight
mapping differ from the selected upstream release.

## Loading cost

Regular is 8,016,748 bytes (7.65 MiB); Medium is 8,952,188 bytes (8.54 MiB).
Each weight is a complete font download when used. CSS `unicode-range` prevents
Latin-only text from requesting WenKai but does not partition the files. All
faces use `font-display: swap`; no large CJK asset is preloaded automatically.
Webfont subsetting can be evaluated separately if first-load performance needs
to improve, with the upstream distribution terms reviewed for that workflow.

## Contract and verification

- Keep package export and opt-in boundaries unchanged.
- Check WOFF2 signatures, packaged assets, notices checksums, CJK-only face ranges,
  and real consumer tarball compilation.
- Verify actual Chrome platform fonts: Regular 400 and Medium 500 without
  synthetic weight, WenKai Chinese in all roles, and preserved Latin fonts.
- Check the Fonts page at 1280, 390, and 320 pixels.
- Update the compiled default CSS and resolved role baselines only for the four
  approved font-stack additions; color, layout, and interaction contracts remain.
- Passed `pnpm check`, `pnpm site:typecheck`, `pnpm site:build`, and
  `CHROME_PATH=<chrome-binary> pnpm site:browser` on 2026-09-12. Browser validation
  used Chrome 153.0.8010.36 on macOS; Windows rendering was not tested directly.
