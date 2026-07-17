import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import postcss from "postcss"

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
const contractFile = "docs/spec/paper-ink-theme-contract.json"
const contract = JSON.parse(readFileSync(join(rootDir, contractFile), "utf8"))

const requiredStateMappingIds = [
  "primary-default",
  "primary-hover",
  "primary-active",
  "disabled",
  "focus-neutral",
  "focus-accent",
  "input",
  "status-success",
  "status-warning",
  "status-danger",
  "status-info",
]
const requiredLegalPairIds = [
  "paper-primary-canvas",
  "paper-secondary-canvas",
  "paper-muted-canvas",
  "paper-link-canvas",
  "paper-action-default",
  "paper-action-hover",
  "paper-action-active",
  "ink-primary-canvas",
  "ink-secondary-canvas",
  "ink-muted-canvas",
  "ink-link-canvas",
  "ink-action-default",
  "ink-action-hover",
  "ink-action-active",
  "paper-focus-canvas",
  "paper-focus-panel",
  "paper-focus-elevated",
  "paper-focus-subtle",
  "paper-focus-muted",
  "paper-focus-accent",
  "ink-focus-canvas",
  "ink-focus-panel",
  "ink-focus-elevated",
  "ink-focus-subtle",
  "ink-focus-muted",
  "ink-focus-accent",
  "paper-reading",
  "paper-reading-muted",
  "paper-reading-link",
  "ink-reading",
  "ink-reading-muted",
  "ink-reading-link",
  "paper-success-text",
  "paper-warning-text",
  "paper-danger-text",
  "paper-info-text",
  "ink-success-text",
  "ink-warning-text",
  "ink-danger-text",
  "ink-info-text",
  "paper-success-border",
  "paper-warning-border",
  "paper-danger-border",
  "paper-info-border",
  "ink-success-border",
  "ink-warning-border",
  "ink-danger-border",
  "ink-info-border",
]
const requiredStateMappingsSha256 = "235f87738e12826d74009aed396c34ec985b6fad0a2aaa31c3188f70e06d2f80"
const requiredLegalPairsSha256 = "ff9b5bef71425b430680161a0cb62cbe119620bdbfd062babd3dd7a84ad59cf5"

function expect(condition, message) {
  if (!condition)
    throw new Error(message)
}

function sha256Json(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex")
}

function sameStringSet(actual, expected) {
  return actual.length === expected.length && expected.every(value => actual.includes(value))
}

function readSource(file) {
  return readFileSync(join(rootDir, file), "utf8")
}

function parseCss(source, file) {
  try {
    return postcss.parse(source, { from: file })
  }
  catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`Unsupported CSS syntax in ${file}: ${detail}`)
  }
}

function declarationMap(container, label) {
  const declarations = {}
  for (const node of container.nodes ?? []) {
    if (node.type === "comment")
      continue
    expect(node.type === "decl", `Unsupported nested CSS syntax in ${label}: ${node.toString()}`)
    if (!node.prop.startsWith("--"))
      continue
    expect(!node.important, `Important CSS variable is not allowed in ${label}: ${node.prop}`)
    expect(!Object.hasOwn(declarations, node.prop.slice(2)), `Duplicate CSS variable ${node.prop} in ${label}`)
    declarations[node.prop.slice(2)] = node.value.trim()
  }
  return declarations
}

function variableMap(file, selector) {
  const root = parseCss(readSource(file), file)
  if (selector === "@theme static") {
    const matches = root.nodes.filter(node => node.type === "atrule" && node.name === "theme" && node.params === "static")
    expect(matches.length === 1, `Expected exactly one @theme static block in ${file}`)
    return declarationMap(matches[0], `${file} @theme static`)
  }

  const matches = root.nodes.filter(node => node.type === "rule" && node.selector === selector)
  expect(matches.length === 1, `Expected exactly one ${selector} block in ${file}`)
  return declarationMap(matches[0], `${file} ${selector}`)
}

function exactDeclarations(label, actual, expected) {
  const actualKeys = Object.keys(actual).sort()
  const expectedKeys = Object.keys(expected).sort()
  expect(JSON.stringify(actualKeys) === JSON.stringify(expectedKeys), `${label} declaration set drifted`)
  for (const [name, value] of Object.entries(expected))
    expect(actual[name] === value, `${label} --${name} must be ${value}; received ${actual[name]}`)
}

function resolveVariable(name, maps, chain = []) {
  expect(!chain.includes(name), `Circular CSS variable reference: ${[...chain, name].map(token => `--${token}`).join(" -> ")}`)
  const value = maps.findLast(map => map[name] !== undefined)?.[name]
  expect(value !== undefined, `Missing CSS variable: --${name}`)
  const reference = value.match(/^var\(--([A-Za-z0-9_-]+)\)$/)
  if (reference)
    return resolveVariable(reference[1], maps, [...chain, name])
  expect(/^#[0-9a-fA-F]{6}$/.test(value), `Unsupported color value for --${name}: ${value}`)
  return value.toLowerCase()
}

function srgbToLinear(channel) {
  const value = channel / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(hex) {
  const red = Number.parseInt(hex.slice(1, 3), 16)
  const green = Number.parseInt(hex.slice(3, 5), 16)
  const blue = Number.parseInt(hex.slice(5, 7), 16)
  return 0.2126 * srgbToLinear(red) + 0.7152 * srgbToLinear(green) + 0.0722 * srgbToLinear(blue)
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground)
  const backgroundLuminance = relativeLuminance(background)
  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)
  return (lighter + 0.05) / (darker + 0.05)
}

function expectFailure(label, callback, expectedMessage) {
  try {
    callback()
  }
  catch (error) {
    if (error instanceof Error && error.message.includes(expectedMessage))
      return
    throw error
  }
  throw new Error(`${label} did not fail closed`)
}

function validateContractShape(value) {
  expect(value.version === 1, "Theme contract version must be 1")
  expect(value.defaultMode === "paper", "Paper must remain the default mode")
  expect(value.selectors.paper === ":root", "Paper selector must remain :root")
  expect(value.selectors.ink === ".dark", "Ink selector must remain .dark")
  const stateMappingIds = Object.keys(value.stateMappings)
  expect(sameStringSet(stateMappingIds, requiredStateMappingIds), "State mapping id set drifted")
  expect(sha256Json(value.stateMappings) === requiredStateMappingsSha256, "State mapping values drifted")
  const ids = value.legalPairs.map(pair => pair.id)
  expect(new Set(ids).size === ids.length, "Duplicate legal pair id")
  expect(sameStringSet(ids, requiredLegalPairIds), "Legal pair id set drifted")
  expect(sha256Json(value.legalPairs) === requiredLegalPairsSha256, "Legal pair values drifted")
  for (const pair of value.legalPairs) {
    expect(["paper", "ink"].includes(pair.mode), `Unsupported mode in ${pair.id}`)
    expect(["text", "focus", "non-text"].includes(pair.kind), `Unsupported pair kind in ${pair.id}`)
    expect(pair.minimum === (pair.kind === "text" ? 4.5 : 3), `Invalid minimum in ${pair.id}`)
  }
}

function findRule(root, selector, label) {
  const matches = []
  root.walkRules((rule) => {
    if (rule.selector === selector)
      matches.push(rule)
  })
  expect(matches.length === 1, `Expected exactly one showcase rule for ${label}: ${selector}`)
  return matches[0]
}

function verifyStateMappings(source, value) {
  const root = parseCss(source, contract.sources.showcase)
  for (const [label, mapping] of Object.entries(value.stateMappings)) {
    const declarations = declarationMap(findRule(root, mapping.selector, label), `${label} ${mapping.selector}`)
    for (const [property, expected] of Object.entries(mapping.declarations)) {
      const actual = findRule(root, mapping.selector, label).nodes.find(node => node.type === "decl" && node.prop === property)
      expect(actual?.value.trim() === expected, `${label} ${property} must be ${expected}; received ${actual?.value.trim()}`)
    }
    expect(Object.keys(declarations).length === 0, `${label} must use CSS properties, not declare custom properties`)
  }

  root.walkDecls((declaration) => {
    if (!declaration.parent?.selector?.includes("theme-"))
      return
    expect(!["background-image", "backdrop-filter"].includes(declaration.prop), `No-AI-slop gate rejected ${declaration.prop}`)
    expect(!/gradient\(|blur\(/i.test(declaration.value), `No-AI-slop gate rejected ${declaration.value}`)
  })
}

function verifyPair(pair, maps) {
  const foreground = resolveVariable(pair.foreground, maps)
  const background = resolveVariable(pair.background, maps)
  const ratio = contrastRatio(foreground, background)
  expect(ratio >= pair.minimum, `${pair.id} contrast ${foreground} on ${background} = ${ratio.toFixed(2)}:1 below ${pair.minimum}:1`)
  return ratio
}

validateContractShape(contract)
const stateMappingsWithoutPrimary = { ...contract.stateMappings }
delete stateMappingsWithoutPrimary["primary-default"]
expectFailure(
  "deleted required state mapping",
  () => validateContractShape({ ...contract, stateMappings: stateMappingsWithoutPrimary }),
  "State mapping id set drifted",
)
expectFailure(
  "wrong required state mapping value",
  () => validateContractShape({
    ...contract,
    stateMappings: {
      ...contract.stateMappings,
      "primary-default": {
        ...contract.stateMappings["primary-default"],
        declarations: {
          ...contract.stateMappings["primary-default"].declarations,
          background: "var(--surface-panel)",
        },
      },
    },
  }),
  "State mapping values drifted",
)
expectFailure(
  "duplicate pair id",
  () => validateContractShape({ ...contract, legalPairs: [contract.legalPairs[0], contract.legalPairs[0]] }),
  "Duplicate legal pair id",
)
expectFailure(
  "deleted required legal pair",
  () => validateContractShape({ ...contract, legalPairs: contract.legalPairs.slice(1) }),
  "Legal pair id set drifted",
)
expectFailure(
  "wrong required legal pair value",
  () => validateContractShape({
    ...contract,
    legalPairs: [
      { ...contract.legalPairs[0], foreground: "text-secondary" },
      ...contract.legalPairs.slice(1),
    ],
  }),
  "Legal pair values drifted",
)
expectFailure(
  "unsupported color value",
  () => resolveVariable("foreground", [{ foreground: "rgb(0 0 0)" }]),
  "Unsupported color value",
)
expectFailure(
  "contrast threshold",
  () => verifyPair({ id: "bad-pair", foreground: "foreground", background: "background", minimum: 4.5 }, [{ foreground: "#777777", background: "#ffffff" }]),
  "bad-pair contrast",
)
expectFailure(
  "missing mapped selector",
  () => verifyStateMappings(".other { color: red; }", { stateMappings: { missing: { selector: ".missing", declarations: { color: "red" } } } }),
  "Expected exactly one showcase rule",
)

const foundation = variableMap(contract.sources.foundation, "@theme static")
const paper = variableMap(contract.sources.paper, contract.selectors.paper)
const ink = variableMap(contract.sources.ink, contract.selectors.ink)
const reading = variableMap(contract.sources.reading, ":root")
const readingInk = variableMap(contract.sources.reading, contract.selectors.ink)

for (const [name, value] of Object.entries(contract.foundationDeclarations))
  expect(foundation[name] === value, `foundation --${name} must be ${value}; received ${foundation[name]}`)
exactDeclarations("Paper", paper, contract.modeDeclarations.paper)
exactDeclarations("Ink", ink, contract.modeDeclarations.ink)
exactDeclarations("reading", reading, contract.readingDeclarations)
exactDeclarations("Ink reading overrides", readingInk, contract.readingModeOverrides.ink)
verifyStateMappings(readSource(contract.sources.showcase), contract)

const modeMaps = {
  paper: [foundation, paper, reading],
  ink: [foundation, paper, ink, reading, readingInk],
}

for (const pair of contract.legalPairs) {
  const ratio = verifyPair(pair, modeMaps[pair.mode])
  console.log(`${pair.id}: ${ratio.toFixed(2)}:1`)
}

console.log("Paper & Ink theme contract passed")
