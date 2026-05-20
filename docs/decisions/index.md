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

**决策**：`@ayingott/theme` 基于 Tailwind CSS v4 CSS-first 模型实现。tokens 通过 `@theme static` directive 输出完整 token CSS variables 并生成 Tailwind utilities；semantic aliases 走 `:root` / `.dark` runtime CSS variables。

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

## DS-D-05 Showcase site = `site/` 独立 VitePress 展示站

**决策**：启用独立 `site/` VitePress showcase，纯展示 design-system token / 视觉规则 / 字体 / utilities，不复用 `docs/` 作为站点根。

**不包含**：

- playground / live editor
- 组件库或 Vue component demos
- VRT / package contract gate / 真实 consumer smoke

**部署**：Cloudflare Workers Static Assets，Worker name `design-system`，custom domain `design.ayingott.me`。

**可逆性**：高（站点是展示层，可迁移或重构，不改变 package API）

**来源**：

- lo-user 2026-05-06 11:04 拍板：不要复用 `docs` 文件夹，使用 `site` 文件夹，仅做设计系统各部分展示，不兼容测试
- PR #5 VitePress showcase site
- PR #6 / #7 Workers Static Assets deployment

---

## DS-D-06 Theme tokens use `@theme static`

**决策**：foundation / layer token files 使用 Tailwind CSS v4 `@theme static`，强制输出所有 token CSS variables，而不是只输出被 utility 引用到的变量。

**理由**：

- `@ayingott/theme` 是共享 token package，token 本身就是 CSS variable contract
- showcase site 和未来 consumer 都可能直接用 `var(--token)` 消费 token，而不是只通过 utility class
- Tailwind v4 默认裁剪未使用的 `@theme` variables，会导致 token reference 页面和 consumer 直接取值失效
- 体积增量很小，优先保证契约稳定性

**可逆性**：中（可回退到裁剪模式，但需要另设 docs-only var 注入或限制 consumer 不直接使用未引用 token）

**来源**：

- lo-user 2026-05-06 16:47 线上部署后发现多个 token 展示未生效
- QA 线上 smoke 发现构建 CSS 缺失大量 raw token variables
- TL 根因确认：Tailwind v4 默认 only generates used CSS variables；共享 theme package 需要 `@theme static`

---

## DS-D-08 Repo-level AI agent skill

**决策**：design-system 仓库提供 repo-level AI agent skill：`skills/ayingott-design-system/SKILL.md`。该 skill 面向 Claude / Codex / Cursor 等 AI 工具，说明如何在消费方项目中正确使用 `@ayingott/theme` 的 token、semantic variables、dark mode、font opt-in、voice/tone 和 V0 边界。

**边界**：

- skill 是仓库文档，不是 `@ayingott/theme` npm package 内容
- 不新增 package exports / runtime dependency / icon library recommendation
- 不包含 logo / wordmark / Claude Design zip assets
- 不发明新 token；当 skill 与 spec 冲突时，以 `docs/spec/design-system-v1.0.md` 为准

**理由**：

- AI agent 是 design system 的实际消费方之一；提供单一入口可以减少跨项目使用时的 token/path 猜测和视觉漂移
- skill 让 ayingott.me 和未来项目复用 design language 时能稳定遵守 V0 contract
- repo-level 文档形式保持工具中立，不绑定 Claude 私有格式，也不污染 npm payload

**可逆性**：高（可删除或重写该 skill，不影响 package API 或 consumer runtime）

**来源**：

- lo-user 2026-05-06 明确：Claude Design zip 带来的改动全部不参考，只让 UX 用 `skill-creator` 为当前项目写 skill，并由 TL/QA review
- UX skill-creator 草稿 + TL/QA P0/P1 review

---

## DS-D-09 Release workflow = bumpp + tag-triggered CI + npm OIDC

**决策**：design-system 使用 `bumpp@11.1.0` 控制版本，并用 bumpp 自动加载的 `bump.config.ts` 统一 version files / commit / tag / push / changelog hook。仓库内所有 `package.json` 的 `version` 字段共享同一个 release version。`pnpm release:bump` 默认 patch bump；`pnpm release:bump X.Y.Z` 使用显式版本。

**发布目标**：当前唯一 npm publish 目标是 `@ayingott/theme`。design-system 保持单包发布路径：release workflow 在 `packages/theme` 下执行 `pnpm publish`。未来新增 public 子包时，需在同 PR 中重新设计 package selection、package-specific gates 和 registry smoke。

**commit / tag 格式**：沿用 bumpp 内置格式：

- commit：`chore: release vX.Y.Z`
- tag：`vX.Y.Z`

**CI release gate**：`.github/workflows/release.yml` 仅响应 `vX.Y.Z` tag push。发布前校验 tag/version/commit message/main/npm CLI 版本，随后运行 `pnpm install --frozen-lockfile`、`pnpm check`、`pnpm site:build`、`pnpm --filter @ayingott/theme pack:dry`。

**npm publish**：GitHub Actions 在受保护环境 `npm-publish` 中用 npm Trusted Publishing / OIDC 执行：

```bash
cd packages/theme
pnpm publish --access public --no-git-checks
```

Trusted Publishing automatically generates provenance attestations server-side, so the workflow must not pass the client-side `--provenance` flag.

发布后 CI 必须从 npm registry 安装 `@ayingott/theme@X.Y.Z`，并通过 package-specific smoke。当前 `packages/theme` 的 smoke 是安装 package 后通过 Tailwind v4 CSS 构建。

**release notes**：`git-cliff` 生成 `CHANGELOG.md` 和 GitHub Release body。CI 使用 `git-cliff --latest` 生成单版本 release notes，并通过 pinned `softprops/action-gh-release` 创建/更新 GitHub Release。

`CHANGELOG.md` 不放入 bumpp `files`，避免 bumpp 对文本文件做 version-string replacement。`bump.config.ts` 的 `execute` 函数运行 `pnpm changelog` 后显式把 `CHANGELOG.md` 加入 bumpp commit 文件集。

**retry safety**：`pnpm publish` 不写 npm `gitHead` metadata，workflow 不再使用 `gitHead` 作为 rerun skip guard。workflow 在 publish 前检查 npm version absence；如该版本已存在，CI fail fast，已 publish 的错误版本走 deprecate + next patch 的 fix-forward 路径。

**首发 fallback**：如果 npm 要求 package 已存在后才能配置 Trusted Publisher，`0.0.1` 首发可使用一次性细粒度 token 放在 protected environment 内完成；首发后迁移到 Trusted Publishing 并撤销 token。

**rollback**：tag / GitHub Release 发错但未 publish 时删除 tag/Release 后重发；已 publish 的版本不依赖 unpublish，走 deprecate bad version + 发布 patch。

**可逆性**：中（release 自动化可调整，但 npm 已发布版本不可覆盖）

**来源**：

- lo-user 2026-05-07 / 2026-05-08 在 #design-system 要求用 bumpp 控制版本并调研 CI/OIDC 发布
- QA release-readiness 建议：publish 走 npm CLI + OIDC，release workflow 不使用 package-manager cache，post-publish registry smoke 必做
- TL bumpp 调研：`bumpp@11.1.0` 内置 commit/tag 格式、programmatic API、`noGitCheck: false` 语义
- lo-user 2026-05-12 在 #ai / #design-system 锁定 v3 runbook 迁移：design-system 先迁移验证，release workflow 改为 pnpm-first publish，删除本仓 worked-example runbook copy，改用 LoTwT/ai canonical runbook

---

## DS-D-10 V0.0.x 自动 publish + tag-protection 替代 fail-safe

**决策**：design-system V0.0.x patch 阶段，CI release pipeline **不再使用 npm-publish protected environment 的 required reviewer 作为 publish 前 gate**。改为把 fail-safe 上移到 **tag 创建一步**（GitHub Ruleset `Protect release tags` 限制 `v*.*.*` 模式只允许 admin push / update / delete）。

**改动汇总**（lo-user 2026-05-10 02:16 现场操作）：

- **Settings → Environments → `npm-publish`**：从 Required reviewers 列表中移除 `@LoTwT`。effect：tag push 触发的 release CI 不再需要 30s 人工 approve（包括 first-attempt + rerun）。
- **Settings → Rules → Rulesets**：新建 `Protect release tags` ruleset，target tags `Include by pattern: v*.*.*`，bypass list = Repository admin。Rules 勾选 `Restrict creations / Restrict updates / Restrict deletions`。effect：只有 repo admin 可创建 / 修改 / 删除 `v*.*.*` 形式的 tag；其他 token 或 collaborator 都被拦。

**fail-safe 模型**：

- **真正担心的不可逆动作 = 错误的 tag 进入 release pipeline**。`pnpm release:bump` + tag push 是显式人为操作（不会无意 `git push --tags`），且 tag-protection 使误推被 ruleset 拦下。
- **CI 之后无需 re-approve**：tag 已通过 admin gate → bumpp 已打了正确 version → release pipeline 跑 OIDC publish + smoke + Release，不再需要人工干预。
- **registry 万一发错版本**：走 `npm deprecate` + 新 patch（DS-D-09 rollback policy 已覆盖），不依赖 unpublish。

**适用范围**：V0.0.x patch 阶段。如果后续到 V0.1+ / V1+ 形态决定需要更严格的人工 confirm gate（如向 stable 用户 broadcast），可单独决策恢复 reviewer 或拆 environment（V0.0.x auto-publish env / V0.1+ gated env）。

**配套：DD-012 retry safety**：与 DS-D-10 同时落地的 release.yml CI patch（PR #13，commit `1f9bf89e`）把 registry install smoke 包进 retry-with-backoff（6 × 10s `until` loop ≈ 60s 预算），消除 npm CDN propagation race 导致的 first-attempt smoke fail（auto-publish 后无人工 rerun 的依赖）。两改一起把 V0.0.x release CI 的人工干预降到 0。

**可逆性**：高（GitHub Settings UI / Ruleset 可一键回滚；workflow 配置改动也可回退）

**来源**：

- lo-user 2026-05-10 02:01 `ae11d396` 反馈"registry smoke 需要等待 npm cdn 同步完成"暴露 first-attempt race
- lo-user 2026-05-10 02:10 `cb1408d9` 提出删 reviewer 的方向
- TL 技术倾向 (A) + tag-protection 组合（msg `78b611b9` / `e7cc79ae`）
- lo-user 2026-05-10 02:16 `6e2155bf` 完成 (a) reviewer 删除 + (b) tag ruleset 配置

---

## DS-D-11 Reading token layer = design-system V0.1 additive layer

**决策**：新增 long-form reading token layer 到 `@ayingott/theme`，作为 V0.1 minor additive release。该层服务 MIRU V0 阅读体验，并可被 ayingott.me blog 正文和 docs 站长文复用。

**新增范围**：

- `foundation/typography.css` 增加 `--font-reading` 和 `--leading-reading`
- 新增 `semantic/reading.css`，提供 `--reading-*` runtime variables
- `fonts.css` opt-in 增加 Newsreader Latin / Latin Extended `opsz` variable normal woff2
- `THIRD_PARTY_NOTICES.md`、smoke、pack-dry、contrast gate 同步更新

**边界**：

- 不改现有 token 值，纯 additive
- 不新增 public export；仍通过 `@ayingott/theme` 聚合导入
- `@ayingott/theme` 仍不自动 import `fonts.css`
- 不 bundle CJK serif 字体，CJK 只保留 fallback names
- `--container-reading` / `--layout-prose-width` 继续表示 layout 宽度；`--reading-measure` 表示正文排版 measure

**可逆性**：中（新增 token 可废弃或调整，但 npm release 后不能覆盖已发布版本）

**来源**：

- lo-user 2026-05-20 在 V3 org migration 后锁定 MIRU OQ-miru-1：reading tokens 归 design-system
- UX-Sunna RFC task #54：MIRU first consumer，未来 ayingott.me / docs 复用
- TL-Anby + QA-Dialyn cross-review：`--reading-link` 不得用 `--accent-primary`，需走 `--text-accent` 以满足正文小字号 AA

---

## 字体配置（实施细节，记录但不单独编号）

V0 实际打包：

- **Space Grotesk Variable**（SIL OFL 1.1）— `--font-display`，weight 300-700
- **Space Mono Regular + Bold**（SIL OFL 1.1）— `--font-mono`
- **Newsreader Variable**（SIL OFL 1.1）— `--font-reading`，latin / latin-ext，optical size + weight variable

Fallback chain（CSS 引用，不打包）：

- macOS: PingFang SC / Hiragino Sans GB
- Windows: Microsoft YaHei
- 通用: system-ui / -apple-system / sans-serif / monospace

License notice：`packages/theme/THIRD_PARTY_NOTICES.md`（含 source / version / sha256 / weight 范围）。

加载方式：opt-in，consumer 显式 `@import "@ayingott/theme/fonts.css"`；只用 token 不加载字体文件。

**来源**：

- lo-user 2026-05-06 00:17 拍板 "先按原计划吧"
- UX baseline + TL RFC 0001 v0.3 final
