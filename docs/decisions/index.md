# Design System 决策记录

> Owner：Product (@Product)
> 用途：每条决策独立编号、可逆性标注、来源可追溯
> 引用方式：在 RFC / spec / 实现 PR 中以 `DS-D-XX` 形式引用

---

## DS-D-01 V0 范围 = `@ayingott/theme` 唯一包

**决策**：design-system V0 仅交付一个 npm 包 `@ayingott/theme`，作为 Tailwind CSS-first theme 包（tokens / semantic vars / base / 少量通用 utilities）。

**V0 不包含**：

- 自研 component primitives 与组件 spec
- `@ayingott/vue` 或任何 Vue 组件包
- Reka UI / Nuxt UI / shadcn-vue 集成层
- adapter 包 / playground app / fixtures 目录
- VitePress 文档站
- ayingott.me 站点迁移

**可逆性**：中（V1.x 视真实消费方需求扩展，但范围扩展属于新决策）

**来源**：

- lo-user 2026-05-05 23:59 在 #design-system："component primitives 不考虑，后续用开源的 UI 框架"
- lo-user 2026-05-06 00:05 拍板 "1. 是" 接受 V0 = `@ayingott/theme` only

---

## DS-D-02 Engine = Tailwind CSS v4

**决策**：`@ayingott/theme` 基于 Tailwind CSS v4 CSS-first 模型实现。tokens 通过 `@theme` directive 输出 Tailwind utilities；semantic aliases 走 `:root` / `.dark` runtime CSS variables。

**不选 UnoCSS 的理由**：

- V0 范围 = 可发布、可复用的 CSS-first theme 包；Tailwind v4 `@theme` 原生支持把 token 直接转 utility
- 直接发布 CSS 源文件时，Tailwind v4 比 UnoCSS preset 更贴合包形态
- 未来 ayingott.me 接入开源 UI 框架时（Nuxt UI / shadcn-vue 等），Tailwind v4 是 happy path

**可逆性**：低（迁移成本高，但 V0 不阻断未来扩 UnoCSS preset 输出）

**来源**：

- lo-user 2026-05-06 00:05 拍板 "2. tailwindcss"
- TL RFC 1（Tailwind v4 vs UnoCSS）+ RFC 2（Vue + atomic CSS UI 框架对比）调研支撑

**ayingott.me 影响**：当前 ayingott.me 仍使用 UnoCSS。AY-D-05 errata 已在 ayingott.me 仓 PR #3 起草并 hold（lo-user 2026-05-06 00:20 决定等 `@ayingott/theme` V0 ship 后批量发：errata + UnoCSS → Tailwind v4 迁移 PR）。

---

## DS-D-03 仓库形态 = 独立仓 `LoTwT/design-system`

**决策**：design-system 独立仓（pnpm workspace 形态）：<https://github.com/LoTwT/design-system>。`@ayingott/theme` 作为该仓内的 `packages/theme/` 实施。

**理由**：

- V0 范围收窄为 theme-only 后，独立仓阻力大幅降低（无 30+ 组件维护）
- 独立仓可作为未来多消费方（ayingott.me + 第二个项目）的 npm 分发源
- 不内嵌 ayingott.me 避免设计决策与单消费方耦合

**可逆性**：中（合并到主项目仓需要重新 publish + 引用）

**来源**：

- lo-user 2026-05-06 00:05 拍板 "3. 独立仓库"
- lo-user 2026-05-06 00:07 提供 URL：<https://github.com/LoTwT/design-system>

---

## DS-D-04 V0 框架无关，组件 UI 框架选型推迟到消费方集成时

**决策**：DS V0 不预设组件 UI 框架（不绑定 Reka UI / Nuxt UI / shadcn-vue）。`@ayingott/theme` 仅提供 CSS theme，框架选择留给具体消费方在集成时决定。

**对应原则**："现在完成的是 design system 本身，不过度设计涉及任何后续内容"。

**可逆性**：高（任何消费方可独立选 UI 框架，DS 不约束）

**来源**：

- lo-user 2026-05-06 00:05 拍板 "4. 现在完成的是 design system 本身，不过度设计涉及任何后续内容"

**未来 ayingott.me 集成时**：建议由 ayingott.me 自身决策（候选 = Nuxt UI / shadcn-vue / Reka UI），不影响 DS V0。

---

## 字体配置（DS-D-01~04 的实施细节，记录但不单独编号）

V0 实际打包：

- **Space Grotesk Variable**（SIL OFL 1.1）— `--font-display`，weight 300-700
- **Space Mono Regular + Bold**（SIL OFL 1.1）— `--font-mono`

Fallback chain（CSS 引用，不打包）：

- macOS: PingFang SC / Hiragino Sans GB
- Windows: Microsoft YaHei
- 通用: system-ui / -apple-system / sans-serif / monospace

License notice：`packages/theme/THIRD_PARTY_NOTICES.md`（含 source / version / sha256 / weight 范围）。

加载方式：opt-in，consumer 显式 `@import "@ayingott/theme/fonts.css"`；只用 token 不加载字体文件。

**来源**：

- lo-user 2026-05-06 00:17 拍板 "先按原计划吧"
- UX baseline + TL RFC 0001 v0.3 final
