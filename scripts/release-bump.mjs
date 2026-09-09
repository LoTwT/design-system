import { execFileSync } from "node:child_process"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"
import { loadBumpConfig, versionBump } from "bumpp"

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    help: { type: "boolean", short: "h" },
    yes: { type: "boolean", short: "y" },
    "no-push": { type: "boolean" },
    release: { type: "string" },
    preid: { type: "string" },
    sign: { type: "boolean" },
  },
})

if (values.help) {
  console.log(`Usage: pnpm release:bump [patch|minor|major|VERSION] [--yes] [--no-push]

Bump defaults to patch. Runs only from a clean main checkout.
Creates bumpp's release commit and vVERSION tag, then atomically pushes
only that commit and tag to origin. Remote main must match the starting HEAD.

--yes, -y       Skip bumpp confirmation
--no-push       Prepare the commit and tag locally without pushing
--release TYPE Select a release type or exact version instead of a positional
--preid ID     Prerelease identifier (with a prerelease release type)
--sign         Sign the release commit and tag
--help, -h     Show this help without changing files`)
  process.exit(0)
}

try {
  if (positionals.length > 1 || (positionals.length && values.release))
    throw new Error("Provide one release type or version, either positional or --release")
  const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..")
  process.chdir(rootDir)
  const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim()
  if (git("branch", "--show-current") !== "main")
    throw new Error("Release bumps must run from main after the release PR is merged")
  if (git("status", "--porcelain", "--untracked-files=all"))
    throw new Error("Release bumps require a clean working tree, including untracked files")
  const initialHead = git("rev-parse", "HEAD")
  if (!values["no-push"]) {
    const remoteHead = git("ls-remote", "--exit-code", "origin", "refs/heads/main").split(/\s+/)[0]
    if (initialHead !== remoteHead)
      throw new Error("Local main must match origin/main before preparing a release")
  }
  console.log(values["no-push"]
    ? "Prepare a local release commit and tag; no remote push."
    : "After confirmation, push the release commit to origin/main and only its vVERSION tag atomically.")
  const config = await loadBumpConfig({}, rootDir)
  const result = await versionBump({
    ...config,
    release: values.release ?? positionals[0] ?? "patch",
    ...(values.preid === undefined ? {} : { preid: values.preid }),
    ...(values.sign === undefined ? {} : { sign: values.sign }),
    confirm: !values.yes,
    cwd: rootDir,
    push: false,
  })
  const head = git("rev-parse", "HEAD")
  const tagRef = `refs/tags/${result.tag}`
  if (!result.commit || result.tag !== `v${result.newVersion}`
    || git("rev-parse", `${tagRef}^{commit}`) !== head
    || git("rev-parse", `${head}^`) !== initialHead
    || git("status", "--porcelain", "--untracked-files=all"))
    throw new Error("Release must produce one clean commit and its matching vVERSION tag; nothing pushed")
  console.log(`Prepared ${result.tag} at ${head}`)
  if (!values["no-push"]) {
    // Disable configured followTags/mirror behavior as well as bumpp's --tags.
    execFileSync("git", ["-c", "remote.origin.mirror=false", "push", "--atomic", "--no-follow-tags", "--no-mirror", "origin", `${head}:refs/heads/main`, `${tagRef}:${tagRef}`], { stdio: "inherit" })
    console.log(`Pushed origin/main and ${result.tag}`)
  }
}
catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
