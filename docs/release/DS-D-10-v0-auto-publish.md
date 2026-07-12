# DS-D-10 Automated Publish and Current V0.1.x Phase 5 Readiness

## Status

This control model originated with V0.0.x patch releases. On 2026-07-12, with
the root and theme packages at 0.1.0, the repository owner accepted the current
`npm-publish` environment exception and approved this Phase 5 rehearsal. This
acceptance covers the current V0.1.x patch line and this Phase 5 only. A future
minor or major release line requires a new decision.

This decision partially supersedes the environment approval language in
DS-D-09. DS-D-09 remains canonical for versioning, validation, packaging,
Trusted Publishing, GitHub Release, registry smoke, and rollback mechanics.

## Package and Showcase Boundary

- `@ayingott/theme` is the only publishable package. It remains a CSS-first,
  framework-agnostic, theme-only package with no component primitives or
  framework adapters.
- DS-D-05 later added the repository-level `site/` VitePress showcase. The site
  is display-only and does not expand the npm payload, public exports, or
  consumer contract.
- Any additional public package or component surface requires a new decision
  and package-specific release gates before implementation.

## Current Release Controls

- The `v*.*.*` release tag ruleset is the pre-publish control. It restricts
  release-tag creation, update, and deletion to the repository administrator
  path before tag-triggered CI can publish.
- The `npm-publish` environment binds the publish job to npm Trusted Publishing
  / OIDC. It has no required reviewers or deployment branch/tag restrictions,
  and repository administrators retain bypass. It is not a protected approval
  gate and must not be described as one.
- The `main` ruleset requires the GitHub Actions checks `check` and `site`, with
  branches required to be up to date before merge.
- Dependabot alerts and security updates are enabled. Weekly version updates
  cover eligible direct manifest dependencies; development minor/patch updates
  are grouped, while unmatched updates may open separate pull requests.

## Accepted Residuals

Keep these visible in release rehearsal and go/no-go reports until a later
decision closes them:

- The `npm-publish` environment has no reviewer/ref restrictions and retains
  administrator bypass.
- Bundled fonts identify their OFL-1.1 license, source, version, and hashes in
  `packages/theme/THIRD_PARTY_NOTICES.md`, but the package does not bundle the
  full OFL-1.1 text or the additional upstream third-party notice.
- VitePress 1.6.4 declares Vite `^5.4.14`, while the security override resolves
  Vite 6.4.3. Audit, site typecheck/build, and release rehearsal must keep
  proving this accepted compatibility residual.
- The repository still allows rebase merges. Squash-only is a human workflow
  convention, not a technically enforced repository rule.

## Phase 5 Release Rehearsal

Bind every final gate to one exact `main` commit and tree. Any repository delta
invalidates prior final-head evidence.

Required evidence:

- frozen install; all-dependency and production-dependency audits;
- full `pnpm check`, site typecheck/build, and a real tarball consumer;
- package exports, contents, license/notices, and production dependency checks;
- release metadata, prerelease/stable tag behavior, and a no-publish dry run;
- live readback of rulesets, Trusted Publisher/environment bindings, Dependabot
  settings, and required status checks;
- Experience assertions for language, theme/CTA states, motion, touch targets,
  logo/favicon, overflow, focus, and documentation clarity.

The final report is go/no-go evidence for a human publish decision. Rehearsal
must not create a release tag, publish to npm, create a GitHub Release, or alter
repository settings.
