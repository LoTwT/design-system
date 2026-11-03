# 架构与包契约

本文说明仓库的范围、各部分的关系，以及 `@ayingott/theme` 对使用方承诺的公开契约。设计 token 与主题的具体取值见 [`spec/`](spec/)。

## 范围

- V0 只交付一个 npm 包：`@ayingott/theme`。它是 Tailwind CSS v4 CSS-first 的主题包，包含 foundation token、layer token、语义变量、base 样式和少量可访问性 utility。
- 包保持框架无关。除非后续决策明确扩大范围，不新增 component primitives、Vue 包、adapter、playground 或 fixtures。范围的来由见 [`decisions/index.md`](decisions/index.md) 的 DS-D-01 与 DS-D-04。

## 仓库组成

| 路径 | 作用 |
|---|---|
| `packages/theme/` | 唯一可发布的包 `@ayingott/theme`。 |
| `site/` | VitePress 展示站，只用于展示，不属于包的契约，也不替代包的 smoke 与 pack 检查。 |
| `skills/ayingott-design-system/` | 供 AI 工具生成 UI 时使用的 skill。它是仓库文档，不随 npm 包发布。 |
| `docs/` | RFC、规格、决策与开发、发布说明。导航见 [`index.md`](index.md)。 |

## 包契约

- 公开 CSS 导出只有 `.`、`./index.css`、`./brutal.css`、`./fonts.css` 和 `./fonts/*`。
- Tailwind CSS `^4.0.0` 是必需的 peer dependency。发布的包不得暴露仓库内部的测试脚本。
- `@ayingott/theme` 不得 import `fonts.css`。Bricolage Grotesque、Space Mono、Literata 与 LXGW WenKai 字体由使用方 opt-in 加载。
- `@ayingott/theme` 不得 import `brutal.css`。Neo-Brutalism 由使用方在默认入口之后 opt-in 引入。
- `--surface-canvas`、`--text-primary` 等语义变量是运行时 CSS 变量，不保证生成对应的 Tailwind utility。
- 默认入口不注入全局 reduced-motion 策略。只有 opt-in 的 `pressable` utility 自带作用于 `.brutal` 的 reduced-motion 回退。
- 包内发布字体文件时，必须同时发布 `THIRD_PARTY_NOTICES.md`。
