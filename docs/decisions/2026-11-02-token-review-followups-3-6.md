# 2026-11-02 · Token review 第 3–6 项

- 日期：2026-11-02
- 状态：已实施并通过本地验收，尚未发布
- 实施基准：`67e056a`
- 来源：第三轮 token review 的第 3–6 项（第 1、2 项见 `2026-11-01-shadow-opacity-utility-fixes.md`）；用户选择全部按建议处理：3A、4A、5A、6B

## 决策

### 1. Neo 的 danger 与 info 使用独立贴纸色，统一黑字

原来 `--status-danger` / `-bg` 使用 `--brutal-orange`，与 `--accent-primary-active` 相同，按下的主按钮与危险状态无法区分；`--status-info` / `-bg` 使用 `--brutal-blue`，与 Neo Light 的 `--text-accent` 和焦点环同色。

- 新增家族色 `--brutal-red: #ff3b3b` 与 `--brutal-sky: #5fa8ff`，Neo Light 与 Neo Dark 相同。
- `--status-danger` / `-bg` 改用 `--brutal-red`，`--status-info` / `-bg` 改用 `--brutal-sky`。四个状态的 `-fg` 都是 `--brutal-sticker-ink`（danger 5.34:1、info 7.67:1），`-border` 保持 `--brutal-sticker-ink`。
- 用户在本地对比了两个方案后选择黑字：
  - 深红 `#d1203a` 配白字：与橙色的亮度差更大（0.15 对 0.32），但状态卡片中出现两种文字颜色，深红、深蓝在 Neo 的亮色贴纸里偏沉。
  - 亮红 `#ff3b3b` 配黑字（采用）：四张状态卡片统一为「亮色贴纸 + 黑字 + 黑边框」。在黑字达到 5:1 的候选中，它与橙色的亮度差最大（0.25 对 0.32），色相为 0° 对 10°。
- 红与橙并排时仍较接近，但按下态只在按住时出现并伴随位移与阴影收起，状态卡片带图标与文字，不只靠颜色传达含义。要进一步拉开差距，应改按下态的颜色；红色再暗会低于 5:1。
- `--accent-primary-active` 仍为橙色；warning 与 `--accent-primary` 同为黄色，作为调色板的取舍保留。
- Neo 契约新增 legal pair `brutal-sticker-red` 与 `brutal-sticker-sky`（黑字，目标 5:1）。

### 2. WenKai 改用私有 CSS 字体族名

四个字体栈都引用 `"LXGW WenKai"`。消费方只用 token、不加载 `fonts.css` 时，这个名字会匹配到本机安装的完整文楷，英文正文与代码会改用文楷，代码失去等宽对齐。

- `fonts.css` 中两个 `@font-face` 的 `font-family` 改为 `"Ayingott WenKai"`，`--font-display`、`--font-sans`、`--font-reading`、`--font-mono` 同步改名。字体文件、权重、`unicode-range` 不变。
- 加载 `fonts.css` 的消费方渲染结果不变；不加载时，私有名不匹配任何字体，Latin 文本回到各角色原有的回退字体栈。
- smoke 新增检查：四个字体栈都必须引用私有族名，且不得出现 `LXGW`。

### 3. popover / tooltip 位于 modal 之上（破坏性）

原来 `--z-popover: 400`、`--z-tooltip: 500` 低于 `--z-modal: 900`。对话框中打开、渲染到 body 下的下拉菜单与提示会被对话框遮住。

| Token | 旧值 | 新值 |
| --- | --- | --- |
| `--z-overlay` | `800` | `800` |
| `--z-modal` | `900` | `900` |
| `--z-popover` | `400` | `1000` |
| `--z-tooltip` | `500` | `1100` |
| `--z-toast` | `1000` | `1200` |

`--z-base`、`--z-raised`、`--z-sticky`、`--z-header` 不变。smoke 中的严格顺序检查改为新顺序。

### 4. 指示器使用 `--text-accent`，不新增 token

Paper 的 `--accent-primary`（`#9c8fd9`）在画布上只有 2.70:1，不能单独作为复选框、开关、进度条、选中 tab 下划线等非文字指示。

- 不新增 token。README、skill 与展示站说明：单独出现的指示器使用 `--text-accent`；`--accent-primary` 是承载 `--accent-contrast` 内容的填充面。
- `--text-accent` 在四种 root 状态的 canvas、panel、elevated、subtle 上最低为 Neo Light subtle 4.27:1。两份契约各新增 8 个 non-text legal pair（每种模式 4 个表面，最低 3:1）。
- skill 中 `--accent-primary` 的用途去掉了 "active toggle"。

## 契约与验收证据

- 默认编译基线 `compiledSha256` 已刷新；新旧编译输出的 diff 只有四个字体栈的族名与五个 z-index 值。
- Paper & Ink 契约的 legal pair 摘要、文件摘要，以及 Neo 契约的 declarations、legal pair 摘要已刷新。
- 浏览器契约中 Paper、Ink、Neo Light 的计算值摘要已刷新。临时恢复 `typography.css`、`fonts.css` 与 `semantic/brutal.css` 后，三个摘要与刷新前完全一致，说明公共角色的计算值只因族名与 Neo danger / info 改变。

## 有意不改的项

| 项 | 原因 |
| --- | --- |
| Space Mono、Literata、Bricolage Grotesque 的族名 | 本机安装的同名字体就是同一字体，不会改变角色的字体选择 |
| Neo warning = 主按钮黄 | 调色板取舍；Warning 卡片带图标，主按钮是可点击的实心块，形态不同 |
| 新增 `--accent-indicator` | 先用文档约定；有消费方需要时再单独决策 |

## 验收

```bash
pnpm check
pnpm site:typecheck
pnpm site:build
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' pnpm site:browser
```

浏览器：Chrome `156.0.8078.79`。
