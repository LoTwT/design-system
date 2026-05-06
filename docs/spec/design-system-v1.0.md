# lotwt Design System · v1.0 Spec

- 起草人：@UX · 2026-05-06
- 项目：`@ayingott/theme` V0 design system
- 状态：v1.0 草稿（PR #2 进入二轮 review；spec 与 V0 main `26971e4` 1:1 对齐 source of truth）
- Source of truth：**V0 main 已发布的 `packages/theme/src/**/*.css` + `package.json#exports`**
- 锁定输入：DS-D-01~04 / RFC 0001 v0.3 final / V0 PR #1 实施
- 配套：`docs/decisions/index.md`（Product 决策日志，PR #3 已合）

> **重要约定**：本 spec 是 V0 已发布契约的设计意图文档。token 值 / semantic 命名 / utility 实现 / 公共 exports **与 V0 main 1:1 对齐**；任何 UX 关于 v1.x 演进的想法移到 §A 标为 future / non-contract。

---

## §0 · 范围 + 与 RFC 0001 关系

- **本文 v1.0 spec** = 已发布 V0 token 的设计意图、视觉应用规则、暗色映射、字体应用、a11y 验收口径
- **TL `docs/rfc/0001-theme-v0.md`** = 包结构 / CSS 分层 / smoke gate / pack gate（实现契约）
- 两文 **1:1 对齐**，本 spec 不引入 V0 没有的 token 或 utility；所有未 ship 的 UX 想法标 `[FUTURE]` 或集中到 §A

---

## §1 · Foundation Tokens（V0 已 ship）

所有 foundation token 在 `packages/theme/src/foundation/*.css` 通过 `@theme static` 暴露，强制输出完整 token CSS variables，并自动生成 Tailwind utilities（如 `bg-surface-0` / `text-lavender-700` / `text-base` / `p-4` 等）。

### 1.1 Color · Surface（6 阶，命名为 `--color-surface-0` ~ `-5`）

```css
--color-surface-0: #fffaef;   /* 暖米白主底（page bg）*/
--color-surface-1: #fffdf7;
--color-surface-2: #ffffff;   /* 卡片底色 */
--color-surface-3: #f5efe0;   /* code block / quote / 装饰二级背景 */
--color-surface-4: #ebe5d6;
--color-surface-5: #d8d1bf;   /* 弱化 / disabled 背景 */
```

设计意图：暖米色调（不冷灰），与 slock.ai 暖白调性一致；6 阶让 surface 之间有细腻层级。

### 1.2 Color · Lavender（Primary Accent，11 阶）

```css
--color-lavender-50:  #f7f4ff
--color-lavender-100: #eee8ff
--color-lavender-200: #ded4ff
--color-lavender-300: #c7b6f5
--color-lavender-400: #afa1e8
--color-lavender-500: #9c8fd9   /* ⭐ primary accent */
--color-lavender-600: #7f70bf
--color-lavender-700: #66569d   /* 链接 / 强调 */
--color-lavender-800: #51457c
--color-lavender-900: #3d345d
--color-lavender-950: #251f3a
```

### 1.3 Color · Neutral（11 阶，暖棕灰）

```css
--color-neutral-50:  #faf8f2
--color-neutral-100: #f2eee3
--color-neutral-200: #e2ddce
--color-neutral-300: #cbc2ad
--color-neutral-400: #a99d84
--color-neutral-500: #8b7f68
--color-neutral-600: #6d624f   /* text-muted */
--color-neutral-700: #524a3c   /* text-secondary */
--color-neutral-800: #39342b
--color-neutral-900: #24211c
--color-neutral-950: #151310   /* ⭐ text-primary */
```

设计意图：与暖米色 surface 协调的暖棕灰，比纯灰更"自然"；text-primary 用 `neutral-950` 在 surface-0 上对比度极强。

### 1.4 Color · Decorative Hue Palettes（V0 ship 5 个 hue × 11 阶）

每 hue 完整 11 阶（50-950），与语义解耦，可用于装饰 / chip / 数据可视化：

- `--color-mint-*` 50-950（薄荷绿 / 柔和成功色）
- `--color-sky-*` 50-950（天空蓝 / 信息色）
- `--color-amber-*` 50-950（暖琥珀 / 警告色）
- `--color-rose-*` 50-950（玫瑰粉 / 危险色）
- `--color-ink-*` 50-950（青墨灰 / 中性次色）

完整 hex 见 `packages/theme/src/foundation/colors.css`。

> [FUTURE]：UX baseline 曾提议 7 hue（含 purple / teal / orange / slate）；V0 仅 ship 5 个。新增 hue 走 v1.x 单独决策。

### 1.5 Color · Status（每个 4 阶：50/500/700/950）

```css
--color-success-50/500/700/950   /* 绿 */
--color-warning-50/500/700/950   /* 琥珀 */
--color-danger-50/500/700/950    /* 玫瑰 */
--color-info-50/500/700/950      /* 天空 */
```

### 1.6 Color · Syntax Highlight（V0 ship 6 个 token）

```css
--color-syntax-keyword:   #7f70bf  /* lavender-600 派生 */
--color-syntax-string:    #1f8b68  /* mint-600 派生 */
--color-syntax-function:  #1d65bd  /* sky-600 派生 */
--color-syntax-number:    #dc8a08  /* amber-500 派生 */
--color-syntax-comment:   #8b7f68  /* neutral-500 派生 */
--color-syntax-operator:  #6d624f  /* neutral-600 派生 */
```

> [FUTURE]：UX baseline 曾提议 14 syntax token（含 boolean / class-name / tag / attr-* / punct / bg / line-num 等）；V0 仅 6 个。后续按真实代码高亮库需要扩。

### 1.7 Typography · Family（V0 已 ship 3 family）

```css
--font-display: "Space Grotesk", system-ui, -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
--font-sans:    system-ui, -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
--font-mono:    "Space Mono", ui-monospace, SFMono-Regular, "Cascadia Mono", Consolas, monospace;
```

> [FUTURE]：UX baseline 曾提议 `--font-serif`（Newsreader / IBM Plex Serif fallback），V0 不 ship。Blog body serif 启用时单独加。

### 1.8 Typography · Size Scale（13 阶，各带配套 line-height）

V0 暴露 paired tokens（`--text-{size}` + `--text-{size}--line-height`）：

```css
--text-2xs / --text-xs / --text-sm / --text-base / --text-md
--text-lg / --text-xl / --text-2xl / --text-3xl / --text-4xl
--text-5xl / --text-6xl / --text-7xl
```

每个含对应 line-height token（如 `--text-base--line-height: 1.5rem`）。完整值见 `foundation/typography.css`。

### 1.9 Typography · Weight / Leading / Tracking

```css
--font-weight-light / regular / medium / semibold / bold     (5 阶)
--leading-none / tight / snug / normal / relaxed / loose      (6 阶)
--tracking-tighter / tight / normal / wide / wider / widest   (6 阶)
```

> [FUTURE]：UX baseline 曾提议 17 个语义 type-role tokens（`--type-h1`, `--type-meta`, `--type-code-block` 等组合 token）；V0 不 ship type-role token，consumer 自己组合 `font-display + text-3xl + font-bold` 即可。后续若发现重复使用模式可抽 type-role。

### 1.10 Spacing（19 阶 / 4px base）

V0 token：`--spacing-px / -0 / -0-5 / -1 / -1-5 / -2 / -2-5 / -3 / -3-5 / -4 / -5 / -6 / -8 / -10 / -12 / -16 / -20 / -24 / -32`。

注意命名用连字符（`spacing-0-5` 而非 `spacing-0.5`）以避免 CSS 解析问题。完整值见 `foundation/spacing.css`。

### 1.11 Sizing（icon 5 / control 5 / avatar 4）

```css
--size-icon-xs/sm/md/lg/xl                  (5 阶 icon: 0.75rem ~ 2rem)
--size-control-xs/sm/md/lg/xl               (5 阶 control: 1.75rem ~ 3.5rem)
--size-avatar-sm/md/lg/xl                   (4 阶 avatar: 2rem ~ 6rem)
```

> [FUTURE]：UX baseline 曾提议 6 阶 icon（含 `2xl` 3rem）+ 6 阶 avatar（含 xs/2xl）；V0 收窄到实际 V0 范围用得到的。后续按需扩。

### 1.12 Radius（10 个，含语义 radius）

```css
--radius-none / -xs / -sm / -md / -lg / -xl / -2xl / -full   (8 阶 size)
--radius-card:    var(--radius-lg)      /* 0.5rem，card 默认 */
--radius-control: var(--radius-md)      /* 0.375rem，button / input 默认 */
```

> [FUTURE]：UX baseline 曾提议 9 阶含 `3xl: 24px`；V0 不 ship。

### 1.13 Shadow（6 size + 3 semantic）

```css
--shadow-none / -xs / -sm / -md / -lg / -xl   (6 size)
--shadow-card:  var(--shadow-sm)
--shadow-panel: var(--shadow-md)
--shadow-focus: 0 0 0 4px rgb(156 143 217 / 0.24)   /* lavender-500 + alpha */
```

设计意图：multi-layer 阴影（每个含 2 层）提质感；语义阴影 (`--shadow-card`, `--shadow-panel`) 让 consumer 不直接绑 size。

### 1.14 Border（5 width + 3 style）

```css
--border-width-hairline / -thin / -medium / -thick / -heavy   (5 width: 0.5px ~ 3px)
--border-style-solid / -dashed / -dotted                       (3 style)
```

### 1.15 Motion（5 duration + 4 ease + 2 named animation + 2 keyframes）

```css
--duration-instant / -fast / -normal / -slow / -slower         (5)
--ease-standard / -emphasized / -out-soft / -in-soft           (4)
--animate-fade-in / -pop-in                                    (2)
@keyframes ayingott-fade-in / ayingott-pop-in                  (2)
```

V0 keyframes 命名带 `ayingott-` 前缀避免与 consumer 自有 keyframes 冲突。

> [FUTURE]：UX baseline 曾提议 `--ease-back-out` / `--ease-spring` + `float-gentle` / `pulse-soft` / `slide-up` keyframes；V0 不 ship。装饰 float 动画在 §5 由 consumer 自行实施（参考 §5.3.3）。

---

## §2 · Layer Tokens（V0 已 ship）

### 2.1 Aspect Ratio（5 阶）
```css
--aspect-portrait / -landscape / -wide / -ultrawide / -square
```

### 2.2 Breakpoint（6 阶 mobile-first）
```css
--breakpoint-xs / -sm / -md / -lg / -xl / -2xl
```

### 2.3 Container（9 个 — 按 size 6 + 按用途 3）
```css
--container-xs / -sm / -md / -lg / -xl / -2xl     (size 6 阶)
--container-reading: 42rem                           (blog detail 推荐宽度)
--container-content: 64rem                           (page 内容默认宽度)
--container-wide:    80rem                           (full-width layout)
```

### 2.4 Grid（4 个语义 gap + columns）
```css
--grid-gap-page / -gap-section / -gap-cluster
--grid-columns-page: 12
```

### 2.5 Layout（responsive clamp values，`:root` 而非 `@theme`）
```css
--layout-page-gutter:  clamp(1rem, 4vw, 3rem)
--layout-section-gap:  clamp(3rem, 8vw, 7rem)
--layout-stack-gap:    var(--spacing-6)
--layout-inline-gap:   var(--spacing-3)
--layout-prose-width:  var(--container-reading)
```

### 2.6 Opacity（5 语义阶）
```css
--opacity-disabled: 0.45
--opacity-muted:    0.62
--opacity-subtle:   0.72
--opacity-overlay:  0.76
--opacity-emphasis: 0.88
```

V0 用语义命名而非数值阶 — consumer 用语义而非"50% / 60%"思考。

### 2.7 Transition（3 个语义 transition group）
```css
--transition-interactive  /* color / bg / border / shadow / transform，使用 fast + standard */
--transition-surface      /* bg / border / shadow，使用 normal + standard */
--transition-motion       /* opacity / transform，使用 normal + out-soft */
```

### 2.8 Touch Target（`:root` 命名空间）
```css
--touch-target-min: 2.75rem   /* 44px，product acceptance（不是 WCAG AA universal 强制）*/
--touch-target-gap: 0.5rem
```

### 2.9 Z-index（9 阶 stacking）
```css
--z-base / -raised / -sticky / -header / -popover / -tooltip / -overlay / -modal / -toast
```

> [FUTURE]：UX baseline 曾提议 13 阶（含 dropdown / fixed / menu / debug）；V0 收窄到 9 阶。consumer 需要更多层级时单独扩。

---

## §3 · Semantic Vars（V0 已 ship，CSS-only，不生成 Tailwind utility）

### 3.1 设计契约

V0 semantic vars **不**承诺生成 `bg-surface-canvas` / `text-primary` 等 Tailwind utility。它们是 runtime CSS variables，consumer 通过 `var()` 直接引用：

```css
.my-component { background: var(--surface-canvas); color: var(--text-primary); }
```

`@apply` **不可直接用于 semantic vars**（因为没有对应 utility）。如果 consumer 想要 utility 形式，必须按 §6 Consumer-side Recipe 在自己 app 里加 `@theme inline` 提升。

### 3.2 Light mode 映射（V0 `packages/theme/src/semantic/light.css`）

```css
:root {
  color-scheme: light;

  /* Surface */
  --surface-canvas:    var(--color-surface-0);
  --surface-panel:     var(--color-surface-1);
  --surface-elevated:  var(--color-surface-2);
  --surface-subtle:    var(--color-surface-3);
  --surface-muted:     var(--color-surface-4);

  /* Text */
  --text-primary:      var(--color-neutral-950);
  --text-secondary:    var(--color-neutral-700);
  --text-muted:        var(--color-neutral-600);
  --text-inverse:      var(--color-surface-2);
  --text-accent:       var(--color-lavender-700);

  /* Border (rgb + alpha 派生 neutral-900) */
  --border-subtle:     rgb(36 33 28 / 0.10);
  --border-default:    rgb(36 33 28 / 0.16);
  --border-strong:     rgb(36 33 28 / 0.28);

  /* Accent */
  --accent-primary:        var(--color-lavender-500);
  --accent-primary-hover:  var(--color-lavender-600);
  --accent-primary-active: var(--color-lavender-700);
  --accent-soft:           var(--color-lavender-100);
  --accent-contrast:       var(--color-lavender-950);

  /* Focus ring */
  --focus-ring-color:  var(--color-lavender-500);
  --focus-ring-shadow: 0 0 0 4px rgb(156 143 217 / 0.24);

  /* Status */
  --status-success:    var(--color-success-500);
  --status-warning:    var(--color-warning-500);
  --status-danger:     var(--color-danger-500);
  --status-info:       var(--color-info-500);
}
```

### 3.3 Dark mode 映射（V0 `packages/theme/src/semantic/dark.css`）

```css
@custom-variant dark (&:where(.dark, .dark *));

.dark {
  color-scheme: dark;

  --surface-canvas:    #121019;
  --surface-panel:     #191623;
  --surface-elevated:  #211d2e;
  --surface-subtle:    #2a2635;
  --surface-muted:     #373142;

  --text-primary:      #f7f1e6;
  --text-secondary:    #d7cdbc;
  --text-muted:        #aa9e8b;
  --text-inverse:      #151310;
  --text-accent:       var(--color-lavender-300);

  --border-subtle:     rgb(247 241 230 / 0.10);
  --border-default:    rgb(247 241 230 / 0.16);
  --border-strong:     rgb(247 241 230 / 0.28);

  --accent-primary:        var(--color-lavender-300);
  --accent-primary-hover:  var(--color-lavender-200);
  --accent-primary-active: var(--color-lavender-100);
  --accent-soft:           rgb(156 143 217 / 0.18);
  --accent-contrast:       var(--color-lavender-950);

  --focus-ring-color:  var(--color-lavender-300);
  --focus-ring-shadow: 0 0 0 4px rgb(199 182 245 / 0.22), 0 0 0 1px rgb(247 241 230 / 0.18);

  --status-success:    #84dfbd;
  --status-warning:    #ffdc7a;
  --status-danger:     #ff9ab6;
  --status-info:       #8dc5ff;
}
```

### 3.4 Dark mode 实施细则

1. **选择子**：`@custom-variant dark (&:where(.dark, .dark *))` 配 `.dark` class 触发（与 Tailwind v4 / shadcn 主流一致）
2. **不简单反相**：dark surface 用偏深紫黑（`#121019` 系列）而非纯黑；text 用暖白 `#f7f1e6` 而非纯白；保持温度感
3. **accent 提亮**：dark 模式用 `lavender-300` 而非 `lavender-500`（避免暗底刺眼，参考 §3.3 `--accent-primary` 映射）
4. **focus ring 双层**：dark 下 outer ring 用更亮的 lavender + inner thin ring 用 text-primary alpha（参考 §3.3 `--focus-ring-shadow` 实测值）
5. **status 暗色调亮**：success/warning/danger/info 在 dark 用各 hue 的 300 阶，避免高饱和深底刺眼

> [FUTURE]：UX baseline 曾提议 `--text-tertiary` / `--text-disabled` / `--text-link` / `--bg-accent-soft` / `--bg-accent` / `--bg-accent-strong` / `--text-on-accent` / `--text-link-hover` 等 token，V0 不 ship。consumer 当前用 V0 提供的 `--text-muted` / `--accent-primary` / `--accent-soft` 等组合。

---

## §4 · Theme Utilities（V0 已 ship 4 个）

### 4.1 `focus-ring` / `focus-ring-inset`

V0 `packages/theme/src/utilities/focus.css`：

```css
@utility focus-ring {
  outline: 2px solid var(--focus-ring-color);
  outline-offset: 2px;
  box-shadow: var(--focus-ring-shadow);
}

@utility focus-ring-inset {
  outline: 2px solid var(--focus-ring-color);
  outline-offset: -2px;
  box-shadow: inset 0 0 0 1px var(--focus-ring-color);
}
```

设计意图：
- `focus-ring` 标准外层焦点（外侧 2px outline + alpha glow shadow）— 适合 button / link / tab 等独立交互元素
- `focus-ring-inset` 内嵌焦点（内偏移 outline + inner ring）— 适合 input / textarea / 卡片内可点击区域
- light/dark 切换通过 `--focus-ring-color` / `--focus-ring-shadow` semantic vars cascade，不重定义 utility

应用规则：所有交互元素必须 `:focus-visible` 状态使用 `focus-ring` 或 `focus-ring-inset` 之一。

### 4.2 `touch-target` / `touch-target-inline`

V0 `packages/theme/src/utilities/touch-target.css`：

```css
@utility touch-target {
  min-width: var(--touch-target-min);
  min-height: var(--touch-target-min);
}

@utility touch-target-inline {
  min-height: var(--touch-target-min);
  padding-inline: max(var(--spacing-3), var(--touch-target-gap));
}
```

设计意图：
- `touch-target` 用于独立可点击区域（button / icon-only button），约束 width + height ≥ 44px
- `touch-target-inline` 用于行内链接 / inline button，仅约束 height + 适当 padding-inline 提供横向命中扩展

应用规则：所有 button / link / icon-button / theme-toggle 必须用 `touch-target` 或 `touch-target-inline` 之一。

> [FUTURE]：UX baseline 曾在 utility 内置 `display: inline-flex; align-items / justify-content`；V0 不 ship 这些（避免 utility 越界做 layout，consumer 自决）。

### 4.3 V0 Base CSS（`packages/theme/src/base.css`）

V0 在 `@layer base` 提供：
- `*, ::before, ::after { box-sizing: border-box }`
- `html / body { background: var(--surface-canvas); color: var(--text-primary); font-family: var(--font-sans); }`
- 字体渲染优化（`text-rendering: optimizeLegibility` + `-webkit-font-smoothing` 等）
- `::selection { background: var(--accent-soft); color: var(--text-primary) }`
- `a { color: var(--text-accent); ... }`
- 全局 `:focus-visible { outline: 2px solid var(--focus-ring-color); outline-offset: 2px; }` 兜底

consumer 不 import `@ayingott/theme` 主入口时不会拿到这些 base 样式；想用 base 必须 `@import "@ayingott/theme"`（`./index.css` 默认入口）。

---

## §5 · 视觉语言应用规则（UX 独有）

这一节是 v1.0 spec 的 UX 独特价值，指导消费方在 V0 已发布 token 基础上正确组合应用。所有 token 引用都对齐 §1-§4 V0 实际 ship 的命名。

### 5.1 何时用 lavender accent / 何时只用 neutral

| 场景 | V0 token 组合 |
|---|---|
| Primary CTA 按钮 | `bg: var(--accent-primary)` / `color: var(--text-inverse)` / `:hover bg=accent-primary-hover` |
| Secondary 按钮 | `bg: var(--surface-elevated)` / `color: var(--text-primary)` / `border: 1px solid var(--border-default)` |
| Outline accent button | `bg: transparent` / `color: var(--text-accent)` / `border: 1.5px solid var(--accent-primary)` |
| 链接（inline）| `color: var(--text-accent)` |
| 装饰几何元素 | `fill: var(--accent-primary)` 或 neutral-300 |
| Tag chip 默认 | `bg: var(--accent-soft)` / `color: var(--text-primary)`（**不**用 text-accent，避免对比度低于 AA — 见 §8.1）|
| Card border | `border: 1px solid var(--border-subtle)`（默认）/ `var(--border-default)` 强调 / `var(--border-strong)` focus |
| Card hover | `box-shadow: var(--shadow-md)` |
| Heading（H1-H6）| `color: var(--text-primary)` |
| Body text | `color: var(--text-primary)` 默认 / `var(--text-secondary)` 次级 / `var(--text-muted)` meta |

设计原则：lavender 是 brand 信号；neutral 承担文本主体内容。

### 5.2 Hover / Focus 视觉 pattern

```css
.interactive {
  transition: var(--transition-interactive);
}

.interactive:hover {
  /* 抬升 + 阴影增强 */
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.interactive:focus-visible {
  /* V0 utility */
  @apply focus-ring;
}

.interactive:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}
```

### 5.3 装饰几何元素布置规则

ayingott.me 的 "点线面" 视觉特征通过散布的几何 SVG 装饰实现。

#### 5.3.1 装饰元素类型（consumer 自实施，V0 theme 不 ship 装饰组件）

```yaml
decoration-dot:     8px circle / fill=var(--accent-primary)
decoration-line:    40px width × 1.5px height / bg=var(--accent-primary)
decoration-circle-outline: 24px / border=1.5px var(--accent-primary) / radius-full
decoration-square:  16px / border=1.5px var(--accent-primary) / radius-xs / rotate(-5deg)
```

#### 5.3.2 布置位置（consumer 决定）

| 页面 | 推荐位置 | 数量 | rotation |
|---|---|---|---|
| Home | 右上角 + 左下角 | 2-3 个 | -5° / +7° |
| About | 右下角 | 1-2 个 | -3° |
| Blog list | 仅空状态时 | 1 个大图 | 0° |
| Blog detail | 不放装饰 | 0 | — |
| 404 | 中心组合 | 3-5 个 | 散乱 |

#### 5.3.3 动画规则（consumer 自实施）

V0 theme 不 ship `float-gentle` keyframes（参考 §1.15 [FUTURE]）。consumer 想要装饰浮动动画时，自己定义：

```css
@keyframes float-gentle {
  0%, 100% { transform: translateY(0) rotate(var(--decoration-rotation, 0)); }
  50%      { transform: translateY(-4px) rotate(var(--decoration-rotation, 0)); }
}

.decoration-floating {
  animation: float-gentle 6s var(--ease-out-soft) infinite;
  pointer-events: none;
  opacity: 0.5;
}

@media (prefers-reduced-motion: reduce) {
  .decoration-floating {
    animation: none;
  }
}
```

设计原则：装饰是"加分项"，不是结构元素，`pointer-events: none` 避免误触。

### 5.4 暗色模式视觉应用

暗色模式不只是颜色反转，还包括：

1. **accent 提亮**：light 用 `--accent-primary` (lavender-500)，dark 自动变成 lavender-300（V0 已映射，consumer 写 `var(--accent-primary)` 即可）
2. **阴影注意**：V0 shadow token 在 dark 视觉效果会自动变弱（rgb 阴影 + 暗底）；consumer 如需 dark 加强，可在自己 .dark 段覆盖 `--shadow-md` 等
3. **focus ring 双层**：V0 dark `--focus-ring-shadow` 已含 outer + inner 双层（参考 §3.3）
4. **装饰元素降低饱和**：dark mode 装饰用 `var(--color-lavender-300)` 而非 500（与 accent 一致）
5. **Code highlight 暗色**：V0 `--color-syntax-*` 在 light 已偏深，dark mode 显示对比足够；如需进一步提亮，consumer 在 `.dark` 段覆盖

---

## §6 · Consumer-side Recipe（教程，不进 V0 契约）

如果 consumer 想要 `bg-surface-canvas` / `text-primary` 等 Tailwind utility 形式（而非 `var()`），可在自己 app CSS 中加：

```css
/* consumer-app.css */
@import "tailwindcss";
@import "@ayingott/theme/fonts.css";   /* opt-in 字体 */
@import "@ayingott/theme";              /* tokens + semantic + utilities + base */

/* 自己生成 Tailwind utilities（non-V0 contract，consumer 决定）*/
@theme inline {
  --color-surface-canvas:   var(--surface-canvas);
  --color-surface-panel:    var(--surface-panel);
  --color-surface-elevated: var(--surface-elevated);
  --color-surface-subtle:   var(--surface-subtle);
  --color-surface-muted:    var(--surface-muted);

  --color-text-primary:     var(--text-primary);
  --color-text-secondary:   var(--text-secondary);
  --color-text-muted:       var(--text-muted);
  --color-text-inverse:     var(--text-inverse);
  --color-text-accent:      var(--text-accent);

  --color-border-subtle:    var(--border-subtle);
  --color-border-default:   var(--border-default);
  --color-border-strong:    var(--border-strong);

  --color-accent-primary:   var(--accent-primary);
  --color-accent-soft:      var(--accent-soft);
  --color-accent-contrast:  var(--accent-contrast);
}
```

这样 consumer 即可使用：`bg-surface-canvas` / `text-primary` / `border-default` / `bg-accent-soft` / `text-accent` 等 utility class。

注意：
- 这是 **consumer 决定**，不是 theme 包契约
- 未来 theme 包要内置这些 utility（v1+）需要单独 RFC 决议

---

## §7 · 字体应用规则

### 7.1 字体加载（opt-in）

V0 `packages/theme/src/fonts.css` 提供 `@font-face`：

```css
@import "tailwindcss";
@import "@ayingott/theme/fonts.css";   /* opt-in: 加载 Space Grotesk Variable + Space Mono r+b */
@import "@ayingott/theme";              /* tokens + semantic + utilities + base */
```

不加载 `fonts.css` 时：token 仍生效，浏览器 fallback 到系统字体。

V0 实际打包字体文件（在 `packages/theme/src/fonts/`）：
- `space-grotesk-latin-wght-normal.woff2`（latin subset，variable wght 300-700）
- `space-grotesk-latin-ext-wght-normal.woff2`（latin-ext subset）
- `space-mono-latin-400-normal.woff2`（regular）
- `space-mono-latin-700-normal.woff2`（bold）

License：SIL OFL 1.1（详见 `packages/theme/THIRD_PARTY_NOTICES.md`）。

### 7.2 何时用哪个 family token

| 场景 | Token | 备注 |
|---|---|---|
| 大标题（H1 / page title）| `--font-display` | Space Grotesk Latin + 系统中文 |
| 二级 / 小标题（H2-H6）| `--font-display` | 一致性 |
| Body 默认 | `--font-sans` | 系统字体 + 中文 fallback |
| Body 长文 | `--font-sans` | 同上 |
| Tagline / hero text | `--font-display` | brand |
| Date / reading time / meta | `--font-mono` | 等宽对齐 |
| Tag chip label | `--font-mono` | "标签"感 |
| Code block / inline code | `--font-mono` | 等宽 |
| Footer copyright | `--font-mono` | meta 风 |

> [FUTURE]：UX baseline 曾提议 17 个 type-role tokens（如 `--type-h1` / `--type-meta` / `--type-overline` 等组合 token）。V0 不 ship；consumer 当前组合 `var(--font-display)` + `var(--text-3xl)` + `var(--font-weight-bold)` 即可。

### 7.3 何时不需要打包字体

```css
/* consumer 仅 import theme 不 import fonts */
@import "tailwindcss";
@import "@ayingott/theme";
```

适合：
- 内部工具 / 后台不需要 brand
- 已有 CDN 加载相同字体的 consumer
- 极端性能敏感场景（节省 ~70KB gzipped）

不影响功能，仅视觉 fallback 到系统字体。

---

## §8 · A11y 验收清单（QA 用）

### 8.1 对比度（WCAG AA）

实际值按 V0 实施 hex 值计算（surface-0 `#fffaef`，neutral-950 `#151310`，lavender 标准阶）。**任何 hex 值修改后必须用 `axe` / WebAIM contrast checker 重算**。

| 文本类型 | 最小比 | 实测比（V0 hex）| 适用范围 |
|---|---|---|---|
| `--text-primary` (#151310) on `--surface-canvas` (#fffaef) | ≥ 4.5:1 | **~17.8:1** ✅ 远超 | 所有正文 / heading / body |
| `--text-secondary` (neutral-700 #524a3c) on canvas | ≥ 4.5:1 | **~9.0:1** ✅ | 二级文本 / meta（达 AA 普通文本）|
| `--text-muted` (neutral-600 #6d624f) on canvas | ≥ 4.5:1 | **~6.0:1** ✅ | meta / caption / placeholder |
| `--text-accent` (lavender-700 #66569d) on canvas | ≥ 4.5:1 | **~5.6:1** ✅ | 内联链接 |
| `--text-accent` on `--accent-soft` (lavender-100 #eee8ff) | ≥ 4.5:1 普通 / 3:1 大字 | **~5.0:1** ✅ | chip 上文字（接近 AA 阈值）|

应用约束：
- **Chip / Tag 上文字优先 `--text-primary`**（在 accent-soft 上 ~14:1 ✅ 远超）；用 `--text-accent` 时确认对比度仍达 AA 普通文本
- **任何 hex 值变更后**重算并更新本表
- **dark mode 全部 token** 同样需达 AA，QA 用 `axe` 实测；表中实测值随 V0 evolution 补充

### 8.2 焦点可见

- 所有交互元素 `:focus-visible` 必须使用 `focus-ring` 或 `focus-ring-inset` utility（V0 已 ship）
- light/dark 切换通过 `--focus-ring-color` cascade，不需要在每个交互元素重写

### 8.3 暗色模式 contrast 不退化

每个 light AA 通过的 token 在 dark 同样需达 AA。critical 验证项：
- `--text-primary` on `--surface-canvas` (dark)
- `--text-accent` on `--surface-canvas` (dark) — V0 用 lavender-300 而非 700
- `focus-ring` shadow on dark canvas — V0 含 outer alpha + inner thin ring

QA 用 `axe` 实测 + light/dark 切换 visual diff。

### 8.4 触屏热区 ≥ 44×44

所有 button / link / icon-button / theme-toggle 必须使用 `touch-target` 或 `touch-target-inline` utility 之一（V0 已 ship）。装饰 SVG `pointer-events: none`，不计入触屏目标。

> **注**：44×44 是 V0 design system 的 **product acceptance 标准**（与 AY-D-19 + iOS HIG 对齐），不是 WCAG AA universal 强制（WCAG 2.5.5 AAA 才要求 44；WCAG 2.5.8 AA 仅要求 24）。consumer 项目可按自己 a11y 等级调整 `--touch-target-min`。

### 8.5 Reduced motion 处理

V0 theme **不**包含任何 `prefers-reduced-motion` media query。V0 仅暴露 motion token（`--animate-fade-in` / `--animate-pop-in` / `--duration-*` / `--ease-*`），**不在 theme 包内做全局动画禁用注入**（避免越界影响 consumer app 动画）。

V0 a11y 验收范围（QA 用）：
- ✅ V0 theme motion token 命名清晰（consumer 引用时能识别用途）
- ❌ NOT in V0 gate：reduced-motion 处理由 consumer app 层负责；**consumer 使用 V0 `--animate-*` 或自定义动画时必须在 consumer app 层自行实施 `prefers-reduced-motion`**

Consumer-side recipe（**必需**，consumer 自实施）：

```css
/* CONSUMER-SIDE — 不在 V0 theme 契约内，consumer 必须自己加 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

或更精细：仅禁用装饰动画：

```css
@media (prefers-reduced-motion: reduce) {
  .decoration-floating { animation: none; }
}
```

---

## §9 · 版本管理

### 9.1 Semver
- **major (1.x → 2.0)**：删除 / 重命名 token / 大幅重构
- **minor (1.0 → 1.1)**：新增 token / 新增 hue / 新增 utility
- **patch (1.0.0 → 1.0.1)**：hex 微调 / 阴影数值 / 修 bug / 文档修订

### 9.2 视觉回归 token 清单（QA 用）

每次发版必须验证以下 token 视觉**无回归**：

```yaml
# Critical surface
--surface-canvas, --surface-panel, --surface-elevated, --surface-subtle

# Critical text
--text-primary, --text-secondary, --text-muted, --text-accent

# Critical accent
--color-lavender-500, --color-lavender-700, --accent-primary, --accent-soft

# Critical interactive
--shadow-md, focus-ring outline + box-shadow, touch-target output

# Dark mode all above
```

### 9.3 CHANGELOG

每版必须有 CHANGELOG entry：版本号 / 日期 / Added / Changed / Deprecated / Removed / Fixed / Security / Migration guide / Visual diff screenshot（如果有视觉变化）。

---

## §10 · 跨项目移植

### 10.1 第二个项目消费 checklist

```bash
pnpm add @ayingott/theme
```

```css
@import "tailwindcss";
@import "@ayingott/theme/fonts.css";   /* 视项目需要 */
@import "@ayingott/theme";
```

设置 dark mode：在 HTML root 加 `.dark` class（手动 toggle 或 framework 提供）。

想要 Tailwind utility：consumer-side recipe（§6）。

想要不同 accent：在 consumer app 覆盖 `--color-lavender-500` 或 `--accent-primary`。

### 10.2 分叉 / 派生设计系统

如果未来某项目需要完全不同 visual identity：
- **轻派生**：consumer 在自己 app 覆盖 token（如换 accent 为 sky-500）— 复用大部分 V0
- **重派生**：fork `@ayingott/theme` 为新包 — 仅当 visual identity 完全不同时才考虑

---

## §11 · 与 ayingott.me design-v0.1.md 的关系

- **本文 (`design-system-v1.0-spec.md`)**：design system V0 契约文档（V0 main 实施的 source of truth）
- **`projects/ayingott-me/ux-design-v0.1.md`**：ayingott.me 站点级 UX spec（IA / 5 页 wireframe / Claude Design prompt 包 / PDF 脱敏 checklist）
- 关系：站点级 v0.1 引用本文 V0 token + 视觉应用规则；不重复定义

---

## §12 · 状态 + Reviewers

- v1.0 spec PR #2 进二轮 review（基于 V0 main `26971e4` source of truth 重写）
- reviewers：@lo-user @Product @TechLead @QA

---

## §13 · 与 RFC 0001 v0.3 + V0 实施对应表

| RFC v0.3 锁定 | V0 实施 | 本文 v1.0 spec 对应 |
|---|---|---|
| Theme-only V0 | `packages/theme/` 唯一包 | §0 + §A |
| Tailwind v4 CSS-first `@theme static` | foundation/layers 全部用 `@theme static` | §1 + §2 都标 V0 token |
| 独立仓 `LoTwT/design-system` | repo 已 bootstrap | §10.1 npm package 消费 |
| Semantic vars CSS-only | semantic/light.css + dark.css 用 `:root` / `.dark` | §3 全部 |
| Public exports minimal | `.` / `./index.css` / `./fonts.css` / `./fonts/*` (4 项)| §10.1 + §7.1 |
| Surface 命名 | V0 用 `--color-surface-0` ~ `-5` (numbered) | §1.1 |
| Semantic vars 命名 | V0 用 `--text-muted` / `--text-accent` / `--accent-primary` 等 | §3.2 + §3.3 |
| Font: Space Grotesk Variable + Space Mono r+b | fonts/ 4 个 woff2 | §7 |
| `THIRD_PARTY_NOTICES.md` 包内 | `packages/theme/THIRD_PARTY_NOTICES.md` | §7.1 |
| 框架无关 (DS-D-04) | 仅 CSS variables，无 framework 绑定 | §10 |
| `focus-ring` / `focus-ring-inset` / `touch-target` / `touch-target-inline` | utilities/ 实现 | §4.1 + §4.2 |

---

## §A · Future / Non-contract（UX 设计意图但 V0 未 ship）

以下 UX 设计意图在 V0 未实施。consumer **不可**视作 V0 已 ship；如需启用，走 v1.x 单独决策 + 实施 PR。

### A.1 Color
- 7 hue palettes（V0 ship 5：mint/sky/amber/rose/ink；未 ship purple/teal/orange/slate）
- 14 syntax highlight tokens（V0 ship 6；未 ship boolean / class-name / tag / attr-* / punct / bg / line-num 等）
- `--text-tertiary` / `--text-disabled` / `--text-link` / `--text-link-hover` / `--text-on-accent`（V0 用 `--text-muted` / `--text-accent` 等代替）
- `--bg-accent-soft` / `--bg-accent` / `--bg-accent-strong`（V0 用 `--accent-primary` / `--accent-soft` 等代替）

### A.2 Typography
- `--font-serif`（Newsreader fallback chain）— blog body serif 启用时加
- 17 个语义 type-role tokens（`--type-h1` / `--type-display` / `--type-meta` 等）— V0 不 ship，consumer 自组合

### A.3 Spacing / Sizing / Radius
- spacing 进一步阶（如 `--spacing-40` / `-48` / `-64`）— V0 收窄到 19 阶
- icon `2xl` / avatar `xs` `2xl`（V0 收窄到 5+5+4 阶）
- radius `3xl: 24px`（V0 收窄到 8 阶）

### A.4 Shadow / Border
- shadow `2xl`（V0 ship 6 size）
- 命名 border style 扩展（`double`，V0 ship 3 种）

### A.5 Motion
- `--ease-back-out` / `--ease-spring`（V0 ship 4 ease）
- `float-gentle` / `pulse-soft` / `slide-up` / `slide-down` / `scale-in` keyframes（V0 ship `fade-in` + `pop-in`）

### A.6 Layer
- z-index `dropdown` / `fixed` / `menu` / `debug`（V0 ship 9 阶）

### A.7 Composed Tokens
- type-role 17 个（headers / body / caption / overline / meta / code-block / code-inline / prose-serif）— consumer 自组合 token

### A.8 Semantic Utilities
- `bg-surface-canvas` / `text-primary` / `border-default` / `bg-accent-soft` 等 Tailwind utility class — V0 仅 CSS variables；consumer 走 §6 recipe 自生成

### A.9 触发原则

V0 → v1.x 任何升级：
- **consumer 主动 ask**（多个项目都需要某 token，不 V1.x backlog）
- **使用模式重复 ≥3 次**（说明该 token 值得抽象）
- **走 RFC 0002+ 单独决议** — 不在 v1.0 spec 内追加

---

# End of v1.0 spec
