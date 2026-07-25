import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
const files = [
  "site/index.md",
  "site/guide/getting-started.md",
  "site/guide/package-contract.md",
]

function expect(condition, message) {
  if (!condition)
    throw new Error(message)
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

const prereleaseFixture = createFixture()
const stableFixture = createFixture()

try {
  sync("0.2.0-next.1", prereleaseFixture)
  const [prereleaseHomepage, prereleaseGettingStarted, prereleasePackageContract] = sources(prereleaseFixture)
  expect(prereleaseHomepage.includes("not included in npm `latest`"), "Prerelease homepage must retain the npm latest warning")
  expect(prereleaseGettingStarted.includes("not included in npm `latest`"), "Prerelease Getting Started must retain the npm latest warning")
  expect(prereleasePackageContract.includes("npm `latest` is `0.1.0`"), "Prerelease Package Contract must retain the npm latest warning")

  sync("0.2.0", stableFixture)
  let [homepage, gettingStarted, packageContract] = sources(stableFixture)
  for (const source of [homepage, gettingStarted, packageContract])
    expect(!source.includes("not included in npm `latest`"), "Stable release docs must remove the main-only Neo notice")

  expect(homepage.includes("Paper & Ink defaults with opt-in Neo-Brutal Light and Dark"), "Stable release docs must promote the Neo homepage copy")
  expect(packageContract.includes("`@ayingott/theme` exposes five public entries:"), "Stable release docs must promote the public package contract")

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
