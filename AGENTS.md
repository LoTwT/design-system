# Agent 工作指南

本仓库是 Ayingott design system 的源码。新增或修改文档时沿用项目已有文档的主要语言；术语、命令和标识符保留原文。

- **查阅文档**：开始涉及项目行为、结构或约定的任务前，先查看 `docs/index.md`，按阅读场景只打开相关文档或章节；已知目标时可直接查阅。
- **及时更新文档**：变更使已有文档不准确或不完整时，在同一变更中更新相关文档；任务中确认且后续任务需要复用的约定、命令或约束，写入对应文档。无法确定或超出当前范围的更新，在报告中列为待办。
- **文档归属**：新增、移动或调整文档时遵循 `docs/index.md` 的目录约定并维护导航。本文件只保留每项任务都适用的规则，专题内容写入 `docs/`。
- **语义明确**：命名、类型、接口和结构应清晰表达意图，准确性优先于简短；注释说明代码无法直接表达的原因、约束和取舍，不复述代码行为；同一项事实只在一处定义，其他位置引用。
- **最小充分变更**：依据相关实现与既有约定，实施能够完整满足要求的最小连贯变更，避免无关的重构、清理或格式化。
- **自主推进**：在用户给定的目标和授权范围内完成必要工作，常规实现选择自行判断；遇到无法自行消解的关键歧义或需要超出现有授权时再提问，并继续推进不依赖该答复的工作。
- **验证**：根据变更影响选择必要的验证，优先使用项目已有的检查方式（如 `docs/development.md` 中记录的方法），如实报告失败与未验证的事项。

## 项目约束

- V0 范围仅限 `@ayingott/theme`：框架无关、Tailwind CSS v4 CSS-first 的主题包。除非后续决策明确扩大范围，不新增 component primitives、Vue 包、adapter、playground 或 fixtures。详见 `docs/architecture.md`。
- `@ayingott/theme` 不得 import `fonts.css` 或 `brutal.css`；字体与 Neo-Brutalism 保持由使用方 opt-in。
- `site/`、`skills/`、`packages/theme/README.md` 与 `docs/spec/` 是受合约测试保护的 living docs，只与其描述的实现一起修改。
- 发布只通过 `pnpm release:bump`，在 release PR 合并后从干净的 `main` 运行。详见 `docs/release.md`。
- 需要使用本设计系统生成 UI 的 AI 工具，从 `skills/ayingott-design-system/SKILL.md` 开始阅读。该 skill 仅是仓库文档，不属于 npm 包。
