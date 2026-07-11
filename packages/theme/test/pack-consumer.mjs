import { execFileSync, spawnSync } from "node:child_process"
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { basename, dirname, join, relative, sep } from "node:path"
import { fileURLToPath } from "node:url"

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)))
const repoRoot = dirname(dirname(packageDir))
const tempDir = mkdtempSync(join(tmpdir(), "ayingott-theme-consumer-"))
const artifactDir = join(tempDir, "artifact")
const consumerDir = join(tempDir, "consumer")
const missingPeerDir = join(tempDir, "missing-peer")
const strictInstallArgs = [
  "install",
  "--ignore-scripts",
  "--strict-peer-dependencies",
  "--config.auto-install-peers=false",
]

try {
  mkdirSync(artifactDir)
  mkdirSync(consumerDir)
  mkdirSync(missingPeerDir)

  execFileSync("pnpm", ["pack", "--pack-destination", artifactDir], {
    cwd: packageDir,
    stdio: "inherit",
  })

  const tarballs = readdirSync(artifactDir).filter(file => file.endsWith(".tgz"))
  if (tarballs.length !== 1)
    throw new Error(`Expected one package tarball, found ${tarballs.length}`)

  const tarball = join(artifactDir, tarballs[0])
  const tarballReference = relative(consumerDir, tarball).split(sep).join("/")
  const missingPeerTarballReference = relative(missingPeerDir, tarball).split(sep).join("/")
  writeFileSync(join(missingPeerDir, "package.json"), `${JSON.stringify({
    name: "@ayingott/theme-missing-peer-smoke",
    version: "0.0.0",
    private: true,
    packageManager: "pnpm@10.33.0",
    dependencies: {
      "@ayingott/theme": `file:${missingPeerTarballReference}`,
    },
  }, null, 2)}\n`)

  const missingPeerInstall = spawnSync("pnpm", strictInstallArgs, {
    cwd: missingPeerDir,
    encoding: "utf8",
  })
  const missingPeerOutput = `${missingPeerInstall.stdout}${missingPeerInstall.stderr}`
  if (missingPeerInstall.status === 0 || !missingPeerOutput.includes("missing peer tailwindcss@^4.0.0"))
    throw new Error(`Missing Tailwind peer fixture did not fail as expected:\n${missingPeerOutput}`)

  writeFileSync(join(consumerDir, "package.json"), `${JSON.stringify({
    name: "@ayingott/theme-consumer-smoke",
    version: "0.0.0",
    private: true,
    type: "module",
    packageManager: "pnpm@10.33.0",
    dependencies: {
      "@ayingott/theme": `file:${tarballReference}`,
      "@tailwindcss/cli": "4.2.4",
      tailwindcss: "4.2.4",
    },
  }, null, 2)}\n`)

  execFileSync("pnpm", strictInstallArgs, {
    cwd: consumerDir,
    stdio: "inherit",
  })

  const installedPackageDir = realpathSync(join(consumerDir, "node_modules", "@ayingott", "theme"))
  const relativeToRepo = relative(repoRoot, installedPackageDir)
  if (relativeToRepo !== ".." && !relativeToRepo.startsWith(`..${sep}`))
    throw new Error(`Consumer resolved repository source instead of the tarball: ${installedPackageDir}`)

  const manifest = JSON.parse(readFileSync(join(installedPackageDir, "package.json"), "utf8"))
  const expectedExports = {
    ".": "./src/index.css",
    "./index.css": "./src/index.css",
    "./fonts.css": "./src/fonts.css",
    "./fonts/*": "./src/fonts/*",
  }

  if (JSON.stringify(manifest.exports) !== JSON.stringify(expectedExports))
    throw new Error(`Unexpected package exports: ${JSON.stringify(manifest.exports)}`)
  if (manifest.style !== "./src/index.css")
    throw new Error(`Unexpected style entry: ${manifest.style}`)
  if (manifest.peerDependencies?.tailwindcss !== "^4.0.0")
    throw new Error(`Unexpected Tailwind peer contract: ${manifest.peerDependencies?.tailwindcss}`)
  if (manifest.peerDependenciesMeta?.tailwindcss?.optional === true)
    throw new Error("Tailwind must remain a required peer dependency")
  if (manifest.dependencies !== undefined)
    throw new Error(`Unexpected runtime dependencies: ${JSON.stringify(manifest.dependencies)}`)
  if (manifest.scripts !== undefined)
    throw new Error(`Published package must not expose repository-only scripts: ${JSON.stringify(manifest.scripts)}`)
  if (existsSync(join(installedPackageDir, "test")))
    throw new Error("Published package must not contain repository test files")

  const requiredPackageFiles = [
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
  ]
  for (const file of requiredPackageFiles) {
    if (!existsSync(join(installedPackageDir, file)))
      throw new Error(`Missing installed package file: ${file}`)
  }

  const exportCheck = join(consumerDir, "verify-exports.mjs")
  writeFileSync(exportCheck, `
import { fileURLToPath } from "node:url"

const expected = ${JSON.stringify({
  "@ayingott/theme": "src/index.css",
  "@ayingott/theme/index.css": "src/index.css",
  "@ayingott/theme/fonts.css": "src/fonts.css",
  "@ayingott/theme/fonts/space-mono-latin-400-normal.woff2": "src/fonts/space-mono-latin-400-normal.woff2",
}, null, 2)}

for (const [specifier, suffix] of Object.entries(expected)) {
  const resolved = fileURLToPath(import.meta.resolve(specifier)).replaceAll("\\\\", "/")
  if (!resolved.endsWith(suffix))
    throw new Error(\`Unexpected resolution for \${specifier}: \${resolved}\`)
}
`)
  execFileSync("node", [basename(exportCheck)], { cwd: consumerDir, stdio: "inherit" })

  const input = join(consumerDir, "input.css")
  const output = join(consumerDir, "output.css")
  writeFileSync(input, `
@import "tailwindcss";
@import "@ayingott/theme/fonts.css";
@import "@ayingott/theme";
@source inline("bg-lavender-500 text-neutral-950 font-display font-reading font-mono rounded-card shadow-card focus-ring touch-target");
`)
  execFileSync("pnpm", ["exec", "tailwindcss", "-i", input, "-o", output], {
    cwd: consumerDir,
    stdio: "inherit",
  })

  const css = readFileSync(output, "utf8")
  const requiredOutput = [
    "--surface-canvas",
    "--reading-link",
    ".bg-lavender-500",
    ".font-display",
    ".font-reading",
    ".font-mono",
    ".rounded-card",
    ".shadow-card",
    ".focus-ring",
    ".touch-target",
    "@font-face",
    "space-grotesk-latin-wght-normal.woff2",
    "space-grotesk-latin-ext-wght-normal.woff2",
    "newsreader-latin-opsz-normal.woff2",
    "newsreader-latin-ext-opsz-normal.woff2",
    "space-mono-latin-400-normal.woff2",
    "space-mono-latin-700-normal.woff2",
  ]
  for (const needle of requiredOutput) {
    if (!css.includes(needle))
      throw new Error(`Consumer compile output is missing: ${needle}`)
  }

  console.log(`real tarball consumer passed: ${basename(tarball)}`)
}
finally {
  rmSync(tempDir, { recursive: true, force: true })
}
