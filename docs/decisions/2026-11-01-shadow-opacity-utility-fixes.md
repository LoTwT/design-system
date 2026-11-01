# 2026-11-01 · 阴影角色与透明度 token 的工具类修正

- 日期：2026-11-01
- 状态：已实施并通过本地验收，尚未发布
- 实施基准：`97dd676`
- 来源：对 `@ayingott/theme` token 设计的第三轮 review；用户选择先修第 1、2 项

## 决策

### 1. `shadow-card` / `shadow-panel` 工具类随模式切换（破坏性）

Tailwind 的 shadow 工具类为了支持 `shadow-color`，会把 `@theme` 中的值内联到生成的类里。原来 `--shadow-card: var(--shadow-sm)` 在 `@theme static` 中，编译结果是：

```css
.shadow-card { --tw-shadow: var(--shadow-sm); ... }
```

工具类不读取 `--shadow-card`，所以 `.dark`（`none`）、`.brutal` 与 `.brutal.dark`（零模糊硬投影）的重映射对 `class="shadow-card"` 都不生效，只有 `var(--shadow-card)` 与 `pressable` 能拿到正确的值。`--shadow-panel` 也一样。

- `--shadow-card` 与 `--shadow-panel` 移出 `@theme`，改为 `foundation/shadow.css` 中的 `:root` runtime 变量，Paper 默认值不变。
- 新增 `@utility shadow-card` 与 `@utility shadow-panel`，输出 `box-shadow: var(--shadow-card)` / `var(--shadow-panel)`。
- 不沿用 Tailwind 的 `--tw-shadow` 组合方式：Ink 中的值是 `none`，放进 `box-shadow` 列表会让整条声明失效。代价是这两个工具类不能与同一元素上的 `ring-*` 叠加，与 `pressable` 的行为一致。
- 消费方在自己的 `@theme` 中覆盖 `--shadow-card` / `--shadow-panel` 不再影响工具类，需要改为在 `:root` 中覆盖。

### 2. `--opacity-*` 改用百分比（破坏性）

原值为无单位小数（`0.45` 等）。`opacity-disabled` 可以用，但 Tailwind 的颜色修饰符（例如 `bg-black/disabled`）会生成 `color-mix(in oklab, var(--color-black) var(--opacity-disabled), transparent)`。`color-mix()` 只接受百分比，代入小数后整条声明无效，背景直接消失。

| Token | 旧值 | 新值 |
| --- | --- | --- |
| `--opacity-disabled` | `0.45` | `45%` |
| `--opacity-muted` | `0.62` | `62%` |
| `--opacity-subtle` | `0.72` | `72%` |
| `--opacity-overlay` | `0.76` | `76%` |
| `--opacity-emphasis` | `0.88` | `88%` |

`opacity: var(--opacity-*)` 的结果不变。在 `calc()` 中把这些变量当无单位数字参与计算的消费方需要改写。

### 3. 契约与文档

- `test/utility-browser.mjs` 在四种 root 状态下断言：`shadow-card` / `shadow-panel` 的计算值与 `box-shadow: var(--shadow-card)` / `var(--shadow-panel)` 一致，且 `bg-black/disabled` 渲染为 45% 黑色。检查前重置媒体模拟，避免前一组 forced-colors 断言残留。
- 临时恢复旧的 `shadow.css` 与 `opacity.css` 后，四种状态的这项检查全部失败；恢复新实现后通过。
- 默认编译基线的 `compiledSha256` 已刷新。新旧编译输出的 diff 只有两项：两个阴影角色从 theme 层移到 `:root`；五个透明度值改为百分比。
- README Contract、`docs/spec/design-system-v1.0.md` 与 `skills/ayingott-design-system/references/tokens.md` 同步更新。

## 暂未处理的 review 项

本轮 review 的其他项留待后续决策：Neo 语义色撞色（warning = 主按钮黄、danger = 按下态橙）、本机安装文楷时未加载 `fonts.css` 的字体回退、`popover` / `tooltip` 层级低于 `modal`、Paper 缺少 3:1 的强调色指示角色、Neo 中重复声明的 reading 角色、孤立的 `--shadow-focus`、Ink 状态色未引用色阶、语义变量与 Tailwind 命名空间同前缀。

## 验收

```bash
pnpm check
pnpm site:typecheck
pnpm site:build
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' pnpm site:browser
```

浏览器：Chrome `156.0.8078.79`。
