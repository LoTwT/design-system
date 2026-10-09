# 2026-10-10 · Token review 后续修正

- 日期：2026-10-10
- 状态：已实施并通过本地验收，尚未发布
- 实施基准：`965157a`
- 来源：对 `@ayingott/theme` token 设计与视觉效果的两轮 review；修复方案由用户在本次会话中选定

## 决策

### 1. 容器尺寸恢复 Tailwind 默认刻度（破坏性）

`layers/containers.css` 原来覆盖了 `--container-xs` … `--container-2xl`，但没有覆盖 Tailwind 默认的 `3xl`–`7xl`。合并后的刻度不是单调递增的：`max-w-2xl` 为 80rem，`max-w-3xl` 为 48rem，`max-w-4xl` 为 56rem；`@container` 变体也受同样影响。

主题现在只声明 `--container-reading`、`--container-content` 和 `--container-wide`。`max-w-*` / `@container` 的尺寸阶全部回到 Tailwind 默认刻度。

消费方迁移对照（左列为 v0.3.0 的值）：

| 旧写法 | 旧宽度 | 等价写法 |
| --- | --- | --- |
| `max-w-xs` / `var(--container-xs)` | 30rem | `max-w-120` |
| `max-w-sm` / `var(--container-sm)` | 40rem | `max-w-160` |
| `max-w-md` / `var(--container-md)` | 48rem | `max-w-3xl` |
| `max-w-lg` / `var(--container-lg)` | 64rem | `max-w-5xl` 或 `var(--container-content)` |
| `max-w-xl` / `var(--container-xl)` | 72rem | `max-w-6xl` |
| `max-w-2xl` / `var(--container-2xl)` | 80rem | `max-w-7xl` 或 `var(--container-wide)` |

`@xs` … `@2xl` 容器查询变体按同一张表换算。

### 2. 代码高亮色随主题切换并纳入契约

`--color-syntax-*` 原来只有一套浅色值，部分颜色在 Paper 代码背景上低于 4.5:1（数字 2.34:1、注释 3.37:1），在 Ink 上更低（函数 2.56:1、运算符 2.46:1）。

- Paper 与 Neo Light 使用新的深色值：keyword `#66569d`、string `#1d6f55`、function `#1d65bd`、number `#944b0f`、comment `#6b6252`、operator `#514a3e`。
- Ink 与 Neo Dark 使用浅色值：keyword `#c7b6f5`、string `#84dfbd`、function `#8dc5ff`、number `#ffc94a`、comment `#aa9e8b`、operator `#d7cdbc`。
- `.dark`、`.brutal`、`.brutal.dark` 分别重新声明这 6 个 token，沿用 `--shadow-card` 的模式：foundation 中的值为 Paper 默认值，由语义层按模式覆盖。
- Paper & Ink 契约与 Neo-Brutalism 契约各新增 24 个 legal pair，校验 6 个 token 在 `--surface-canvas` 和 `--reading-code-bg` 上达到 4.5:1。四种 root 状态下的最低值为 4.75:1（Neo Dark 注释）。
- 浏览器契约的公共角色从 69 个变为 75 个。去掉新增的 6 个角色后，三种模式的计算值摘要与 2026-09-12 的基线一致。

### 3. 暖色 `-2xs` / `-2xl` 阴影

Tailwind 默认的 `shadow-2xs` 与 `shadow-2xl` 使用纯黑。主题新增 `--shadow-2xs` 与 `--shadow-2xl`，保持 Tailwind 的几何参数，颜色改为与其他阴影一致的 `rgb(36 33 28 / α)`。

### 4. 文档澄清

- **中文字重**：在 Chrome 中实测，文楷在 `600`、`700`、`800` 下渲染结果完全相同，都比 `500` 粗，说明从 `600` 起由 Medium 合成加粗。README、skill、Fonts 页面与 v1.0 spec 明确写出：中文强调最高使用 `font-medium`。不改 CSS。
- **状态色**：`--status-*` 旧别名与 mint / amber / rose / sky 相关但并不等值，也不在契约中对表面做对比度校验（Paper warning 在画布上约 2.2:1）。skill 与 README 明确写出：文字用 `-fg`，单独的图标或描边用 `-border`。

### 5. `--border-strong` 成为控件边界角色

Paper / Ink 原来没有能满足 WCAG 2.2 SC 1.4.11 控件边界 3:1 的边框角色：展示页输入框使用的 `--border-default` 在 Paper 中约 1.4:1、Ink 中约 1.6:1，`--border-strong` 也只有 1.85:1 / 2.37:1。用户选择加深 `--border-strong`，不新增 token。

- Paper `--border-strong` 由 `rgb(25 23 19 / 0.28)` 改为实色 `#85837f`（约等于 52% 墨色叠在画布上），Ink 由 `rgb(247 241 230 / 0.28)` 改为实色 `#7d797b`（约等于 45% 米白）。改用实色是为了让契约能校验；Neo Dark 的边框已采用同样做法。
- Paper & Ink 契约新增 8 个 non-text legal pair，覆盖 canvas、panel、elevated、subtle 四种表面，最低值为 Paper subtle 3.24:1。
- 展示页 `.theme-input` 与契约 `input` 状态映射改用 `--border-strong`。Neo 中该角色已是 `--brutal-ink`（Light）或 `#d1cec4`（Dark），所以 Neo Dark 输入框边框比原来的 `#908e84` 更亮。
- `--border-default` 与 `--border-subtle` 不变，卡片和分隔线保持原来的柔和观感。悬停时使用 `--border-strong` 的地方会比原来更深。
- 浏览器契约中 Paper 与 Ink 的计算值摘要已刷新。临时把 `--border-strong` 改回旧值后，三种模式的摘要都与刷新前一致，说明只有这个角色变化。

### 6. `--ease-emphasized` 去掉回弹

原曲线 `cubic-bezier(0.2, 0, 0, 1.2)` 的 y2 大于 1，会超调回弹，与 spec 中"V0 不 ship back-out / spring"和 skill 中"No bounces, no springs"矛盾。改为 `cubic-bezier(0.05, 0.7, 0.1, 1)`：减速比 `--ease-standard` 更强，但不超调。该曲线目前只用于 `animate-pop-in`。

## 有意不改的项

| 项 | 原因 |
| --- | --- |
| 文楷作为全部角色的中文字体、完整字体文件体积 | 2026-09-12 决策已选择并记录体积 |
| Neo Dark 硬投影较弱 | 2026-09-09 spec 已记录为有意取舍；截图复核时卡片轮廓由 3px 边框承担 |
| Paper 主按钮悬停时前景翻转 | Paper/Ink QA 已验收 |
| 间距半档 `-5` 命名（`p-0-5`） | skill 文档明确约定半档用 `-5` 后缀；且 `var(--spacing-*)` 已被 layout / grid token 引用 |
| `font-regular` 与 Tailwind `font-normal` 并存 | `font-regular` 是文档中的推荐写法，`font-normal` 来自 Tailwind 默认主题 |
| `--opacity-muted` / `--opacity-subtle` 命名、`--text-md`、`--color-surface-*` 编号顺序 | 改名或删除属于破坏性改动，收益不足 |
| Paper 卡片层级 | 截图复核时卡片、代码块与画布可以区分 |

## 验收

```bash
pnpm check
pnpm site:typecheck
pnpm site:build
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' pnpm site:browser
```

浏览器：Chrome `154.0.8037.98`。
