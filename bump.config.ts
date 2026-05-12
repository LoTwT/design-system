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
  execute: 'pnpm changelog',
})
