import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import postcss from "postcss"
import ts from "typescript"

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))))

function readSource(file) {
  return readFileSync(join(rootDir, file), "utf8")
}

function expect(condition, message) {
  if (!condition)
    throw new Error(message)
}

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node))
    return node.text
  throw new Error(`Unsupported config property name: ${node.getText()}`)
}

function property(object, name) {
  const matches = object.properties.filter(node =>
    ts.isPropertyAssignment(node) && propertyName(node.name) === name,
  )
  expect(matches.length === 1, `Expected exactly one config property: ${name}`)
  return matches[0].initializer
}

function optionalProperty(object, name) {
  const matches = object.properties.filter(node =>
    ts.isPropertyAssignment(node) && propertyName(node.name) === name,
  )
  expect(matches.length <= 1, `Duplicate config property: ${name}`)
  return matches[0]?.initializer
}

function objectValue(node, label) {
  expect(ts.isObjectLiteralExpression(node), `${label} must be an object literal`)
  return node
}

function arrayValue(node, label) {
  expect(ts.isArrayLiteralExpression(node), `${label} must be an array literal`)
  return node
}

function stringValue(node, label) {
  expect(ts.isStringLiteral(node), `${label} must be a string literal`)
  return node.text
}

function readConfig() {
  const file = "site/.vitepress/config.ts"
  const source = readSource(file)
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  expect(sourceFile.parseDiagnostics.length === 0, `${file} has TypeScript parse errors`)

  const exports = sourceFile.statements.filter(ts.isExportAssignment)
  expect(exports.length === 1, `${file} must have exactly one default export`)
  const call = exports[0].expression
  expect(ts.isCallExpression(call), `${file} default export must call defineConfig`)
  expect(ts.isIdentifier(call.expression) && call.expression.text === "defineConfig", `${file} must call defineConfig directly`)
  expect(call.arguments.length === 1, "defineConfig must receive exactly one argument")
  return objectValue(call.arguments[0], "defineConfig argument")
}

function readDeclarations(rule) {
  const declarations = new Map()
  for (const node of rule.nodes ?? []) {
    if (node.type === "comment")
      continue
    expect(node.type === "decl", `Unsupported nested CSS in ${rule.selector}: ${node.toString()}`)
    expect(!declarations.has(node.prop), `Duplicate ${node.prop} in ${rule.selector}`)
    declarations.set(node.prop, { value: node.value.trim(), important: Boolean(node.important) })
  }
  return declarations
}

function selectorSet(rule) {
  return new Set(rule.selectors.map(selector => selector.trim()))
}

function sameSet(actual, expected) {
  return actual.size === expected.size && [...expected].every(value => actual.has(value))
}

function findRule(container, selectors, label) {
  const expected = new Set(selectors)
  const matches = (container.nodes ?? []).filter(node =>
    node.type === "rule" && sameSet(selectorSet(node), expected),
  )
  expect(matches.length === 1, `Expected exactly one CSS rule for ${label}`)
  return matches[0]
}

function expectDeclaration(declarations, property, value, important = false) {
  const actual = declarations.get(property)
  expect(actual !== undefined, `Missing CSS declaration ${property}`)
  expect(actual.value === value, `Expected ${property}: ${value}; received ${actual.value}`)
  expect(actual.important === important, `Expected ${property} important=${important}`)
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

function verifyTouchTargetMinimum(source, file) {
  const css = postcss.parse(source, { from: file })
  const roots = css.nodes.filter(node => node.type === "rule" && sameSet(selectorSet(node), new Set([":root"])))
  const minimums = roots.flatMap((rule) => {
    const declaration = readDeclarations(rule).get("--touch-target-min")
    return declaration === undefined ? [] : [declaration]
  })
  expect(minimums.length === 1, `Expected exactly one CSS declaration --touch-target-min in ${file}`)
  expect(minimums[0].value === "2.75rem", `Expected --touch-target-min: 2.75rem; received ${minimums[0].value}`)
  expect(minimums[0].important === false, "Expected --touch-target-min important=false")
}

const reducedMotionSelectors = [
  ".VPSwitch.VPSwitchAppearance",
  ".VPSwitch.VPSwitchAppearance .check",
  ".dark .VPSwitch.VPSwitchAppearance .icon .sun",
  ".dark .VPSwitch.VPSwitchAppearance .icon .moon",
]

function verifyReducedAppearanceMotion(source, file) {
  const css = postcss.parse(source, { from: file })
  const reducedMotion = css.nodes.filter(node =>
    node.type === "atrule"
    && node.name === "media"
    && node.params === "(prefers-reduced-motion: reduce)",
  )
  expect(reducedMotion.length === 1, `Expected exactly one reduced-motion media query in ${file}`)
  const motion = readDeclarations(findRule(
    reducedMotion[0],
    reducedMotionSelectors,
    "reduced appearance motion",
  ))
  expectDeclaration(motion, "transition-duration", "0s", true)
}

function sha256(file) {
  return createHash("sha256").update(readFileSync(join(rootDir, file))).digest("hex")
}

const config = readConfig()

expect(stringValue(property(config, "lang"), "lang") === "en", "VitePress lang must be en")
expect(stringValue(property(config, "title"), "title") === "Ayingott Design System", "VitePress title must remain Ayingott Design System")

const themeConfig = objectValue(property(config, "themeConfig"), "themeConfig")
expect(optionalProperty(themeConfig, "logo") === undefined, "themeConfig.logo must remain absent")

const head = arrayValue(property(config, "head"), "head")
const iconLinks = head.elements.flatMap((entry) => {
  if (!ts.isArrayLiteralExpression(entry) || entry.elements.length !== 2)
    return []
  if (!ts.isStringLiteral(entry.elements[0]) || entry.elements[0].text !== "link")
    return []
  if (!ts.isObjectLiteralExpression(entry.elements[1]))
    return []

  const attributes = entry.elements[1]
  const rel = optionalProperty(attributes, "rel")
  if (rel === undefined || stringValue(rel, "link rel") !== "icon")
    return []

  return [{
    type: stringValue(property(attributes, "type"), "icon type"),
    href: stringValue(property(attributes, "href"), "icon href"),
    media: stringValue(property(attributes, "media"), "icon media"),
  }]
})

expect(iconLinks.length === 2, "Expected exactly two favicon links")
expect(iconLinks.some(link =>
  link.type === "image/svg+xml"
  && link.href === "/lo.svg"
  && link.media === "(prefers-color-scheme: light)"), "Missing exact light favicon link")
expect(iconLinks.some(link =>
  link.type === "image/svg+xml"
  && link.href === "/lo-white.svg"
  && link.media === "(prefers-color-scheme: dark)"), "Missing exact dark favicon link")

const cssFile = "site/.vitepress/theme/style.css"
const css = postcss.parse(readSource(cssFile), { from: cssFile })

expectFailure(
  "missing touch target minimum",
  () => verifyTouchTargetMinimum(":root {}", "<missing-touch-target-fixture>"),
  "Expected exactly one CSS declaration --touch-target-min",
)
expectFailure(
  "under-44 touch target minimum",
  () => verifyTouchTargetMinimum(":root { --touch-target-min: 2rem; }", "<under-44-touch-target-fixture>"),
  "Expected --touch-target-min: 2.75rem",
)

const touchTargetFile = "packages/theme/src/layers/touch-target.css"
verifyTouchTargetMinimum(readSource(touchTargetFile), touchTargetFile)

expectFailure(
  "missing reduced-motion icon selector",
  () => verifyReducedAppearanceMotion(`
    @media (prefers-reduced-motion: reduce) {
      .VPSwitch.VPSwitchAppearance,
      .VPSwitch.VPSwitchAppearance .check,
      .dark .VPSwitch.VPSwitchAppearance .icon .sun {
        transition-duration: 0s !important;
      }
    }
  `, "<missing-reduced-motion-icon-fixture>"),
  "Expected exactly one CSS rule for reduced appearance motion",
)
verifyReducedAppearanceMotion(readSource(cssFile), cssFile)

const cta = readDeclarations(findRule(css, [".VPButton.brand", ".VPButton.alt"], "CTA touch targets"))
expectDeclaration(cta, "min-width", "var(--touch-target-min)")
expectDeclaration(cta, "min-height", "var(--touch-target-min)")

const appearance = readDeclarations(findRule(css, [".VPSwitch.VPSwitchAppearance"], "appearance touch target"))
expectDeclaration(appearance, "width", "var(--touch-target-min)")
expectDeclaration(appearance, "height", "var(--touch-target-min)")

const track = readDeclarations(findRule(css, [".VPSwitch.VPSwitchAppearance::before"], "appearance visual track"))
expectDeclaration(track, "top", "11px")
expectDeclaration(track, "left", "2px")
expectDeclaration(track, "width", "40px")
expectDeclaration(track, "height", "22px")

const check = readDeclarations(findRule(css, [".VPSwitch.VPSwitchAppearance .check"], "appearance check"))
expectDeclaration(check, "top", "13px")
expectDeclaration(check, "left", "3px")
expectDeclaration(check, "width", "18px")
expectDeclaration(check, "height", "18px")

const darkCheck = readDeclarations(findRule(css, [".dark .VPSwitch.VPSwitchAppearance .check"], "appearance check travel"))
expectDeclaration(darkCheck, "transform", "translateX(18px)")

expect(
  sha256("site/public/lo.svg") === "566fff909da278219c7a0bef00a5acd7fdd224bf12b9012c4d1cbf5444ea7d02",
  "site/public/lo.svg does not match the approved first-party asset",
)
expect(
  sha256("site/public/lo-white.svg") === "42fe851306f229ba2bb808a763587a7a92fe1741dfd26dbd1a9e805671250feb",
  "site/public/lo-white.svg does not match the approved first-party asset",
)

console.log("site experience source contract passed")
