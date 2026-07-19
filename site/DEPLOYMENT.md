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
- Build command: leave empty
- Deploy command: `npx wrangler deploy` or `pnpm wrangler deploy`
- Environment variable: `NODE_VERSION=22`
- Environment variable: `PNPM_VERSION=11.15.0`

`wrangler.jsonc` defines `build.command = "pnpm site:build"`, so Wrangler runs
the VitePress build before uploading `site/.vitepress/dist`. Do not configure a
separate Cloudflare Build command unless the Workers Git UI explicitly requires
one; keeping the build command in `wrangler.jsonc` makes local deploys and
Cloudflare deploys follow the same path.

## Local Commands

```bash
pnpm site:build
pnpm site:cf-preview
pnpm site:deploy
```

`site:deploy` requires an authenticated Wrangler session or equivalent
Cloudflare API credentials in CI.
