# 2026-11-03 · Neo Light 选中态对比度与 Neo Dark 语法色归位

- 日期：2026-11-03
- 状态：已实施并通过本地验收，尚未发布
- 实施基准：`a1cd555`
- 来源：#64 之后评估 Neo token 是否需要随 Paper/Ink 调整；用户选择同时处理「选中态对比度」与「语法色残留」两项

## 结论

Neo 在 `.brutal` 与 `.brutal.dark` 中重新声明了全部语义角色，Paper/Ink 在 #64 的表面、文字、主操作调整不会传导到 Neo。Paper 去黄、Ink 紫调与 lavender 主操作属于 Paper/Ink 的家族特征，Neo 保持奶油画布、暖炭灰与贴纸色，不跟随。

本次只处理两处与家族方向无关的问题。

## 决策

### 1. Neo Light `--text-muted` 在选中背景上达到 4.5:1

#64 为 Paper/Ink 新增了 `text-muted` 在 `--accent-soft` 上的契约检查，Neo Dark 已有同类检查，Neo Light 没有任何 `accent-soft` 文字 pair。实测 `#5a5141` 在 `--brutal-purple #c3a6ff` 上为 3.80:1。

| Token | 旧值 | 新值 |
| --- | --- | --- |
| Neo Light `--text-muted` | `#5a5141` | `#4a4235` |

新值仍是暖棕色，对比度：选中背景 4.82:1、画布 9.19:1、`--surface-muted` 7.09:1、`--surface-subtle` 8.23:1。

Neo 契约新增 `brutal-light-primary-selected`（9.19:1）、`brutal-light-secondary-selected`（6.00:1）、`brutal-light-muted-selected`（4.82:1），并列为必需 pair；恢复旧值会使契约测试失败。

`--text-accent`（`#3d5afe`）在 Neo Light 选中背景上约 2.50:1。保留 brutal blue，不新增 link-selected pair；README 与 skill 说明选中项内的链接使用 `--text-primary` 加下划线。

### 2. Neo Dark 语法 comment / operator 使用 Neo 自身的文字色

Neo Dark 的 `--color-syntax-comment #aa9e8b` 与 `-operator #d7cdbc` 是 #64 之前 Ink 的 `--text-muted` / `--text-secondary`，带卡其色偏，与 Neo Dark 的中性暖灰不一致。

| Token | 旧值 | 新值 |
| --- | --- | --- |
| Neo Dark `--color-syntax-comment` | `#aa9e8b` | `#aaa89e`（= Neo Dark `--text-muted`） |
| Neo Dark `--color-syntax-operator` | `#d7cdbc` | `#c3c1b8`（= Neo Dark `--text-secondary`） |

对比度：comment 在代码块背景 5.24:1、画布 7.38:1；operator 6.93:1、9.75:1。沿用 Paper/Ink 的写法，使用字面值而不是 `var()`。

Neo Light 的 comment `#6b6252` / operator `#514a3e` 与奶油画布协调且达标，保持不变。

## 影响

- 默认入口（Paper/Ink）源码、编译产物与契约不变。
- 破坏性：Neo Light `--text-muted`、Neo Dark `--color-syntax-comment` / `-operator` 计算值变化。
- Neo 契约 `declarations` 与 `legalPairs` digest 刷新；浏览器测试中 Neo Light 的公共角色 digest 刷新，Paper 与 Ink 不变。
