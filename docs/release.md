# 发布

本文说明 `@ayingott/theme` 的版本管理、发布步骤、release workflow 的结构与回滚方式。通用的 npm 发布流程见跨仓库 runbook [`LoTwT/ai/docs/npm-release-from-zero-to-shipped.md`](https://github.com/LoTwT/ai/blob/main/docs/npm-release-from-zero-to-shipped.md)，本文只记录本仓库特有的实现。

相关文件：

- `scripts/release-bump.mjs`：发布入口，创建 release commit 与 tag 并原子推送。
- `bump.config.ts`：bumpp 配置，包括版本文件、commit/tag 格式与 changelog hook。
- `cliff.toml`：CHANGELOG 与 GitHub Release notes 的生成规则。
- `.github/workflows/release.yml`：由 tag 触发的校验、发布、GitHub Release 与 registry smoke。

## 版本

- 仓库内所有 `package.json` 共用同一个版本。根 package 是 private，但版本与 `packages/theme/package.json` 保持一致，使 tag、文档与包元数据对齐。
- `@ayingott/theme` 是唯一可发布的包。
- 正式版发布到 npm dist-tag `latest`，可以成为最新的 GitHub Release。预发布版（如 `v1.0.0-rc.1`）发布到 `next`，标记为 GitHub prerelease，并且不得成为 latest。
- 新的 minor / major 版本线不需要单独的决策文档。breaking change 在 commit 标题中用 `!` 标记，生成的 CHANGELOG 会加上 `**BREAKING**` 前缀。

## 发布步骤

1. 合并 release PR 后，从干净且与 live `origin/main` 一致的 `main` 开始，确认各 `package.json` 版本一致。
2. 确认目标 npm 版本与远端 release tag 都不存在。
3. 运行 [`development.md`](development.md#验证) 中的全部验证命令。
4. （可选）在隔离的 checkout 中运行 `pnpm release:bump X.Y.Z --yes --no-push` 演练，检查生成的 changelog 与 site 文案。
5. 在干净的 `main` 上运行 `pnpm release:bump X.Y.Z`（不带版本时为 patch）。push 被拒绝后，不要重新运行已完成的 bump。
6. 只有在校验、npm 发布、GitHub Release 创建与 registry install smoke 全部成功后，才算发布完成。完成后回读 npm 上的版本与 dist-tag。

## 版本 bump

`pnpm release:bump` 运行 `scripts/release-bump.mjs`，后者调用 `bumpp@11.1.0` 并加载 `bump.config.ts`：

- 只能在 `main` 上运行，要求工作区干净（包括 untracked 文件），且本地 `HEAD` 与远端 `main` 一致。
- 版本文件为 `package.json` 与 `packages/theme/package.json`。
- commit 与 tag 使用 bumpp 内置格式：`chore: release vX.Y.Z` 与 `vX.Y.Z`。
- `execute` 先运行 `scripts/sync-release-docs.mjs` 更新 site 中的版本文案，再运行 `pnpm changelog`，并把 `CHANGELOG.md` 与这些 site 文件加入 release commit。
- bumpp 自身的 push 已关闭（`push: false`）。脚本确认只产生了一个干净的 commit 与对应 tag 后，用 `git push --atomic` 只推送这个 commit 到 `main` 和这个 tag，不推送其他 tag。`--no-push` 只在本地准备 commit 与 tag。

`CHANGELOG.md` 不放在 bumpp 的 `files` 中：bumpp 会对非 manifest 文件做版本字符串替换，从而改写旧版本的 changelog 标题。

## Changelog 与 release notes

`pnpm changelog` 用 `git-cliff` 把下一个版本的条目插入 `CHANGELOG.md` 顶部，已有的手写条目保留在下方。

校验 job 从 tag 生成 GitHub Release notes：

```bash
pnpm exec git-cliff --latest --strip header --output release-artifact/release-notes.md
```

## Release workflow

`release.yml` 只由 semver tag push 触发，按信任边界拆成四个 job：

| Job | 权限 | 作用 |
|---|---|---|
| `validate` | `contents: read` | 校验元数据，运行全部检查，生成 tarball 与 release notes，并上传带 SHA-256 的 artifact。 |
| `publish` | `actions: read`、`id-token: write` | 下载并校验 artifact，确认 npm 上不存在该版本后通过 OIDC 发布。不 checkout 仓库，也不运行仓库的构建脚本。 |
| `github-release` | `actions: read`、`contents: write` | 校验 release notes 后创建 GitHub Release。 |
| `registry-smoke` | 无仓库权限 | 在新的临时消费方中安装已发布的包并编译。 |

所有第三方 action 都固定到完整 commit SHA，checkout 关闭了凭据持久化。

### 校验

`validate` 检查：

- tag 是带 `v` 前缀的 semver；
- 根 `package.json` 与 `packages/theme/package.json` 的版本等于 tag 版本；
- release commit 标题等于 `chore: release vX.Y.Z`；
- tag 指向的 commit 包含在 `origin/main` 中；
- npm CLI 版本 `>= 11.5.1`。

随后运行 `pnpm install --frozen-lockfile`、`pnpm check`、`pnpm site:typecheck`、`pnpm site:build` 与 `pnpm site:browser`（使用固定版本的 Chrome for Testing），再生成供 `publish` 使用的 tarball。artifact 保留一天，`publish` 与 `github-release` 使用前都会独立校验 SHA-256。

### npm 发布

`publish` 在 `npm-publish` environment 中通过 npm Trusted Publishing / OIDC 发布已校验的 tarball：

```bash
npm publish "./<tarball>" --access public --tag "$NPM_TAG" --ignore-scripts
```

- 仓库内的相对 tarball 路径必须带 `./` 前缀（或使用绝对路径），否则 npm 11 可能把含斜杠的相对路径解析成 Git package spec。
- `$NPM_TAG` 对正式版是 `latest`，对预发布版是 `next`。
- Trusted Publishing 会在服务端自动生成 provenance，workflow 不传 `--provenance`。
- Trusted Publishing 要求 npm CLI 11.5.1 或更高、Node 22.14.0 或更高；workflow 使用 Node 24。
- Trusted Publisher 绑定为：package `@ayingott/theme`、repository `LoTwT/design-system`、workflow `release.yml`、environment `npm-publish`。
- 发布 tarball 不依赖 npm `gitHead` 元数据。`publish` 以 “版本不存在” 作为重试前的检查；如果版本已经发布到 npm，用下一个 patch 修复，不要重新运行同一次发布。

npm 发布成功后，`github-release` 用 `softprops/action-gh-release` 创建 Release。registry smoke 在其后运行，因此 npm CDN 传播延迟不会阻止 release notes 发布。

### Registry smoke

`registry-smoke` 新建临时 package，安装 `@ayingott/theme@X.Y.Z` 以及 workflow 中固定版本的 `tailwindcss` 与 `@tailwindcss/cli`，然后编译一个依次 import `tailwindcss`、`@ayingott/theme/fonts.css`、`@ayingott/theme` 的 CSS 文件。

- 用有上限的重试等待 npm registry 传播（次数与间隔见 workflow）。每次先用 `npm view` 确认版本可见，再做一次全新安装，以便单独发现 tarball 或依赖的传播延迟。
- 检查编译结果包含语义变量、阅读 token（`--reading-link`、`--reading-measure`）、Tailwind token utility（含 `font-reading`）、`@font-face`、`fonts.css` 引用的每个字体文件，以及 focus-ring 与 touch-target utility。

## 发布控制与已接受的风险

- `v*.*.*` tag ruleset 是发布前的控制：只有仓库管理员可以创建、更新或删除 release tag。
- `npm-publish` environment 只是 OIDC 绑定，没有 required reviewer，也没有部署分支或 tag 限制，不能称为受保护的 environment。
- 已接受的风险：`main` 没有强制 CI 的 branch ruleset，仓库管理员保留 bypass。

## 回滚

- tag 或 GitHub Release 有误、但尚未发布到 npm 时：删除 GitHub Release 与 tag，修正 release commit 后重新打 tag。
- CI 在发布前失败时：修正 release commit，删除失败的 tag 后再重新打 tag。
- 已经发布到 npm 的版本不依赖 unpublish：deprecate 有问题的版本并发布下一个 patch。
- 发布部分成功时：先检查 npm registry 的实际状态，不要对已存在的版本盲目重试。

## 参考

- npm Trusted Publishing：<https://docs.npmjs.com/trusted-publishers/>
- npm provenance：<https://docs.npmjs.com/generating-provenance-statements/>
