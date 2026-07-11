import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)))
const rootDir = dirname(dirname(packageDir))
const expectedLicenseHash = "a4baf0eff35f346cb41cf3fc4fa39b79ac1c04037257793886c382473bb43c8b"

const output = execFileSync("pnpm", ["pack", "--dry-run", "--json"], {
  cwd: packageDir,
  encoding: "utf8",
})

const payload = JSON.parse(output)
const files = new Set(payload.files.map((file) => file.path))

const required = [
  "package.json",
  "LICENSE",
  "README.md",
  "THIRD_PARTY_NOTICES.md",
  "src/index.css",
  "src/fonts.css",
  "src/fonts/space-grotesk-latin-wght-normal.woff2",
  "src/fonts/space-grotesk-latin-ext-wght-normal.woff2",
  "src/fonts/newsreader-latin-opsz-normal.woff2",
  "src/fonts/newsreader-latin-ext-opsz-normal.woff2",
  "src/fonts/space-mono-latin-400-normal.woff2",
  "src/fonts/space-mono-latin-700-normal.woff2",
  "src/foundation/colors.css",
  "src/foundation/typography.css",
  "src/semantic/light.css",
  "src/semantic/dark.css",
  "src/semantic/reading.css",
  "src/utilities/focus.css",
  "src/utilities/touch-target.css",
]

const forbidden = [
  "test/smoke.mjs",
  "test/smoke.package.css",
  "test/pack-dry.mjs",
]

const missing = required.filter((file) => !files.has(file))
const leaked = forbidden.filter((file) => files.has(file))
const rootLicense = readFileSync(join(rootDir, "LICENSE"))
const packageLicense = readFileSync(join(packageDir, "LICENSE"))
const licenseHash = createHash("sha256").update(packageLicense).digest("hex")

if (missing.length || leaked.length || !rootLicense.equals(packageLicense) || licenseHash !== expectedLicenseHash) {
  for (const file of missing) {
    console.error(`Missing from package payload: ${file}`)
  }
  for (const file of leaked) {
    console.error(`Unexpected test file in package payload: ${file}`)
  }
  if (!rootLicense.equals(packageLicense))
    console.error("Root and package MIT LICENSE files differ")
  if (licenseHash !== expectedLicenseHash)
    console.error(`Unexpected MIT LICENSE SHA-256: ${licenseHash}`)
  process.exit(1)
}

console.log(`pack dry-run passed: ${payload.filename}`)
