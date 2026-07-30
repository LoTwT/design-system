# DS-D-12 V0.2.x Release Controls

## Status

Accepted on 2026-07-31 after the repository owner reviewed the V0.2.0
go/no-go findings and directed the two remaining release blockers to be
resolved.

This decision authorizes the `@ayingott/theme` V0.2.x release line to use the
current automated release controls once every release gate below passes. It is
a control decision, not an instruction to create a release tag or publish a
specific version. Tag creation and npm publication still require an explicit
release instruction after the release-preparation pull request has merged.

The readiness audit that prompted this decision used
`37f3cda8466365c180f48f09f8d14caad7d545c6` as its initial `main` baseline.
Final release evidence must bind to the post-merge `main` commit instead.

## Scope and Version Line

- `@ayingott/theme` remains the only publishable package.
- The root package remains private and shares the theme package version.
- V0 scope remains CSS-first, framework-agnostic, and theme-only.
- V0.2.x does not authorize component primitives, framework adapters, another
  public package, or a larger npm export surface than the five documented CSS
  entries.
- V0.2.0 is a minor release because the unreleased range adds Paper and Ink,
  opt-in Neo-Brutalism, and new public theme roles and utilities.

## Relationship to Earlier Decisions

This decision supersedes only the V0.1.x release-line boundary in DS-D-10. The
accepted `npm-publish` environment exception and the other current controls
now apply to V0.2.x. DS-D-10 remains the point-in-time record for V0.1.x and
the Phase 5 rehearsal.

DS-D-09 remains canonical for versioning, packaging, Trusted Publishing,
GitHub Release creation, registry verification, and rollback, with one
post-publish smoke update: bundled font assertions are derived from the
installed package's `fonts.css` references. Static Space Grotesk and Newsreader
filename assertions no longer describe the workflow.

A V0.3.x or major release line requires a new decision. So does any new public
package, component surface, or material change to the publish trust boundary.

## Accepted Control Model

The following state was read back on 2026-07-31 and is accepted for V0.2.x:

- The active `Protect release tags` ruleset covers `refs/tags/v*.*.*` and
  restricts creation, update, deletion, and non-fast-forward changes to the
  repository-administrator bypass path.
- The `npm-publish` environment has no required reviewers, deployment branch
  policy, or tag policy, and repository administrators can bypass it. It is not
  a protected approval gate.
- `main` has no branch protection or ruleset. The `check` and `site` workflows
  still run, but final evidence must be tied to the exact release commit rather
  than inferred from branch policy.
- The release workflow keeps repository code in the unprivileged validation
  job. The publish job receives the checksummed tarball plus only artifact-read
  and OIDC permissions.
- npm publication uses the `npm-publish` environment and the configured Trusted
  Publisher binding. Its repository, workflow, environment, and package binding
  must be rechecked before the release tag is pushed whenever that readback is
  available.

## V0.2.x Release Gate

Before a stable V0.2.x tag is pushed:

1. Merge the release-preparation pull request and update local `main` to the
   exact `origin/main` commit.
2. Confirm the worktree is clean and every repository `package.json` still has
   the same pre-bump version.
3. Confirm the target npm version does not exist.
4. Run:

   ```bash
   pnpm check
   pnpm site:typecheck
   pnpm site:build
   CHROME_PATH=<chrome-binary> pnpm site:browser
   ```

5. In an isolated checkout, exercise the exact stable bump and prove that the
   bumped version passes the same gates, produces the expected changelog and
   released site copy, and packs a real-installable consumer tarball.
6. After explicit release instruction, run `pnpm release:bump X.Y.Z` from
   `main`. The generated `chore: release vX.Y.Z` commit and `vX.Y.Z` tag must be
   pushed by the administrator-authorized release path, with the commit
   reaching `origin/main` before the tag.
7. Treat the release as complete only after validation, npm publish, GitHub
   Release creation, and registry install smoke all succeed and the registry
   version is read back.

Stable versions use npm dist-tag `latest`. Prereleases use `next`, remain
GitHub prereleases, and must not become the latest GitHub Release.

## Registry Smoke Contract

The post-publish consumer installs the exact registry version with Tailwind CSS
and compiles the documented default and optional font imports. It must verify:

- semantic, reading, Tailwind utility, focus-ring, and touch-target output;
- at least one bundled font reference in the installed `fonts.css`;
- every unique bundled font filename referenced by that stylesheet appears in
  the compiled CSS.

This dynamic check keeps registry verification aligned with legal font swaps
without weakening the requirement that every referenced font ships and
compiles.

## Accepted Residuals

The V0.2.x line carries forward these visible residuals:

- the unprotected `npm-publish` environment and administrator bypass;
- the unprotected `main` branch;
- bundled font notices without the full OFL-1.1 text or additional upstream
  notice;
- VitePress 1.6.4 running with the repository's Vite 6.4.3 security override;
- rebase merges remaining enabled even though squash merge is the human
  convention.

Any release report must state these as accepted residuals rather than claiming
that the environment or branch is protected.
