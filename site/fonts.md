# Fonts

The site imports `@ayingott/theme/fonts.css`, so this page displays the bundled font assets.

## Chinese · 霞鹜文楷

Original **LXGW WenKai v1.522** supplies Chinese glyphs across display, body, reading, and mono roles. Latin text keeps each role's existing font. These are two real, static weights; the samples disable synthetic weight and style.

<div class="token-card p-5">
  <p class="font-mono text-xs" style="color: var(--text-secondary); margin: 0 0 var(--spacing-3);">Regular · 400</p>
  <p data-wenkai-weight="400" lang="zh-CN" style="font-family: var(--font-sans); font-weight: 400; font-synthesis: none; font-size: var(--text-xl); line-height: var(--leading-reading); margin: 0;">
    <span data-wenkai-glyphs>风吹竹影，月照书窗。霞鹜文楷，让文字有温度。</span>
  </p>
</div>

<div class="token-card p-5 mt-4">
  <p class="font-mono text-xs" style="color: var(--text-secondary); margin: 0 0 var(--spacing-3);">Medium · 500</p>
  <p data-wenkai-weight="500" lang="zh-CN" style="font-family: var(--font-sans); font-weight: 500; font-synthesis: none; font-size: var(--text-xl); line-height: var(--leading-reading); margin: 0;">
    <span data-wenkai-glyphs>风吹竹影，月照书窗。霞鹜文楷，让文字有温度。</span>
  </p>
</div>

Use `font-regular` (`400`) for body text and `font-medium` (`500`) for a slightly heavier treatment. If you prefer heavier body copy, apply `font-medium` to the body or reading container. This also sets the requested weight for its Latin text. The theme's default body weight remains `400`.

The bundled WenKai faces do not include `300`, `600`, or `700`. Those values do not produce additional real WenKai weights; the browser matches an available face and may synthesize bold. The original font's Light `300` is not bundled.

## Display

<div class="token-card p-5">
  <p style="font-family: var(--font-display); font-size: var(--text-4xl); line-height: var(--text-4xl--line-height); margin: 0;">
    <span data-font-latin="display">Bricolage Grotesque</span> + <span data-font-chinese="display">霞鹜文楷中文标题</span>
  </p>
</div>

## Sans

<div class="token-card p-5">
  <p style="font-family: var(--font-sans); font-size: var(--text-lg); line-height: var(--text-lg--line-height); margin: 0;">
    <span data-font-latin="sans">System UI for everyday text.</span> <span data-font-chinese="sans">霞鹜文楷用于中文正文。</span>
  </p>
</div>

## Mono

<div class="token-card p-5">
  <p style="font-family: var(--font-mono); font-size: var(--text-lg); line-height: var(--text-lg--line-height); margin: 0;">
    <span data-font-latin="mono">Space Mono 400 / 700</span> · <span data-font-chinese="mono">代码注释与中文标记</span>
  </p>
</div>

Space Mono remains the Latin monospace face. WenKai supplies Chinese glyphs; its Chinese cell width is not guaranteed to equal two Space Mono cells.

## Reading

<div class="token-card p-5">
  <p style="font-family: var(--font-reading); font-size: var(--reading-font-size); line-height: var(--reading-line-height); max-inline-size: min(100%, var(--reading-measure)); margin: 0;">
    <span data-font-latin="reading">Literata for long-form Latin text.</span>
    <span data-font-chinese="reading">霞鹜文楷承载中文阅读，让中英混排延续各自的字体风格。</span>
  </p>
</div>

## Loading and Fallbacks

Import `@ayingott/theme/fonts.css` once, before `@ayingott/theme`. This site already does so. Font files are self-hosted and use `font-display: swap`.

The two WenKai WOFF2 files preserve all upstream glyphs: Regular is **7.65 MiB**, and Medium is **8.54 MiB**. Their CSS `unicode-range` selects Han characters, CJK punctuation, and related Chinese ranges; it does not subset the files or reduce a requested file's transfer size. Latin-only text does not request these faces. See the package's `THIRD_PARTY_NOTICES.md` for source checksums and license text.

Emoji/text presentation selectors (`FE0E` / `FE0F`) are excluded, so English text such as `Hello ❤️` does not trigger a Chinese font download.

On macOS and Windows, loaded webfonts take priority over system fallbacks. If they are unavailable, the browser follows each role's fallback stack. Chinese body/display text can fall back through `system-ui`, PingFang SC, Hiragino Sans GB, Microsoft YaHei, and `sans-serif`; reading and mono keep their role-specific fallbacks. Rendering can still vary slightly with the operating system.

## Bundled Files

- `bricolage-grotesque-latin-opsz-wght-normal.woff2`
- `bricolage-grotesque-latin-ext-opsz-wght-normal.woff2`
- `space-mono-latin-400-normal.woff2`
- `space-mono-latin-700-normal.woff2`
- `literata-latin-opsz-wght-normal.woff2`
- `literata-latin-ext-opsz-wght-normal.woff2`
- `lxgw-wenkai-400-normal.woff2`
- `lxgw-wenkai-500-normal.woff2`
