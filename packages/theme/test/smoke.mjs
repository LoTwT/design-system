import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs"
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

const requiredOutput = [
  ["lavender utility", ".bg-lavender-500"],
  ["display font utility", ".font-display"],
  ["sans font utility", ".font-sans"],
  ["mono font utility", ".font-mono"],
  ["card radius utility", ".rounded-card"],
  ["card shadow utility", ".shadow-card"],
  ["focus ring utility", ".focus-ring"],
  ["touch target utility", ".touch-target"],
  ["surface semantic var", "--surface-canvas"],
  ["text semantic var", "--text-primary"],
  ["dark selector", ".dark"],
  ["font face", "@font-face"],
  ["Space Grotesk latin font", "space-grotesk-latin-wght-normal.woff2"],
  ["Space Grotesk latin-ext font", "space-grotesk-latin-ext-wght-normal.woff2"],
  ["Space Mono regular font", "space-mono-latin-400-normal.woff2"],
  ["Space Mono bold font", "space-mono-latin-700-normal.woff2"],
]

const missing = requiredOutput.filter(([, needle]) => !css.includes(needle))

const requiredFiles = [
  "src/index.css",
  "src/fonts.css",
  "src/fonts/space-grotesk-latin-wght-normal.woff2",
  "src/fonts/space-grotesk-latin-ext-wght-normal.woff2",
  "src/fonts/space-mono-latin-400-normal.woff2",
  "src/fonts/space-mono-latin-700-normal.woff2",
  "THIRD_PARTY_NOTICES.md",
].filter((file) => !existsSync(join(packageDir, file)))

if (missing.length || requiredFiles.length) {
  for (const [label, needle] of missing) {
    console.error(`Missing ${label}: ${needle}`)
  }
  for (const file of requiredFiles) {
    console.error(`Missing required package file: ${file}`)
  }
  process.exit(1)
}

console.log("smoke passed")
