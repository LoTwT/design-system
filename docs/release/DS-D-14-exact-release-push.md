# DS-D-14 Exact Release Push

Implemented on 2026-09-09 as part of the ablation review repairs.

This record supersedes the push mechanism described in DS-D-09, the release
README, and step 6 of DS-D-12. Version-specific release authorization, the
V0.2.x release gates, package scope, and workflow permissions remain unchanged.

`pnpm release:bump` invokes `scripts/release-bump.mjs`. It defaults to a patch
bump and also accepts a release type such as `minor` or an exact version.
`--help` lists the supported options. The wrapper requires a clean `main`,
including untracked files, and checks that its starting commit matches live
`origin/main` before a push-enabled bump.

bumpp still updates the shared package versions, synchronizes released site
copy, generates the changelog, and creates `chore: release vX.Y.Z` plus
`vX.Y.Z`. Its built-in push is disabled, including when invoked directly.
The wrapper explains the remote operation before bumpp's confirmation.

After a successful bump, the wrapper verifies that the new tag points to the
single release commit and that the working tree is clean. It pushes that
commit to `refs/heads/main` and only the exact new tag to `origin` in one
atomic operation. Explicit refspecs and disabled follow-tags/mirror behavior
keep unrelated local tags out of the operation. The commit and tag become
visible together, replacing the earlier separate commit-then-tag pushes.

Cancellation or a failed preparation does not push. An atomic push rejection
updates neither remote ref; the local release commit and tag remain available
for inspection. `--no-push` also retains the prepared commit and tag locally
and skips the remote-main equality check. Do not rerun a completed bump to
retry a rejected push: inspect its exact local and remote refs, then retry only
the authorized commit and tag.

The regression contract uses local bare repositories with file-only Git
transport. It covers default patch, minor, exact prerelease, unrelated tags
with follow-tags enabled, local-only preparation, cancellation, dirty and
non-main checkouts, unpushed starting commits, preparation failure, existing
tags, and atomic rejection. Workflow integrity tests separately execute both
artifact verification steps against intact and corrupted files.
