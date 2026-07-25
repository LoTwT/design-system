import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))))

function readSource(file) {
  return readFileSync(join(rootDir, file), "utf8")
}

function expect(condition, message) {
  if (!condition)
    throw new Error(message)
}

function parseTokens(css) {
  const tokens = []
  const pattern = /--([a-zA-Z0-9_-]+):\s*([^;]+);/g
  let match

  while ((match = pattern.exec(css)) !== null) {
    tokens.push({
      name: match[1],
      value: match[2].trim().replace(/\s+/g, " "),
    })
  }

  return tokens
}

function expectPrefix(file, prefix, minimum) {
  const matches = parseTokens(readSource(file)).filter(token => token.name.startsWith(prefix))
  expect(matches.length >= minimum, `${file} must expose at least ${minimum} tokens with prefix ${prefix}; received ${matches.length}`)
}

function expectPageRegistration(file, fragments) {
  const source = readSource(file)
  for (const fragment of fragments)
    expect(source.includes(fragment), `${file} must register preview: ${fragment}`)
}

const previewContracts = [
  ["packages/theme/src/foundation/colors.css", "color-surface-", 6],
  ["packages/theme/src/foundation/colors.css", "color-lavender-", 10],
  ["packages/theme/src/foundation/colors.css", "color-neutral-", 10],
  ["packages/theme/src/foundation/colors.css", "color-mint-", 10],
  ["packages/theme/src/foundation/colors.css", "color-sky-", 10],
  ["packages/theme/src/foundation/colors.css", "color-amber-", 10],
  ["packages/theme/src/foundation/colors.css", "color-rose-", 10],
  ["packages/theme/src/foundation/colors.css", "color-ink-", 10],
  ["packages/theme/src/foundation/colors.css", "color-success-", 4],
  ["packages/theme/src/foundation/colors.css", "color-warning-", 4],
  ["packages/theme/src/foundation/colors.css", "color-danger-", 4],
  ["packages/theme/src/foundation/colors.css", "color-info-", 4],
  ["packages/theme/src/foundation/colors.css", "color-syntax-", 6],
  ["packages/theme/src/semantic/light.css", "surface-", 5],
  ["packages/theme/src/semantic/light.css", "text-", 5],
  ["packages/theme/src/semantic/light.css", "accent-", 7],
  ["packages/theme/src/semantic/light.css", "status-", 16],
  ["packages/theme/src/semantic/dark.css", "surface-", 5],
  ["packages/theme/src/semantic/dark.css", "text-", 5],
  ["packages/theme/src/semantic/dark.css", "accent-", 7],
  ["packages/theme/src/foundation/spacing.css", "spacing-", 1],
  ["packages/theme/src/foundation/sizing.css", "size-", 1],
  ["packages/theme/src/foundation/radius.css", "radius-", 1],
  ["packages/theme/src/foundation/shadow.css", "shadow-", 1],
  ["packages/theme/src/foundation/border.css", "border-width-", 1],
  ["packages/theme/src/foundation/motion.css", "duration-", 1],
  ["packages/theme/src/layers/transitions.css", "transition-", 1],
  ["packages/theme/src/foundation/typography.css", "text-", 1],
]

for (const contract of previewContracts)
  expectPrefix(...contract)

expectPageRegistration("site/tokens/colors.md", [
  'prefix="color-surface-"',
  'prefix="color-lavender-"',
  'prefix="color-neutral-"',
  'prefix="color-mint-"',
  'prefix="color-sky-"',
  'prefix="color-amber-"',
  'prefix="color-rose-"',
  'prefix="color-ink-"',
  'prefix="color-success-"',
  'prefix="color-warning-"',
  'prefix="color-danger-"',
  'prefix="color-info-"',
  'prefix="color-syntax-"',
])
expectPageRegistration("site/tokens/semantic.md", [
  'prefix="surface-" source="semantic-light"',
  'prefix="text-" source="semantic-light"',
  'prefix="accent-" source="semantic-light"',
  'prefix="status-" source="semantic-light"',
  'prefix="surface-" source="semantic-dark"',
  'prefix="text-" source="semantic-dark"',
  'prefix="accent-" source="semantic-dark"',
])
expectPageRegistration("site/tokens/spacing.md", [
  'source="spacing" prefix="spacing-"',
  'source="sizing" prefix="size-"',
])
expectPageRegistration("site/tokens/effects.md", [
  'source="radius" prefix="radius-"',
  'source="shadow" prefix="shadow-"',
  'source="border" prefix="border-width-"',
  'source="motion" prefix="duration-"',
  'source="transitions" prefix="transition-"',
])
expectPageRegistration("site/tokens/typography.md", ["<TypeScale />"])

console.log("site token preview contract passed")
