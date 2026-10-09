import { readdirSync, readFileSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { expect } from "./theme-contract-helpers.mjs"

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))))

function listFiles(dir, extension) {
  return readdirSync(join(rootDir, dir), { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith(extension))
    .map(entry => relative(rootDir, join(entry.parentPath, entry.name)))
    .filter(file => !/(^|\/)(node_modules|dist|cache)\//.test(file))
}

const readSource = file => readFileSync(join(rootDir, file), "utf8")

const declared = new Set(listFiles("packages/theme/src", ".css")
  .flatMap(file => [...readSource(file).matchAll(/--([a-z][\w-]*)\s*:/g)].map(match => match[1])))

// Named in SKILL.md as tokens the theme deliberately does not ship.
const documentedAbsent = new Set(["type-h1", "type-meta"])

// `--name-*` and `--name-{size}` are prefixes; `}--line-height` continues a placeholder.
// Shell code blocks are skipped so CLI flags are not read as CSS variables.
function unknownTokens(text) {
  const unknown = new Set()
  const prose = text.replace(/^```(?:bash|sh|shell|zsh|console)\n[\s\S]*?^```/gm, "")
  for (const [mention, name, prefix] of prose.matchAll(/(?<![\w}-])--([a-z][a-z0-9]*(?:-[a-z0-9]+)*)(-\*|-\{)?/g)) {
    const exists = prefix
      ? [...declared].some(token => token.startsWith(`${name}-`))
      : declared.has(name) || documentedAbsent.has(name)
    if (!exists)
      unknown.add(mention)
  }
  return [...unknown]
}

const livingDocs = [
  "packages/theme/README.md",
  ...listFiles("skills", ".md"),
  ...listFiles("site", ".md"),
]
for (const file of livingDocs) {
  const unknown = unknownTokens(readSource(file))
  expect(unknown.length === 0, `${file} mentions CSS variables missing from packages/theme/src: ${unknown.join(", ")}`)
}

expect(
  JSON.stringify(unknownTokens("Use `--surface-base`, `--text-{size}--line-height`, `--z-*`, and `--type-h1`.\n```bash\npnpm add --save-exact\n```\n"))
    === JSON.stringify(["--surface-base"]),
  "Doc token check must reject renamed tokens and accept documented placeholders",
)

const readme = readSource("packages/theme/README.md")
const exportsLine = readme.match(/^- The public exports are (.+)\.$/m)?.[1] ?? ""
const documentedExports = [...exportsLine.matchAll(/`([^`]+)`/g)].map(match => match[1])
const manifestExports = Object.keys(JSON.parse(readSource("packages/theme/package.json")).exports)
expect(
  JSON.stringify(documentedExports) === JSON.stringify(manifestExports),
  `README public exports ${JSON.stringify(documentedExports)} must match package.json ${JSON.stringify(manifestExports)}`,
)
for (const entry of ["@ayingott/theme", "@ayingott/theme/fonts.css", "@ayingott/theme/brutal.css"])
  expect(readme.includes(`@import "${entry}";`), `README must show how to import ${entry}`)

console.log(`doc token contract passed: ${livingDocs.length} living docs, ${declared.size} declared variables`)
