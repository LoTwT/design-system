import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { execFileSync, spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
const files = [
  "site/index.md",
  "site/guide/getting-started.md",
  "site/guide/package-contract.md",
]
const releaseWorkflow = readFileSync(join(rootDir, ".github/workflows/release.yml"), "utf8")

function expect(condition, message) {
  if (!condition)
    throw new Error(message)
}

function expectSourcesUnchanged(before, after, operation) {
  for (const [index, source] of after.entries())
    expect(source === before[index], `${operation} must leave ${files[index]} unchanged`)
}

function createFixture() {
  const fixtureDir = mkdtempSync(join(tmpdir(), "release-docs-"))
  for (const file of files) {
    const destination = join(fixtureDir, file)
    mkdirSync(dirname(destination), { recursive: true })
    cpSync(join(rootDir, file), destination)
  }
  return fixtureDir
}

function sync(version, fixtureDir) {
  execFileSync(process.execPath, [
    join(rootDir, "scripts/sync-release-docs.mjs"),
    version,
    fixtureDir,
  ])
}

function sources(fixtureDir) {
  return files.map(file => readFileSync(join(fixtureDir, file), "utf8"))
}

expect(
  releaseWorkflow.includes('npm publish "./${TARBALLS[0]}" --access public --tag "$NPM_TAG" --ignore-scripts'),
  "Release publish must pass an explicit local tarball path to npm",
)

// Execute each consuming job's actual integrity step against intact and
// corrupted artifacts, so removing the check cannot leave this verifier green.
for (const job of ["publish", "github-release"]) {
  const jobSource = releaseWorkflow.split(`\n  ${job}:\n`)[1]?.split(/\n  [\w-]+:\n/)[0]
  const integrityStep = jobSource?.match(/      - name: Verify artifact integrity\n        shell: bash\n        run: \|\n((?: {10}[^\n]*\n)+)/)?.[1]
  expect(integrityStep, `${job} must verify artifact integrity before consuming it`)
  const fixture = mkdtempSync(join(tmpdir(), "release-integrity-"))
  const artifact = join(fixture, "release-artifact")
  const files = { "theme.tgz": "validated package", "release-notes.md": "validated notes" }
  try {
    mkdirSync(artifact)
    // macOS ships shasum rather than GNU sha256sum; both accept this step's
    // --check manifest format. Keep the workflow command itself unchanged.
    const env = { ...process.env }
    if (spawnSync("sha256sum", ["--version"]).error?.code === "ENOENT") {
      const bin = join(fixture, "bin")
      mkdirSync(bin)
      writeFileSync(join(bin, "sha256sum"), '#!/bin/sh\nexec shasum -a 256 "$@"\n', { mode: 0o755 })
      env.PATH = `${bin}:${env.PATH}`
    }
    for (const [file, content] of Object.entries(files))
      writeFileSync(join(artifact, file), content)
    writeFileSync(join(artifact, "SHA256SUMS"), Object.entries(files)
      .map(([file, content]) => `${createHash("sha256").update(content).digest("hex")}  ./${file}\n`).join(""))
    const verify = () => spawnSync("bash", ["-c", integrityStep], { cwd: fixture, env, encoding: "utf8" })
    const intact = verify()
    expect(intact.status === 0, `${job} intact artifact verification failed: ${intact.stderr}`)
    for (const [file, content] of Object.entries(files)) {
      writeFileSync(join(artifact, file), "corrupted")
      expect(verify().status !== 0, `${job} must reject a corrupted ${file}`)
      writeFileSync(join(artifact, file), content)
    }
    rmSync(join(artifact, "SHA256SUMS"))
    expect(verify().status !== 0, `${job} must reject a missing checksum manifest`)
  }
  finally {
    rmSync(fixture, { force: true, recursive: true })
  }
}

const prereleaseFixture = createFixture()
const stableFixture = createFixture()

try {
  const prereleaseBefore = sources(prereleaseFixture)
  sync("0.2.0-next.1", prereleaseFixture)
  expectSourcesUnchanged(prereleaseBefore, sources(prereleaseFixture), "Prerelease sync")

  sync("0.2.0", stableFixture)
  let [homepage, gettingStarted, packageContract] = sources(stableFixture)
  for (const source of [homepage, gettingStarted, packageContract])
    expect(!source.includes("not included in npm `latest`"), "Stable release docs must remove the main-only Neo notice")

  expect(homepage.includes("Paper & Ink defaults with opt-in Neo-Brutal Light and Dark"), "Stable release docs must promote the Neo homepage copy")
  expect(packageContract.includes("`@ayingott/theme` exposes five public entries:"), "Stable release docs must promote the public package contract")

  const stableBeforePrerelease = sources(stableFixture)
  sync("0.2.1-next.1", stableFixture)
  expectSourcesUnchanged(stableBeforePrerelease, sources(stableFixture), "Post-release prerelease sync")

  sync("0.2.1", stableFixture)
  ;[homepage, gettingStarted, packageContract] = sources(stableFixture)
  for (const source of [homepage, gettingStarted, packageContract])
    expect(!source.includes("not included in npm `latest`"), "Later stable release sync must remain idempotent")
}
finally {
  rmSync(prereleaseFixture, { force: true, recursive: true })
  rmSync(stableFixture, { force: true, recursive: true })
}

console.log("release documentation sync contract passed")
