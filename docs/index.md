# 文档索引

## 文档导航

在此收录项目文档，使用相对链接并说明适用的阅读场景；新增、移动或移除文档时同步维护导航。

| 文档 | 阅读场景 |
|---|---|
| [`architecture.md`](architecture.md) | 判断改动是否超出 V0 范围；修改公开导出、peer 依赖、`fonts.css` / `brutal.css` opt-in 边界或语义变量契约。 |
| [`development.md`](development.md) | 本地开发、运行 `pnpm check` 与 site 检查、复现固定版本的 Chrome 浏览器测试。 |
| [`release.md`](release.md) | 发布新版本、排查 release workflow、发布失败后的回滚。 |
| [`spec/design-system-v1.0.md`](spec/design-system-v1.0.md) | V0 设计系统契约：token、对比度表、对齐说明。 |
| [`spec/paper-ink-theme.md`](spec/paper-ink-theme.md) | Paper & Ink 默认主题的不变量与 dependency policy；合约见 `spec/paper-ink-theme-contract.json`。 |
| [`spec/rfc-brutal-theme.md`](spec/rfc-brutal-theme.md) | Neo-Brutalism 主题族的映射与交互；合约见 `spec/brutal-theme-contract.json`。 |
| [`rfc/0001-theme-v0.md`](rfc/0001-theme-v0.md) | `@ayingott/theme` 的包结构、CSS 分层与 smoke / pack gate 的来由。 |
| [`rfc/0002-reading-token-layer-v0.1.md`](rfc/0002-reading-token-layer-v0.1.md) | 长文阅读 token 层（`--reading-*`）的设计。 |
| [`decisions/index.md`](decisions/index.md) | DS-D-01~11 基础决策的背景与取舍：范围、Tailwind v4、仓库形态、showcase、skill、发布模型。 |

## 目录约定

`docs/` 下的其他文件和目录有实际内容时再创建；可沿用已有的合理结构。下表说明常见内容的归属，不限定全部可用路径，表中路径均相对于 `docs/`。

其他独立的项目级指导可用准确的主题名命名为 Markdown 文件，平铺在 `docs/` 下；需要组织多份相关文档时，可按主题建立子目录。

| 路径 | 内容归属 |
|---|---|
| `architecture.md` | 全局架构、模块关系、依赖边界与共享约束。 |
| `development.md` | 环境准备、开发方式、项目特有的编码约定、测试与验证方法。 |
| `release.md` | 版本管理、发布流程、发布专属检查与发布后验证。 |
| `spec/` | 专项需求、设计、必要的调研结论与取舍依据、接口合同、验收标准。本项目沿用 `spec/`（测试按此路径读取合约），不使用 `specs/`。 |
| `rfc/` | 已实施的 RFC，记录主要设计的提出背景。 |
| `references/` | 供查阅的领域资料、第三方约束与资料来源，由相关规格或实现引用。 |
| `decisions/` | 需要独立保存的重要决策历史、当时的背景与取舍。 |

## 内容维护

- 全局结构与共享约束由架构文档维护，具体功能的设计与行为由相关规格维护。
- 日常开发与验证方法归入 `development.md`，发布流程引用共用的方法或已有脚本，仅单独说明发布所需的步骤与检查。
- 参考资料保留事实与来源；被项目采用的设计选择和约束写入相关规格，并引用支撑资料。
- 简短的设计理由直接写在相关规格中；需要独立追溯决策时再创建 `decisions/` 中的记录，由当前规格引用。
- 较长的文档在开头给出概要或章节结构，便于按章节查阅。
- 草案与尚未确认的内容明确标注；被替代的决策指向后续决定，保留必要的历史背景。
- `site/`、`skills/`、`packages/theme/README.md` 与 `spec/` 是受合约测试保护的 living docs（必需短语、CSS 变量名、README 导出列表）；只与其描述的实现一起修改。文中复述的 token 数值不受检查。
- 不新增逐 PR 的决策记录或 QA 快照：改动理由与验证写在 PR 描述中，用户可见的变化由生成的 CHANGELOG 记录。新的 minor / major 版本线不需要单独的决策文档。
