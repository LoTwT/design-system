# Neo Dark 配色更新落地记录

- 日期：2026-09-09
- 状态：已实施并通过本地验收，尚未发布
- 实施基准：`5fe518013904a24cd57212f9d6b8d50cf36a7aa6`
- 采纳：[Neo Dark 配色更新 spec](../spec/2026-09-09-brutal-dark-refinement.md)
- 现行契约：[brutal-theme-contract.json](../spec/brutal-theme-contract.json)

## 决策与实现

按用户要求落实上述 spec：Neo Dark 使用暖炭灰表面、米白正文、独立的普通/强调边框、深紫选中背景和深色硬投影。全部建议色值已进入 [语义源码](../../packages/theme/src/semantic/brutal.css)。

正文、边框与投影分别决定颜色。内部 `--brutal-shadow` 在 Neo Light 为 `#111111`，在 Neo Dark 为 `#080808`；`--shadow-card`、`--shadow-panel` 以及 `pressable` 的 hover/active 均通过该变量决定投影颜色。消费者继续使用原有语义角色和 utility，物理 `shadow-hard-*` 工具继续跟随 `currentColor`。

本记录取代 [原 Brutal RFC](../spec/rfc-brutal-theme.md) 中语义投影使用正文 family ink 的约定。原 RFC、提案和原型 QA 附件保留为历史记录；当前行为以源码、执行契约和本记录为准。

六种贴纸色、对应前景、状态序列、布局、字体、边框宽度、圆角、120ms 交互时长及主题持久化保持原约定。包导出、默认入口、Paper/Ink 契约和契约 schema version 1 均保持不变。README 与设计系统 skill 的角色说明已同步。

## 验收结果

| 验收项 | 结果 |
| --- | --- |
| 正式对比度契约 | 原有 58 项 ID、minimum/target 完整保留，加入 spec 要求的 26 项；84 项均通过 |
| 暗色边界余量 | 普通/强调边框在六种背景上的源码与编译后计算样式均达到内部 3.2:1 目标；最低值为普通边框 / muted，约 3.27:1 |
| 回退防护 | 缺失内部投影色、投影重新绑定正文、hover/active 恢复旧映射、选中背景退回 muted、新配对被删除、普通描边余量不足均会失败 |
| 其他模式等价性 | Paper、Ink、Neo Light 各 69 个公共角色的浏览器计算值与更新前构建基线一致；默认入口源码、编译 CSS 与 Paper/Ink 契约校验值保持不变 |
| Neo Light / Dark 交互 | Rest、hover、持续按下，以及 native disabled、`aria-disabled`、`data-disabled` 的无位移/静态投影均通过 |
| reduced-motion | hover/active 无位移，交互时长归零；两种 Neo 模式均通过 |
| forced-colors | 独立 utility 保持 `ButtonText` 边框及 `Highlight` 焦点，浏览器隐藏投影；两种 Neo 模式均通过 |
| 响应式与焦点 | 1280、390、320px 下无页面横向溢出或卡片硬投影裁切；检查的控件均至少 44×44px，输入框可经 Tab 获得可见焦点 |
| 视觉复核 | 已检查正式构建的明暗卡片、阅读区、状态、选中背景、桌面与手机输入框焦点 |
| 真实包消费 | 默认入口与 opt-in 入口的 tarball 安装、编译和文档示例通过；公共导出、peer dependency、字体和 notices 检查通过 |

高对比模式中，Chrome 将展示页按钮的 hover/active 边框映射为系统 `Highlight`，并可能将焦点轮廓替换为更宽的原生 `auto` 轮廓。浏览器检查分别覆盖展示页按钮与独立 utility，验证系统颜色及可见焦点；普通模式仍验证明确的轮廓、投影与位移值。

## 已通过的命令

```bash
pnpm check
pnpm site:typecheck
pnpm site:build
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' pnpm site:browser
```

浏览器：Chrome `153.0.8010.36`。这些命令在正式修改后的源码上通过，补齐了原型阶段未动态验证的持续按下态、reduced-motion 和 forced-colors。

浏览器检查支持可选的 `THEME_BROWSER_ARTIFACT_DIR`，用于将验收截图保存到工作区外。原有精简后的 QA 附件继续保留；本次截图不作为包内容或额外仓库附件。

本次实施未提升版本或执行发布。
