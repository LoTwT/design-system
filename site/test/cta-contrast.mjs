import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import postcss from "postcss"

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))))

function readSource(file) {
  return readFileSync(join(rootDir, file), "utf8")
}

function parseVariables(source, file, selector) {
  let root
  try {
    root = postcss.parse(source, { from: file })
  }
  catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`Unsupported CSS syntax in ${file}: ${detail}`)
  }

  const containers = []
  if (selector === undefined) {
    root.walk((node) => {
      if ((node.type === "rule" || node.type === "atrule")
        && node.nodes?.some(child => child.type === "decl" && child.prop.startsWith("--")))
        containers.push(node)
    })
  }
  else {
    root.walkRules((rule) => {
      if (rule.selector === selector)
        containers.push(rule)
    })
  }

  if (containers.length === 0)
    throw new Error(`Missing CSS block ${selector ?? "<any>"} in ${file}`)

  const variables = {}
  for (const container of containers) {
    for (const node of container.nodes ?? []) {
      if (node.type === "comment")
        continue
      if (node.type !== "decl")
        throw new Error(`Unsupported nested CSS syntax in ${file}: ${node.toString()}`)
      if (!node.prop.startsWith("--"))
        continue
      if (!/^--[A-Za-z0-9_-]+$/.test(node.prop) || node.value.trim() === "" || node.important)
        throw new Error(`Unsupported CSS variable syntax in ${file}: ${node.toString()}`)

      const name = node.prop.slice(2)
      if (Object.hasOwn(variables, name))
        throw new Error(`Duplicate CSS variable --${name} in ${file}`)
      variables[name] = node.value.trim()
    }
  }

  return variables
}

function readVariables(file, selector) {
  return parseVariables(readSource(file), file, selector)
}

function resolveVariable(name, maps, chain = []) {
  if (chain.includes(name))
    throw new Error(`Circular CSS variable reference: ${[...chain, name].map(token => `--${token}`).join(" -> ")}`)

  const value = maps.findLast(map => map[name] !== undefined)?.[name]
  if (value === undefined)
    throw new Error(`Missing CSS variable: --${name}`)

  const reference = value.match(/^var\(--([A-Za-z0-9_-]+)\)$/)
  if (reference)
    return resolveVariable(reference[1], maps, [...chain, name])

  if (!/^#[0-9a-fA-F]{6}$/.test(value))
    throw new Error(`Unsupported color value for --${name}: ${value}`)

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
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background))
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background))
  return (lighter + 0.05) / (darker + 0.05)
}

function expectResolutionFailure(label, callback, expectedMessage) {
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

expectResolutionFailure("missing variable", () => resolveVariable("missing", [{}]), "Missing CSS variable")
expectResolutionFailure("circular variable", () => resolveVariable("a", [{ a: "var(--b)", b: "var(--a)" }]), "Circular CSS variable")
expectResolutionFailure("unsupported value", () => resolveVariable("a", [{ a: "rgb(0 0 0)" }]), "Unsupported color value")
expectResolutionFailure(
  "unsupported parser syntax",
  () => parseVariables(":root { --a: #000000", "<invalid-fixture>", ":root"),
  "Unsupported CSS syntax",
)
expectResolutionFailure(
  "ambiguous parser syntax",
  () => parseVariables(":root { --a: #000000; --a: #ffffff; }", "<duplicate-fixture>", ":root"),
  "Duplicate CSS variable",
)
expectResolutionFailure(
  "nested parser syntax",
  () => parseVariables(":root { @media (prefers-contrast: more) { --a: #000000; } }", "<nested-fixture>", ":root"),
  "Unsupported nested CSS syntax",
)

const foundation = readVariables("packages/theme/src/foundation/colors.css")
const lightSemantic = readVariables("packages/theme/src/semantic/light.css", ":root")
const darkSemantic = readVariables("packages/theme/src/semantic/dark.css", ".dark")
const siteLight = readVariables("site/.vitepress/theme/style.css", ":root")
const siteDark = readVariables("site/.vitepress/theme/style.css", ".dark")

const modes = [
  ["paper", [foundation, lightSemantic, siteLight]],
  ["ink", [foundation, lightSemantic, darkSemantic, siteLight, siteDark]],
]
const states = [
  ["default", "vp-button-brand-text", "vp-button-brand-bg", "vp-button-brand-border", "accent-contrast", "accent-primary"],
  ["hover", "vp-button-brand-hover-text", "vp-button-brand-hover-bg", "vp-button-brand-hover-border", "accent-contrast-hover", "accent-primary-hover"],
  ["active", "vp-button-brand-active-text", "vp-button-brand-active-bg", "vp-button-brand-active-border", "accent-contrast-active", "accent-primary-active"],
]

const failures = []
for (const [state, textVariable, backgroundVariable, borderVariable, textToken, colorToken] of states) {
  const expectedText = `var(--${textToken})`
  const expectedColor = `var(--${colorToken})`
  if (siteLight[textVariable] !== expectedText)
    failures.push(`${state} text must map to ${expectedText}`)
  if (siteLight[backgroundVariable] !== expectedColor)
    failures.push(`${state} background must map to ${expectedColor}`)
  if (siteLight[borderVariable] !== expectedColor)
    failures.push(`${state} border must map to ${expectedColor}`)
  if (siteDark[textVariable] !== undefined || siteDark[backgroundVariable] !== undefined || siteDark[borderVariable] !== undefined)
    failures.push(`${state} must inherit the same semantic mapping in Ink without a site-specific override`)
}

for (const [mode, maps] of modes) {
  for (const [state, textVariable, backgroundVariable, borderVariable] of states) {
    const foreground = resolveVariable(textVariable, maps)
    const background = resolveVariable(backgroundVariable, maps)
    const border = resolveVariable(borderVariable, maps)
    const ratio = contrastRatio(foreground, background)

    if (border !== background)
      failures.push(`${mode} ${state} border ${border} does not match background ${background}`)
    if (ratio < 4.5)
      failures.push(`${mode} ${state} contrast ${foreground} on ${background} = ${ratio.toFixed(2)}:1`)
    else
      console.log(`${mode} ${state}: ${ratio.toFixed(2)}:1`)
  }
}

if (failures.length > 0) {
  for (const failure of failures)
    console.error(failure)
  process.exit(1)
}

console.log("site CTA contrast passed")
