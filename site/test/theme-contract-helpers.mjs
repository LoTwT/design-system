import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import postcss from "postcss"

export function expect(condition, message) {
  if (!condition)
    throw new Error(message)
}

export function sha256Json(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex")
}

export function sameStringSet(actual, expected) {
  return actual.length === expected.length && expected.every(value => actual.includes(value))
}

export function readSource(rootDir, file) {
  return readFileSync(join(rootDir, file), "utf8")
}

export function parseCss(source, file) {
  try {
    return postcss.parse(source, { from: file })
  }
  catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`Unsupported CSS syntax in ${file}: ${detail}`)
  }
}

export function declarationMap(container, label) {
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

export function propertyMap(container, label) {
  const declarations = {}
  for (const node of container.nodes ?? []) {
    if (node.type === "comment")
      continue
    expect(node.type === "decl", `Unsupported nested CSS syntax in ${label}: ${node.toString()}`)
    expect(!node.important, `Important declaration is not allowed in ${label}: ${node.prop}`)
    expect(!Object.hasOwn(declarations, node.prop), `Duplicate declaration ${node.prop} in ${label}`)
    declarations[node.prop] = node.value.trim()
  }
  return declarations
}

export function variableMap(rootDir, file, selector) {
  const root = parseCss(readSource(rootDir, file), file)
  if (selector === "@theme static") {
    const matches = root.nodes.filter(node => node.type === "atrule" && node.name === "theme" && node.params === "static")
    expect(matches.length === 1, `Expected exactly one @theme static block in ${file}`)
    return declarationMap(matches[0], `${file} @theme static`)
  }

  const matches = root.nodes.filter(node => node.type === "rule" && node.selector === selector)
  expect(matches.length === 1, `Expected exactly one ${selector} block in ${file}`)
  return declarationMap(matches[0], `${file} ${selector}`)
}

export function exactDeclarations(label, actual, expected) {
  const actualKeys = Object.keys(actual).sort()
  const expectedKeys = Object.keys(expected).sort()
  expect(JSON.stringify(actualKeys) === JSON.stringify(expectedKeys), `${label} declaration set drifted`)
  for (const [name, value] of Object.entries(expected))
    expect(actual[name] === value, `${label} --${name} must be ${value}; received ${actual[name]}`)
}

export function resolveVariable(name, maps, chain = []) {
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

export function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground)
  const backgroundLuminance = relativeLuminance(background)
  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)
  return (lighter + 0.05) / (darker + 0.05)
}

export function expectFailure(label, callback, expectedMessage) {
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

export function findRule(root, selector, label) {
  const matches = []
  root.walkRules((rule) => {
    if (rule.selector === selector)
      matches.push(rule)
  })
  expect(matches.length === 1, `Expected exactly one showcase rule for ${label}: ${selector}`)
  return matches[0]
}

export function verifyStateMappings(source, value, showcaseFile) {
  const root = parseCss(source, showcaseFile)
  for (const [label, mapping] of Object.entries(value.stateMappings)) {
    const rule = findRule(root, mapping.selector, label)
    const declarations = declarationMap(rule, `${label} ${mapping.selector}`)
    for (const [property, expected] of Object.entries(mapping.declarations)) {
      const actual = rule.nodes.find(node => node.type === "decl" && node.prop === property)
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

export function verifyPair(pair, maps) {
  const foreground = resolveVariable(pair.foreground, maps)
  const background = resolveVariable(pair.background, maps)
  const ratio = contrastRatio(foreground, background)
  expect(ratio >= pair.minimum, `${pair.id} contrast ${foreground} on ${background} = ${ratio.toFixed(2)}:1 below ${pair.minimum}:1`)
  if (pair.target !== undefined)
    expect(ratio >= pair.target, `${pair.id} contrast ${foreground} on ${background} = ${ratio.toFixed(2)}:1 below target ${pair.target}:1`)
  return ratio
}
