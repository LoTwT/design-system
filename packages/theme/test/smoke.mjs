import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)))
const rootDir = dirname(dirname(packageDir))
const brutalContract = JSON.parse(readFileSync(join(rootDir, "docs/spec/brutal-theme-contract.json"), "utf8"))
const tmpDir = join(packageDir, "test", ".tmp")
const input = join(packageDir, "test", "smoke.package.css")
const output = join(tmpDir, "smoke.css")
const themeOnlyInput = join(rootDir, brutalContract.defaultBaseline.compiledInput)
const themeOnlyOutput = join(rootDir, brutalContract.defaultBaseline.compiledOutput)
const brutalInput = join(tmpDir, "smoke.brutal.css")
const brutalOutput = join(tmpDir, "smoke.brutal.output.css")

rmSync(tmpDir, { recursive: true, force: true })
mkdirSync(tmpDir, { recursive: true })
writeFileSync(brutalInput, `@import "tailwindcss";
@import "@ayingott/theme";
@import "@ayingott/theme/brutal.css";

@source inline("pressable shadow-hard-sm shadow-hard-md shadow-hard-lg focus-ring touch-target");
`)

for (const [fixtureInput, fixtureOutput] of [
  [input, output],
  [themeOnlyInput, themeOnlyOutput],
  [brutalInput, brutalOutput],
]) {
  execFileSync("pnpm", ["exec", "tailwindcss", "-i", fixtureInput, "-o", fixtureOutput], {
    cwd: packageDir,
    stdio: "inherit",
  })
}

const css = readFileSync(output, "utf8")
const themeOnlyCss = readFileSync(themeOnlyOutput, "utf8")
const brutalCss = readFileSync(brutalOutput, "utf8")
const themeOnlySha256 = createHash("sha256").update(themeOnlyCss).digest("hex")
const requiredThemeOnlySha256 = brutalContract.defaultBaseline.compiledSha256

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
  ...readdirSync(join(packageDir, "src", "semantic"))
    .filter(file => file !== "brutal.css")
    .map(file => `src/semantic/${file}`),
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
  ["reading letter spacing var", "--reading-letter-spacing"],
  ["reading focus var", "--reading-focus"],
  ["focus on accent var", "--focus-ring-on-accent-color"],
  ["success status foreground var", "--status-success-fg"],
  ["warning status background var", "--status-warning-bg"],
  ["danger status border var", "--status-danger-border"],
  ["info status foreground var", "--status-info-fg"],
  ["surface border role var", "--border-width-surface"],
  ["control border role var", "--border-width-control"],
  ["dark selector", ".dark"],
  ["increased contrast override", "@media (prefers-contrast: more)"],
  ["forced colors override", "@media (forced-colors: active)"],
  ["forced colors focus", "Highlight"],
  ["forced colors link", "LinkText"],
  ["font face", "@font-face"],
  ["Space Grotesk latin font", "space-grotesk-latin-wght-normal.woff2"],
  ["Space Grotesk latin-ext font", "space-grotesk-latin-ext-wght-normal.woff2"],
  ["Newsreader latin font", "newsreader-latin-opsz-normal.woff2"],
  ["Newsreader latin-ext font", "newsreader-latin-ext-opsz-normal.woff2"],
  ["Space Mono regular font", "space-mono-latin-400-normal.woff2"],
  ["Space Mono bold font", "space-mono-latin-700-normal.woff2"],
]

const missing = requiredOutput.filter(([, needle]) => !css.includes(needle))
const forbiddenPackageOutput = [
  ["package-level reduced motion override", "@media (prefers-reduced-motion: reduce)"],
].filter(([, needle]) => css.includes(needle))
const forbiddenThemeOnlyOutput = [
  ["font-face declaration", "@font-face"],
  ["bundled font asset", ".woff2"],
  ["Brutal selector", ".brutal"],
  ["hard shadow token", "--shadow-hard-"],
  ["pressable utility", ".pressable"],
  ["package-level reduced motion override", "@media (prefers-reduced-motion: reduce)"],
].filter(([, needle]) => themeOnlyCss.includes(needle))
const requiredBrutalOutput = [
  ["Brutal Light selector", ".brutal"],
  ["Brutal Dark selector", ".brutal.dark"],
  ["hard shadow token", "--shadow-hard-md"],
  ["hard shadow utility", ".shadow-hard-md"],
  ["surface border role", "--border-width-surface"],
  ["control border role", "--border-width-control"],
  ["pressable utility", ".pressable"],
  ["local reduced motion override", "@media (prefers-reduced-motion: reduce)"],
  ["forced colors override", "@media (forced-colors: active)"],
].filter(([, needle]) => !brutalCss.includes(needle))

const requiredFiles = [
  "src/index.css",
  "src/brutal.css",
  "src/semantic/brutal.css",
  "src/utilities/pressable.css",
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

if (
  missing.length
  || missingTokenVars.length
  || requiredFiles.length
  || forbiddenPackageOutput.length
  || forbiddenThemeOnlyOutput.length
  || requiredBrutalOutput.length
  || themeOnlySha256 !== requiredThemeOnlySha256
) {
  for (const [label, needle] of missing) {
    console.error(`Missing ${label}: ${needle}`)
  }
  for (const token of missingTokenVars) {
    console.error(`Missing token CSS variable: --${token}`)
  }
  for (const file of requiredFiles) {
    console.error(`Missing required package file: ${file}`)
  }
  for (const [label, needle] of forbiddenPackageOutput) {
    console.error(`Package build unexpectedly contains ${label}: ${needle}`)
  }
  for (const [label, needle] of forbiddenThemeOnlyOutput) {
    console.error(`Theme-only build unexpectedly contains ${label}: ${needle}`)
  }
  for (const [label, needle] of requiredBrutalOutput) {
    console.error(`Brutal build is missing ${label}: ${needle}`)
  }
  if (themeOnlySha256 !== requiredThemeOnlySha256)
    console.error(`Default compiled CSS drifted: expected ${requiredThemeOnlySha256}; received ${themeOnlySha256}`)
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
