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
import { stripVTControlCharacters } from "node:util"
import postcss from "postcss"

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)))
const repoRoot = dirname(dirname(packageDir))
const tempDir = mkdtempSync(join(tmpdir(), "ayingott-theme-consumer-"))
const artifactDir = join(tempDir, "artifact")
const missingPeerDir = join(tempDir, "missing-peer")
const strictInstallArgs = [
  "install",
  "--ignore-scripts",
  "--strict-peer-dependencies",
  "--config.auto-install-peers=false",
]

// Explicit source files keep candidates working on the peer floor: `@source inline()` needs Tailwind 4.1+.
function compileConsumer(consumerDir, name, css, candidates) {
  const input = join(consumerDir, `${name}.css`)
  const output = join(consumerDir, `${name}.output.css`)
  writeFileSync(join(consumerDir, `${name}.html`), `<div class="${candidates.join(" ")}"></div>\n`)
  writeFileSync(input, `${css}\n@source "./${name}.html";\n`)
  execFileSync("pnpm", ["exec", "tailwindcss", "-i", input, "-o", output], {
    cwd: consumerDir,
    stdio: "inherit",
  })
  return readFileSync(output, "utf8")
}

try {
  mkdirSync(artifactDir)
  mkdirSync(missingPeerDir)

  execFileSync("pnpm", ["pack", "--pack-destination", artifactDir], {
    cwd: packageDir,
    stdio: "inherit",
  })

  const tarballs = readdirSync(artifactDir).filter(file => file.endsWith(".tgz"))
  if (tarballs.length !== 1)
    throw new Error(`Expected one package tarball, found ${tarballs.length}`)

  const tarball = join(artifactDir, tarballs[0])
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
  // FORCE_COLOR can make pnpm color the peer name, splitting the expected text.
  const missingPeerOutput = stripVTControlCharacters(`${missingPeerInstall.stdout}${missingPeerInstall.stderr}`)
  if (missingPeerInstall.status === 0 || !missingPeerOutput.includes("missing peer tailwindcss@^4.0.0"))
    throw new Error(`Missing Tailwind peer fixture did not fail as expected:\n${missingPeerOutput}`)

  // Cover the declared peer floor and the version the workspace builds with.
  const sourceManifest = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"))
  const workspaceTailwind = sourceManifest.devDependencies.tailwindcss
  const tailwindVersions = [sourceManifest.peerDependencies.tailwindcss.replace(/^\^/, ""), workspaceTailwind]
  if (!/^\d+\.\d+\.\d+$/.test(tailwindVersions[0]) || tailwindVersions[0] === workspaceTailwind)
    throw new Error(`Tailwind matrix needs a distinct exact peer floor and workspace version: ${tailwindVersions.join(", ")}`)

  for (const tailwindVersion of tailwindVersions) {
    const consumerDir = join(tempDir, `consumer-${tailwindVersion}`)
    mkdirSync(consumerDir)
    const tarballReference = relative(consumerDir, tarball).split(sep).join("/")

    writeFileSync(join(consumerDir, "package.json"), `${JSON.stringify({
      name: "@ayingott/theme-consumer-smoke",
      version: "0.0.0",
      private: true,
      type: "module",
      packageManager: "pnpm@10.33.0",
      dependencies: {
        "@ayingott/theme": `file:${tarballReference}`,
        "@tailwindcss/cli": tailwindVersion,
        tailwindcss: tailwindVersion,
      },
      // The CLI's caret ranges would otherwise pull a newer native scanner.
      pnpm: {
        overrides: {
          "@tailwindcss/node": tailwindVersion,
          "@tailwindcss/oxide": tailwindVersion,
        },
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
      "./brutal.css": "./src/brutal.css",
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
      "src/brutal.css",
      "src/semantic/brutal.css",
      "src/utilities/pressable.css",
      "src/fonts.css",
      "src/fonts/bricolage-grotesque-latin-opsz-wght-normal.woff2",
      "src/fonts/bricolage-grotesque-latin-ext-opsz-wght-normal.woff2",
      "src/fonts/literata-latin-opsz-wght-normal.woff2",
      "src/fonts/literata-latin-ext-opsz-wght-normal.woff2",
      "src/fonts/space-mono-latin-400-normal.woff2",
      "src/fonts/space-mono-latin-700-normal.woff2",
      "src/fonts/lxgw-wenkai-400-normal.woff2",
      "src/fonts/lxgw-wenkai-500-normal.woff2",
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
    "@ayingott/theme/brutal.css": "src/brutal.css",
    "@ayingott/theme/fonts.css": "src/fonts.css",
    "@ayingott/theme/fonts/space-mono-latin-400-normal.woff2": "src/fonts/space-mono-latin-400-normal.woff2",
    "@ayingott/theme/fonts/lxgw-wenkai-400-normal.woff2": "src/fonts/lxgw-wenkai-400-normal.woff2",
    "@ayingott/theme/fonts/lxgw-wenkai-500-normal.woff2": "src/fonts/lxgw-wenkai-500-normal.woff2",
  }, null, 2)}

  for (const [specifier, suffix] of Object.entries(expected)) {
    const resolved = fileURLToPath(import.meta.resolve(specifier)).replaceAll("\\\\", "/")
    if (!resolved.endsWith(suffix))
      throw new Error(\`Unexpected resolution for \${specifier}: \${resolved}\`)
  }
  `)
    execFileSync("node", [basename(exportCheck)], { cwd: consumerDir, stdio: "inherit" })

    const defaultCss = compileConsumer(consumerDir, "default", `
  @import "tailwindcss" source(none);
  @import "@ayingott/theme/fonts.css";
  @import "@ayingott/theme";
  `, ["bg-lavender-500", "text-neutral-950", "font-display", "font-reading", "font-mono", "rounded-card", "shadow-card", "focus-ring", "touch-target"])
    for (const forbidden of [".brutal", "--shadow-hard-", ".pressable", "@media (prefers-reduced-motion: reduce)"]) {
      if (defaultCss.includes(forbidden))
        throw new Error(`Tailwind ${tailwindVersion} default consumer compile unexpectedly contains: ${forbidden}`)
    }

    const css = compileConsumer(consumerDir, "brutal", `
  @import "tailwindcss" source(none);
  @import "@ayingott/theme/fonts.css";
  @import "@ayingott/theme";
  @import "@ayingott/theme/brutal.css";
  `, ["bg-lavender-500", "text-neutral-950", "font-display", "font-reading", "font-mono", "rounded-card", "shadow-card", "shadow-hard-md", "focus-ring", "touch-target", "pressable"])
    const requiredOutput = [
      "--surface-canvas",
      "--reading-link",
      ".bg-lavender-500",
      ".font-display",
      ".font-reading",
      ".font-mono",
      ".rounded-card",
      ".shadow-card",
      ".shadow-hard-md",
      ".focus-ring",
      ".touch-target",
      ".pressable",
      ".brutal",
      ".brutal.dark",
      "--border-width-surface",
      "@media (prefers-reduced-motion: reduce)",
      "@font-face",
      "bricolage-grotesque-latin-opsz-wght-normal.woff2",
      "bricolage-grotesque-latin-ext-opsz-wght-normal.woff2",
      "literata-latin-opsz-wght-normal.woff2",
      "literata-latin-ext-opsz-wght-normal.woff2",
      "space-mono-latin-400-normal.woff2",
      "space-mono-latin-700-normal.woff2",
      "lxgw-wenkai-400-normal.woff2",
      "lxgw-wenkai-500-normal.woff2",
    ]
    for (const needle of requiredOutput) {
      if (!css.includes(needle))
        throw new Error(`Tailwind ${tailwindVersion} consumer compile output is missing: ${needle}`)
    }

    // Compile the actual documented recipe against the installed tarball.
    const spec = readFileSync(join(repoRoot, "docs/spec/design-system-v1.0.md"), "utf8")
    const recipeSection = spec.split("## §6 ·")[1]?.split("\n---")[0]
    const recipe = recipeSection?.match(/```css\n([\s\S]*?)```/)?.[1]
    const classList = recipeSection?.match(/这样 consumer 即可使用：(.+?) 等 utility class/)?.[1]
    const candidates = [...(classList ?? "").matchAll(/`([^`]+)`/g)].map(match => match[1])
    if (!recipe || candidates.length < 5)
      throw new Error("Consumer recipe and its promised utilities must be present in §6")
    const recipeCss = postcss.parse(compileConsumer(consumerDir, "recipe", recipe, candidates))
    for (const candidate of candidates) {
      const rules = []
      recipeCss.walkRules(`.${candidate}`, rule => rules.push(rule))
      if (rules.length === 0)
        throw new Error(`Tailwind ${tailwindVersion}: documented consumer utility was not generated: ${candidate}`)
    }

    console.log(`Tailwind ${tailwindVersion} consumer passed`)
  }

  console.log(`real tarball consumer and documented recipe passed: ${basename(tarball)}`)
}
finally {
  rmSync(tempDir, { recursive: true, force: true })
}
