# DS-D-13 V0.2.0 Publish Recovery

## Status

Recorded on 2026-07-31 after the first `v0.2.0` release workflow validated
the immutable artifact but failed before npm Trusted Publishing began.

This record supersedes only the bare repository-relative tarball spelling in
the DS-D-09 npm command example. The V0.2.x controls in DS-D-12, including the
administrator release-tag path and post-publish registry smoke, remain in
force.

## Incident

Release run `30566459407` completed `Validate release artifact` successfully.
The publish job downloaded the checksummed `ayingott-theme-0.2.0.tgz`, verified
its checksum, confirmed npm CLI `11.16.0`, and confirmed that
`@ayingott/theme@0.2.0` did not exist.

The subsequent command passed this package spec to npm:

```bash
npm publish release-artifact/ayingott-theme-0.2.0.tgz
```

npm interpreted the slash-containing relative spec as a Git repository and
ran `git ls-remote` against a synthesized GitHub SSH URL. The command failed
with exit code 128 before the OIDC exchange or registry publication. The
GitHub Release and registry install smoke were skipped, and the npm version
remained absent.

## Corrective Control

Repository-relative tarballs must be unambiguously local:

```bash
npm publish ./release-artifact/ayingott-theme-0.2.0.tgz
```

An absolute path is also valid. The release contract test pins the explicit
local path so future npm upgrades cannot silently restore the ambiguous
package spec.

The failure was reproduced with the validated workflow artifact on npm
`11.16.0`: the original spec exited 128, while the `./` form completed an npm
publish dry-run successfully.

## Recovery Gate

Because no npm version or GitHub Release was created, V0.2.0 may be recovered
without changing the package version:

1. Merge the workflow fix to `main` with a release commit subject of
   `chore: release v0.2.0`, preserving the release workflow metadata contract.
2. Confirm the exact commit passes `check`, `site`, and the Workers build.
3. Reconfirm that `@ayingott/theme@0.2.0` is absent.
4. Use the administrator-authorized tag path to move `v0.2.0` from the failed
   release commit to the corrected release commit.
5. Treat the recovery as complete only after validation, npm publish, GitHub
   Release creation, registry install smoke, and registry readback all pass.

If the npm version appears before the protected tag is moved, stop this
recovery and use the DS-D-09 fix-forward procedure instead.
