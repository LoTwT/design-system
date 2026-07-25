import { execSync } from 'node:child_process'
import { resolve } from 'node:path'
import { defineConfig } from 'bumpp'

export default defineConfig({
  files: [
    'package.json',
    'packages/theme/package.json',
  ],
  commit: true,
  tag: true,
  push: true,
  install: false,
  recursive: false,
  noGitCheck: false,
  execute: (operation) => {
    execSync(`node scripts/sync-release-docs.mjs ${operation.state.newVersion}`, {
      cwd: operation.options.cwd,
      stdio: 'inherit',
    })
    execSync('pnpm changelog', {
      cwd: operation.options.cwd,
      stdio: 'inherit',
    })

    operation.update({
      updatedFiles: [
        ...operation.state.updatedFiles,
        resolve(operation.options.cwd, 'CHANGELOG.md'),
        resolve(operation.options.cwd, 'site/index.md'),
        resolve(operation.options.cwd, 'site/guide/getting-started.md'),
        resolve(operation.options.cwd, 'site/guide/package-contract.md'),
      ],
    })
  },
})
