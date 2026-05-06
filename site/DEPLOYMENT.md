# Site Deployment

The showcase site is a static VitePress build deployed with Cloudflare Workers
Static Assets.

## Worker Settings

- Worker name: `design-system`
- Custom domain: `design.ayingott.me`
- Assets directory: `site/.vitepress/dist`

The source of truth is `wrangler.jsonc`.

## Cloudflare Git Build Settings

- Root directory: repository root
- Build command: `pnpm site:build`
- Deploy command: `pnpm wrangler deploy`
- Environment variable: `NODE_VERSION=22`
- Environment variable: `PNPM_VERSION=10.33.0`

## Local Commands

```bash
pnpm site:build
pnpm site:cf-preview
pnpm site:deploy
```

`site:deploy` requires an authenticated Wrangler session or equivalent
Cloudflare API credentials in CI.
