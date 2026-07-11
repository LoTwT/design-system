import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))))

function readSource(file) {
  return readFileSync(join(rootDir, file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
}

function readVariables(file, selector) {
  const source = readSource(file)
  const blocks = [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((match) => {
      const blockSelector = match[1].trim().split(";").at(-1).trim()
      return selector === undefined || blockSelector === selector
    })

  if (blocks.length === 0)
    throw new Error(`Missing CSS block ${selector ?? "<any>"} in ${file}`)

  return Object.fromEntries(
    blocks.flatMap((match) => [...match[2].matchAll(/--([A-Za-z0-9_-]+)\s*:\s*([^;]+);/g)])
      .map((match) => [match[1], match[2].trim()]),
  )
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

const foundation = readVariables("packages/theme/src/foundation/colors.css")
const lightSemantic = readVariables("packages/theme/src/semantic/light.css", ":root")
const darkSemantic = readVariables("packages/theme/src/semantic/dark.css", ".dark")
const siteLight = readVariables("site/.vitepress/theme/style.css", ":root")
const siteDark = readVariables("site/.vitepress/theme/style.css", ".dark")

const modes = [
  ["light", [foundation, lightSemantic, siteLight]],
  ["dark", [foundation, lightSemantic, darkSemantic, siteLight, siteDark]],
]
const states = [
  ["default", "vp-button-brand-text", "vp-button-brand-bg", "vp-button-brand-border", "color-lavender-700", "color-lavender-300"],
  ["hover", "vp-button-brand-hover-text", "vp-button-brand-hover-bg", "vp-button-brand-hover-border", "color-lavender-800", "color-lavender-200"],
  ["active", "vp-button-brand-active-text", "vp-button-brand-active-bg", "vp-button-brand-active-border", "color-lavender-900", "color-lavender-100"],
]

const failures = []
for (const [state, textVariable, backgroundVariable, borderVariable, lightToken, darkToken] of states) {
  for (const [mode, map, colorToken] of [["light", siteLight, lightToken], ["dark", siteDark, darkToken]]) {
    const expectedColor = `var(--${colorToken})`
    if (map[textVariable] !== "var(--text-inverse)")
      failures.push(`${mode} ${state} text must map to var(--text-inverse)`)
    if (map[backgroundVariable] !== expectedColor)
      failures.push(`${mode} ${state} background must map to ${expectedColor}`)
    if (map[borderVariable] !== expectedColor)
      failures.push(`${mode} ${state} border must map to ${expectedColor}`)
  }
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
