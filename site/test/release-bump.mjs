import { execFileSync, spawnSync } from "node:child_process"
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
const tempDir = mkdtempSync(join(tmpdir(), "release-bump-test-"))
const env = {
  ...process.env,
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_COUNT: "0",
  GIT_ALLOW_PROTOCOL: "file",
  GIT_TERMINAL_PROMPT: "0",
  GIT_AUTHOR_NAME: "Release test",
  GIT_AUTHOR_EMAIL: "release-test@example.invalid",
  GIT_COMMITTER_NAME: "Release test",
  GIT_COMMITTER_EMAIL: "release-test@example.invalid",
}
const sourceFiles = [
  "package.json", "packages/theme/package.json", "pnpm-workspace.yaml", "bump.config.ts", "cliff.toml", "CHANGELOG.md",
  "scripts/release-bump.mjs", "scripts/sync-release-docs.mjs",
  "site/index.md", "site/guide/getting-started.md", "site/guide/package-contract.md",
]
function expect(condition, message) {
  if (!condition)
    throw new Error(message)
}
function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim()
}
function fixture(name, startingVersion = "0.2.0") {
  const cwd = join(tempDir, name)
  const remote = `${cwd}.git`
  mkdirSync(cwd)
  for (const file of sourceFiles) {
    mkdirSync(dirname(join(cwd, file)), { recursive: true })
    cpSync(join(rootDir, file), join(cwd, file))
  }
  // Fixed inputs keep the contract runnable from stable and prerelease tags.
  for (const file of ["package.json", "packages/theme/package.json"]) {
    const manifest = JSON.parse(readFileSync(join(cwd, file), "utf8"))
    manifest.version = startingVersion
    writeFileSync(join(cwd, file), `${JSON.stringify(manifest, null, 2)}\n`)
  }
  symlinkSync(join(rootDir, "node_modules"), join(cwd, "node_modules"), "dir")
  writeFileSync(join(cwd, ".gitignore"), "node_modules\n")
  git(cwd, "init", "-b", "main")
  git(cwd, "add", ".")
  git(cwd, "commit", "-m", "chore: fixture")
  git(cwd, "init", "--bare", remote)
  git(cwd, "remote", "add", "origin", remote)
  git(cwd, "push", "--set-upstream", "origin", "main")
  return { cwd, remote }
}
const refs = remote => git(remote, "show-ref")
function bump(cwd, args, input) {
  const result = spawnSync("pnpm", ["release:bump", ...args], { cwd, env, input, encoding: "utf8", timeout: 20000 })
  if (result.error)
    throw result.error
  return { ...result, output: `${result.stdout}${result.stderr}` }
}
const next = "0.2.1"
const cases = [
  ["patch", [], next],
  ["minor", ["minor"], "0.3.0"],
  ["explicit", [`${next}-next.1`], `${next}-next.1`],
  ["prerelease-to-stable", [], next, `${next}-next.1`],
]

try {
  for (const [name, args, expectedVersion, startingVersion] of cases) {
    const { cwd, remote } = fixture(name, startingVersion)
    git(cwd, "tag", "-a", "v9.9.9", "-m", "Unrelated local tag")
    git(cwd, "config", "push.followTags", "true")
    git(cwd, "config", "remote.origin.mirror", "true")
    git(cwd, "config", "remote.origin.push", "refs/tags/*:refs/tags/*")
    const result = bump(cwd, [...args, "--yes"])
    expect(result.status === 0, `${name} failed: ${result.output}`)
    const remoteRefs = refs(remote).split("\n").map(line => line.split(" ")[1]).sort()
    expect(JSON.stringify(remoteRefs) === JSON.stringify(["refs/heads/main", `refs/tags/v${expectedVersion}`]), `${name} pushed unexpected refs: ${remoteRefs}`)
    expect(git(remote, "rev-parse", "main") === git(cwd, "rev-parse", "HEAD"), `${name} did not push the release commit`)
    expect(git(cwd, "log", "-1", "--format=%s") === `chore: release v${expectedVersion}`, "Release commit format drifted")
    for (const file of ["package.json", "packages/theme/package.json"])
      expect(JSON.parse(readFileSync(join(cwd, file), "utf8")).version === expectedVersion, `${file} version was not synchronized`)
    expect(git(cwd, "status", "--porcelain") === "", `${name} left uncommitted release changes`)
    console.log(`release bump ${name}: only main and v${expectedVersion} pushed`)
  }

  for (const name of ["no-push", "cancel", "dirty", "untracked", "branch", "ahead", "execute-failure", "tag-exists", "atomic-rejection", "help", "unknown-option"]) {
    const { cwd, remote } = fixture(name)
    if (name === "dirty")
      writeFileSync(join(cwd, "CHANGELOG.md"), "uncommitted change")
    if (name === "untracked")
      writeFileSync(join(cwd, "untracked.txt"), "user work")
    if (name === "branch")
      git(cwd, "branch", "-m", "codex/not-main")
    if (name === "ahead")
      git(cwd, "commit", "--allow-empty", "-m", "chore: unpushed")
    if (name === "execute-failure") {
      writeFileSync(join(cwd, "scripts/sync-release-docs.mjs"), 'throw new Error("fixture execution failure")\n')
      git(cwd, "add", ".")
      git(cwd, "commit", "-m", "chore: failing fixture")
      git(cwd, "push", "origin", "main")
    }
    if (name === "tag-exists")
      git(cwd, "tag", `v${next}`)
    if (name === "atomic-rejection")
      writeFileSync(join(remote, "hooks/update"), `#!/bin/sh\n[ "$1" != "refs/tags/v${next}" ]\n`, { mode: 0o755 })
    const before = refs(remote)
    const initialHead = git(cwd, "rev-parse", "HEAD")
    const args = name === "no-push" ? ["--no-push", "--yes"]
      : name === "cancel" ? [] : name === "help" ? ["--help"]
        : name === "unknown-option" ? ["--all"] : ["--yes"]
    const result = bump(cwd, args, name === "cancel" ? "n\n" : undefined)
    expect(result.status === (["no-push", "help"].includes(name) ? 0 : 1), `${name} returned unexpected status ${result.status}: ${result.output}`)
    expect(refs(remote) === before, `${name} must leave all remote refs unchanged`)
    if (["no-push", "atomic-rejection"].includes(name))
      expect(git(cwd, "rev-parse", `refs/tags/v${next}^{commit}`) === git(cwd, "rev-parse", "HEAD"), `${name} must retain the local release for inspection`)
    else if (name !== "tag-exists")
      expect(git(cwd, "rev-parse", "HEAD") === initialHead, `${name} unexpectedly committed`)
    console.log(`release bump ${name}: remote unchanged`)
  }
}
finally {
  rmSync(tempDir, { recursive: true, force: true })
}

console.log("release bump contract passed with local bare remotes only")
