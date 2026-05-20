import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)))
const tmpDir = join(packageDir, "test", ".tmp")
const input = join(packageDir, "test", "smoke.package.css")
const output = join(tmpDir, "smoke.css")

rmSync(tmpDir, { recursive: true, force: true })
mkdirSync(tmpDir, { recursive: true })

execFileSync("pnpm", ["exec", "tailwindcss", "-i", input, "-o", output], {
  cwd: packageDir,
  stdio: "inherit",
})

const css = readFileSync(output, "utf8")

const readCssVars = (file) => {
  const source = readFileSync(join(packageDir, file), "utf8")
  return [...source.matchAll(/--([A-Za-z0-9_-]+)\s*:/g)].map((match) => match[1])
}

const readCssVarMap = (file) => {
  const source = readFileSync(join(packageDir, file), "utf8")
  return Object.fromEntries(
    [...source.matchAll(/--([A-Za-z0-9_-]+)\s*:\s*([^;]+);/g)]
      .map((match) => [match[1], match[2].trim()]),
  )
}

const tokenSourceFiles = [
  ...readdirSync(join(packageDir, "src", "foundation")).map((file) => `src/foundation/${file}`),
  ...readdirSync(join(packageDir, "src", "layers")).map((file) => `src/layers/${file}`),
  ...readdirSync(join(packageDir, "src", "semantic")).map((file) => `src/semantic/${file}`),
]

const missingTokenVars = [...new Set(tokenSourceFiles.flatMap(readCssVars))]
  .filter((token) => !css.includes(`--${token}:`))

const requiredOutput = [
  ["lavender utility", ".bg-lavender-500"],
  ["display font utility", ".font-display"],
  ["sans font utility", ".font-sans"],
  ["reading font utility", ".font-reading"],
  ["mono font utility", ".font-mono"],
  ["card radius utility", ".rounded-card"],
  ["card shadow utility", ".shadow-card"],
  ["focus ring utility", ".focus-ring"],
  ["touch target utility", ".touch-target"],
  ["surface semantic var", "--surface-canvas"],
  ["text semantic var", "--text-primary"],
  ["reading foreground var", "--reading-fg"],
  ["reading link var", "--reading-link"],
  ["reading measure var", "--reading-measure"],
  ["dark selector", ".dark"],
  ["font face", "@font-face"],
  ["Space Grotesk latin font", "space-grotesk-latin-wght-normal.woff2"],
  ["Space Grotesk latin-ext font", "space-grotesk-latin-ext-wght-normal.woff2"],
  ["Newsreader latin font", "newsreader-latin-opsz-normal.woff2"],
  ["Newsreader latin-ext font", "newsreader-latin-ext-opsz-normal.woff2"],
  ["Space Mono regular font", "space-mono-latin-400-normal.woff2"],
  ["Space Mono bold font", "space-mono-latin-700-normal.woff2"],
]

const missing = requiredOutput.filter(([, needle]) => !css.includes(needle))

const requiredFiles = [
  "src/index.css",
  "src/fonts.css",
  "src/fonts/space-grotesk-latin-wght-normal.woff2",
  "src/fonts/space-grotesk-latin-ext-wght-normal.woff2",
  "src/fonts/newsreader-latin-opsz-normal.woff2",
  "src/fonts/newsreader-latin-ext-opsz-normal.woff2",
  "src/fonts/space-mono-latin-400-normal.woff2",
  "src/fonts/space-mono-latin-700-normal.woff2",
  "THIRD_PARTY_NOTICES.md",
].filter((file) => !existsSync(join(packageDir, file)))

function srgbToLinear(channel) {
  const value = channel / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(hex) {
  const normalized = hex.replace("#", "")
  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)
  return 0.2126 * srgbToLinear(red) + 0.7152 * srgbToLinear(green) + 0.0722 * srgbToLinear(blue)
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground)
  const backgroundLuminance = relativeLuminance(background)
  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)
  return (lighter + 0.05) / (darker + 0.05)
}

function resolveVar(name, maps, seen = new Set()) {
  if (seen.has(name))
    throw new Error(`Circular CSS var reference: ${[...seen, name].join(" -> ")}`)
  seen.add(name)

  const value = maps.findLast((map) => map[name] !== undefined)?.[name]
  if (!value)
    throw new Error(`Missing CSS var: --${name}`)

  const reference = value.match(/^var\(--([A-Za-z0-9_-]+)\)$/)
  return reference ? resolveVar(reference[1], maps, seen) : value
}

const foundationMaps = [
  readCssVarMap("src/foundation/colors.css"),
  readCssVarMap("src/foundation/typography.css"),
]
const lightMaps = [
  ...foundationMaps,
  readCssVarMap("src/semantic/light.css"),
  readCssVarMap("src/semantic/reading.css"),
]
const darkMaps = [
  ...foundationMaps,
  readCssVarMap("src/semantic/light.css"),
  readCssVarMap("src/semantic/dark.css"),
  readCssVarMap("src/semantic/reading.css"),
]
const contrastChecks = [
  ["reading foreground light", resolveVar("reading-fg", lightMaps), resolveVar("reading-bg", lightMaps)],
  ["reading muted foreground light", resolveVar("reading-fg-muted", lightMaps), resolveVar("reading-bg", lightMaps)],
  ["reading link light", resolveVar("reading-link", lightMaps), resolveVar("reading-bg", lightMaps)],
  ["reading code foreground light", resolveVar("reading-code-fg", lightMaps), resolveVar("reading-code-bg", lightMaps)],
  ["reading foreground dark", resolveVar("reading-fg", darkMaps), resolveVar("reading-bg", darkMaps)],
  ["reading muted foreground dark", resolveVar("reading-fg-muted", darkMaps), resolveVar("reading-bg", darkMaps)],
  ["reading link dark", resolveVar("reading-link", darkMaps), resolveVar("reading-bg", darkMaps)],
  ["reading code foreground dark", resolveVar("reading-code-fg", darkMaps), resolveVar("reading-code-bg", darkMaps)],
]
const contrastFailures = contrastChecks
  .map(([label, foreground, background]) => [label, foreground, background, contrastRatio(foreground, background)])
  .filter(([, , , ratio]) => ratio < 4.5)

if (missing.length || missingTokenVars.length || requiredFiles.length) {
  for (const [label, needle] of missing) {
    console.error(`Missing ${label}: ${needle}`)
  }
  for (const token of missingTokenVars) {
    console.error(`Missing token CSS variable: --${token}`)
  }
  for (const file of requiredFiles) {
    console.error(`Missing required package file: ${file}`)
  }
  for (const [label, foreground, background, ratio] of contrastFailures) {
    console.error(`Reading contrast below 4.5:1 for ${label}: ${foreground} on ${background} = ${ratio.toFixed(2)}:1`)
  }
  process.exit(1)
}

if (contrastFailures.length) {
  for (const [label, foreground, background, ratio] of contrastFailures) {
    console.error(`Reading contrast below 4.5:1 for ${label}: ${foreground} on ${background} = ${ratio.toFixed(2)}:1`)
  }
  process.exit(1)
}

console.log("smoke passed")
