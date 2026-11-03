# 开发与验证

本文说明本地开发环境、常用命令和提交前需要运行的检查。

## 环境

- 依赖使用 pnpm 安装：`pnpm install`。
- `pnpm check` 需要 Python 3，用于运行字体 vendoring 的失败用例测试。这些测试只用标准库，可离线运行。
- `pnpm site:browser` 需要本地 Chrome 或 Chromium，见下文。

## 验证

改动后按影响范围运行：

```bash
pnpm check
pnpm site:typecheck
pnpm site:build
CHROME_PATH=<chrome-binary> pnpm site:browser
```

- `pnpm check` 包括：字体 vendoring 失败用例测试、源码 smoke、包 dry-run、用真实 tarball 分别在 Tailwind peer 下限（`4.0.0`）与 workspace 版本下安装并编译的消费方测试、site 对比度检查，以及 living docs 的 token 检查。
- `pnpm site:typecheck` 与 `pnpm site:build` 校验 VitePress 实现。`site:build` 同时是可移植的静态构建与产物检查。
- `pnpm site:browser` 在构建产物上运行 Playwright 浏览器合约（主题族初始化与真实 Chrome 中的行为）。它也在 CI 的 `site` job 和 release workflow 中运行，因此推送影响浏览器表现的改动前要先在本地跑过。

PR 会运行 CI 的 `check` 与 `site` 两个 job，但目前没有 `main` ruleset 强制要求它们通过。

## 浏览器测试使用的 Chrome

`playwright-core` 不会自动下载浏览器。Chrome 不在标准位置时，用 `CHROME_PATH` 指定。要复现 CI 固定的版本，运行：

```bash
pnpm dlx @puppeteer/browsers@3.0.6 install chrome@150.0.7871.124 --path .cache/chrome-for-testing --format "{{path}}"
CHROME_PATH=/absolute/path/from-above EXPECTED_CHROME_VERSION=150.0.7871.124 pnpm site:browser
```

CI 与 release 校验使用同一个 Chrome for Testing 版本，并拒绝版本漂移。

## 展示站

```bash
pnpm site:dev
pnpm site:build
pnpm site:browser
```

`site/` 只用于展示，不替代包的 smoke 与 pack 检查。
