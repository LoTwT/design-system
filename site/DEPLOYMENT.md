# Site Deployment

The showcase site is a static VitePress build.

Recommended Cloudflare Pages settings:

- Framework preset: `None`
- Build command: `pnpm site:build`
- Build output directory: `site/.vitepress/dist`
- Root directory: repository root
- Node.js version: `22`

Deployment is intentionally not automated yet. Final Cloudflare Pages project name, domain, and environment settings should be decided with lo-user after the site PR is reviewed.
