import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { runInNewContext } from "node:vm"
import postcss from "postcss"
import ts from "typescript"

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))))

function readSource(file) {
  return readFileSync(join(rootDir, file), "utf8")
}

function expectSourceIncludes(file, fragments) {
  const source = readSource(file)
  for (const fragment of fragments)
    expect(source.includes(fragment), `${file} must include: ${fragment}`)
  return source
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

const classListMutators = new Set(["add", "remove", "replace", "toggle"])

function readClassListMutations(source, file) {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  expect(sourceFile.parseDiagnostics.length === 0, `${file} has TypeScript parse errors`)
  const mutations = []

  function visit(node) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const method = node.expression.name.text
      const receiver = node.expression.expression
      if (
        classListMutators.has(method)
        && ts.isPropertyAccessExpression(receiver)
        && receiver.name.text === "classList"
      ) {
        mutations.push({
          arguments: node.arguments,
          method,
          receiver: receiver.expression.getText(sourceFile),
          sourceFile,
        })
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return mutations
}

function verifyThemeFamilyClassMutation(source, file, expected) {
  const mutations = readClassListMutations(source, file)
  expect(mutations.length === 1, `${file} must contain exactly one classList mutation`)

  const mutation = mutations[0]
  expect(mutation.method === "toggle", `${file} classList mutation must use toggle`)
  expect(mutation.receiver === "root", `${file} classList mutation must target root`)
  expect(mutation.arguments.length === 2, `${file} family toggle must receive class and force arguments`)

  const [classArgument, forceArgument] = mutation.arguments
  if (expected.classIdentifier !== undefined) {
    expect(
      ts.isIdentifier(classArgument) && classArgument.text === expected.classIdentifier,
      `${file} family toggle must use ${expected.classIdentifier}`,
    )
  }
  else {
    expect(
      ts.isStringLiteral(classArgument) && classArgument.text === expected.className,
      `${file} family toggle must use the ${expected.className} class literal`,
    )
  }

  expect(ts.isBinaryExpression(forceArgument), `${file} family toggle force must be a strict equality`)
  expect(
    forceArgument.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken,
    `${file} family toggle force must use strict equality`,
  )
  expect(
    ts.isIdentifier(forceArgument.left) && forceArgument.left.text === "family",
    `${file} family toggle force must read family`,
  )

  if (expected.stateIdentifier !== undefined) {
    expect(
      ts.isIdentifier(forceArgument.right) && forceArgument.right.text === expected.stateIdentifier,
      `${file} family toggle force must use ${expected.stateIdentifier}`,
    )
  }
  else {
    expect(
      ts.isStringLiteral(forceArgument.right) && forceArgument.right.text === expected.state,
      `${file} family toggle force must use the ${expected.state} state literal`,
    )
  }
}

function evaluateStaticModule(source, file) {
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: file,
    reportDiagnostics: true,
  })
  expect((result.diagnostics ?? []).length === 0, `${file} static module transpile failed`)

  const context = { exports: {} }
  runInNewContext(result.outputText, context, { filename: file, timeout: 100 })
  return context.exports
}

function readScopedStyle(source, file) {
  const matches = [...source.matchAll(/<style scoped>\s*([\s\S]*?)<\/style>/g)]
  expect(matches.length === 1, `${file} must contain exactly one scoped style block`)
  return matches[0][1]
}

function verifyThemeFamilyReducedMotion(source, file) {
  const css = postcss.parse(source, { from: file })
  const reducedMotion = css.nodes.filter(node =>
    node.type === "atrule"
    && node.name === "media"
    && node.params === "(prefers-reduced-motion: reduce)",
  )
  expect(reducedMotion.length === 1, `Expected exactly one family reduced-motion media query in ${file}`)
  const thumb = readDeclarations(findRule(
    reducedMotion[0],
    [".theme-family-switch__thumb"],
    "family reduced motion",
  ))
  expectDeclaration(thumb, "transition-duration", "0s")
}

const mobileNavOrder = [
  [".VPNavScreen .menu", "1"],
  [".VPNavScreen .translations", "2"],
  [".VPNavScreen .appearance", "3"],
  [".VPNavScreen .theme-family-control--screen", "4"],
  [".VPNavScreen .social-links", "5"],
]

function verifyMobileThemeFamilyOrder(source, file) {
  const css = postcss.parse(source, { from: file })
  const mobile = css.nodes.filter(node =>
    node.type === "atrule"
    && node.name === "media"
    && node.params === "(max-width: 767px)",
  )
  expect(mobile.length === 1, `Expected exactly one mobile nav media query in ${file}`)

  const container = readDeclarations(findRule(
    mobile[0],
    [".VPNavScreen > .container"],
    "mobile nav order container",
  ))
  expectDeclaration(container, "display", "flex")
  expectDeclaration(container, "flex-direction", "column")

  for (const [selector, order] of mobileNavOrder) {
    const declarations = readDeclarations(findRule(mobile[0], [selector], `mobile order ${selector}`))
    expectDeclaration(declarations, "order", order)
  }
}

function verifySavedIconRole(source, file) {
  const css = postcss.parse(source, { from: file })
  const savedIcon = readDeclarations(findRule(
    css,
    [".theme-state--saved .theme-icon"],
    "saved icon semantic role",
  ))
  expectDeclaration(savedIcon, "color", "var(--text-accent)")
}

function sha256(file) {
  return createHash("sha256").update(readFileSync(join(rootDir, file))).digest("hex")
}

const config = readConfig()

const homepageSource = expectSourceIncludes("site/index.md", [
  "text: Paper & Ink defaults with opt-in Neo-Brutal Light and Dark on one semantic API.",
  "text: Compare theme families",
  "link: /guide/theme-overview",
  "title: Two-axis themes",
])
expect(!homepageSource.includes("title: Runtime Semantics"), "Homepage must replace the Runtime Semantics card")
expect((homepageSource.match(/^  - title:/gm) ?? []).length === 3, "Homepage must keep exactly three feature cards")

expectSourceIncludes("site/guide/getting-started.md", [
  '<html class="brutal dark">',
  "Arbitrary mixed nested theme islands are unsupported",
  "The `--brutal-*` palette variables are contract-owned implementation details",
  "[Theme overview](./theme-overview)",
])
expectSourceIncludes("site/tokens/effects.md", [
  "at `:root`",
  "var(--border-width-control, var(--border-width-thin))",
  "invalid at computed-value time",
  "behaves as `unset`",
  "earlier cascaded declaration is not revived",
])
expectSourceIncludes("site/tokens/semantic.md", [
  "Use `--text-muted` for active muted UI copy",
  "express family-relative intent",
])
expectSourceIncludes("site/guide/package-contract.md", [
  "The family-local `--brutal-*` palette variables are contract-owned implementation details",
])
expectSourceIncludes("packages/theme/README.md", [
  "place both classes on that same root",
  "Arbitrary mixed nested theme islands are unsupported",
  "not a consumer direct-use API",
])
expectSourceIncludes("skills/ayingott-design-system/SKILL.md", [
  "Place the family and scheme classes together on the same theme root",
  "Do not consume the family-local `--brutal-*` palette variables directly",
  "Use `--text-muted` for active muted UI copy",
])
expectSourceIncludes("skills/ayingott-design-system/references/tokens.md", [
  "## Neo-Brutal opt-in scope",
  "Contract-owned; do not use directly in consumer CSS",
])
expectSourceIncludes("docs/spec/rfc-brutal-theme.md", [
  "co-located on one theme root",
  "not a consumer direct-use API",
  "invalid at computed-value time",
  "behaves as `unset`",
  "earlier cascaded declaration is not revived",
])
expectSourceIncludes("docs/spec/design-system-v1.0.md", [
  "两个 class 共置同一 theme root",
  "不是 consumer direct-use API",
  "computed-value time invalid",
  "按 `unset` 处理",
  "更早的 cascaded declaration 不会重新生效",
])
expectSourceIncludes("skills/ayingott-design-system/SKILL.md", [
  "invalid at computed-value time",
  "behaves as `unset`",
  "earlier cascaded declaration is not revived",
])

expect(stringValue(property(config, "lang"), "lang") === "en", "VitePress lang must be en")
expect(stringValue(property(config, "title"), "title") === "Ayingott Design System", "VitePress title must remain Ayingott Design System")

const themeConfig = objectValue(property(config, "themeConfig"), "themeConfig")
const logo = objectValue(property(themeConfig, "logo"), "themeConfig.logo")
expect(stringValue(property(logo, "light"), "themeConfig.logo.light") === "/lo.svg", "Light logo must use /lo.svg")
expect(stringValue(property(logo, "dark"), "themeConfig.logo.dark") === "/lo-white.svg", "Dark logo must use /lo-white.svg")
expect(stringValue(property(logo, "alt"), "themeConfig.logo.alt") === "Lo", "Logo alt text must remain Lo")

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

const themeFamilyScripts = head.elements.filter((entry) => {
  if (!ts.isArrayLiteralExpression(entry) || entry.elements.length !== 3)
    return false
  return ts.isStringLiteral(entry.elements[0])
    && entry.elements[0].text === "script"
    && ts.isObjectLiteralExpression(entry.elements[1])
    && ts.isIdentifier(entry.elements[2])
    && entry.elements[2].text === "THEME_FAMILY_INIT_SCRIPT"
})
expect(themeFamilyScripts.length === 1, "Expected exactly one early Theme Family initialization script")

expectSourceIncludes("site/.vitepress/config.ts", [
  'import { THEME_FAMILY_INIT_SCRIPT } from "./theme/theme-family"',
  '["script", {}, THEME_FAMILY_INIT_SCRIPT]',
])
expectSourceIncludes("site/.vitepress/theme/index.ts", [
  'import Layout from "./Layout.vue"',
  "Layout,",
])
expectSourceIncludes("site/.vitepress/theme/Layout.vue", [
  '<ThemeFamilyControl placement="header" />',
  '<ThemeFamilyControl placement="screen" />',
  '#nav-bar-content-after',
  '#nav-screen-content-after',
])
const themeFamilyInitSource = expectSourceIncludes("site/.vitepress/theme/theme-family.ts", [
  'export const THEME_FAMILY_ROOT_CLASS = "brutal"',
  'export const THEME_FAMILY_STORAGE_KEY = "ayingott:theme-family"',
  "localStorage.getItem",
  "root.classList.toggle",
  "root.dataset.themeFamily = family",
])
const themeFamilyModule = evaluateStaticModule(themeFamilyInitSource, "site/.vitepress/theme/theme-family.ts")
expect(typeof themeFamilyModule.THEME_FAMILY_INIT_SCRIPT === "string", "Theme Family init script must be a string")
verifyThemeFamilyClassMutation(
  themeFamilyModule.THEME_FAMILY_INIT_SCRIPT,
  "<rendered-theme-family-init-script>",
  { className: "brutal", state: "neo" },
)

const themeFamilyComposableSource = expectSourceIncludes("site/.vitepress/theme/composables/useThemeFamily.ts", [
  "root.classList.toggle(THEME_FAMILY_ROOT_CLASS, family === NEO_THEME_FAMILY)",
  "localStorage.setItem(THEME_FAMILY_STORAGE_KEY, family)",
  "document.documentElement.classList.contains(THEME_FAMILY_ROOT_CLASS)",
  '"Neo" : "Default"',
  'isDark.value ? "Dark" : "Light"',
])
verifyThemeFamilyClassMutation(
  themeFamilyComposableSource,
  "site/.vitepress/theme/composables/useThemeFamily.ts",
  {
    classIdentifier: "THEME_FAMILY_ROOT_CLASS",
    stateIdentifier: "NEO_THEME_FAMILY",
  },
)

const familyMutationFixture = `
  const root = document.documentElement
  root.classList.toggle(THEME_FAMILY_ROOT_CLASS, family === NEO_THEME_FAMILY)
`
expectFailure(
  "family classList.add scheme mutation",
  () => verifyThemeFamilyClassMutation(
    `${familyMutationFixture}\nroot.classList.add('dark')`,
    "<family-add-scheme-fixture>",
    {
      classIdentifier: "THEME_FAMILY_ROOT_CLASS",
      stateIdentifier: "NEO_THEME_FAMILY",
    },
  ),
  "must contain exactly one classList mutation",
)
expectFailure(
  "family single-quote scheme toggle mutation",
  () => verifyThemeFamilyClassMutation(
    `${familyMutationFixture}\nroot.classList.toggle('dark')`,
    "<family-toggle-scheme-fixture>",
    {
      classIdentifier: "THEME_FAMILY_ROOT_CLASS",
      stateIdentifier: "NEO_THEME_FAMILY",
    },
  ),
  "must contain exactly one classList mutation",
)

const themeFamilyControlSource = expectSourceIncludes("site/.vitepress/theme/components/ThemeFamilyControl.vue", [
  'role="switch"',
  'aria-label="Neo theme family"',
  ':aria-checked="isNeo"',
  'aria-live="polite"',
  'isReady ? effectiveState : "Default · Light"',
  "min-width: var(--touch-target-min)",
  "touch-action: manipulation",
  ".theme-family-switch:focus-visible",
  "@media (prefers-reduced-motion: reduce)",
])
expectFailure(
  "wrong family reduced-motion duration",
  () => verifyThemeFamilyReducedMotion(`
    @media (prefers-reduced-motion: reduce) {
      .theme-family-switch__thumb {
        transition-duration: 1s;
      }
    }
  `, "<wrong-family-reduced-motion-fixture>"),
  "Expected transition-duration: 0s",
)
verifyThemeFamilyReducedMotion(
  readScopedStyle(themeFamilyControlSource, "site/.vitepress/theme/components/ThemeFamilyControl.vue"),
  "site/.vitepress/theme/components/ThemeFamilyControl.vue#style",
)

const cssFile = "site/.vitepress/theme/style.css"
const cssSource = readSource(cssFile)
expect(
  (cssSource.match(/@import "@ayingott\/theme\/brutal\.css";/g) ?? []).length === 1,
  "Site theme must import the existing Neo opt-in entry exactly once",
)
expectFailure(
  "wrong mobile Theme Family order",
  () => verifyMobileThemeFamilyOrder(`
    @media (max-width: 767px) {
      .VPNavScreen > .container { display: flex; flex-direction: column; }
      .VPNavScreen .menu { order: 1; }
      .VPNavScreen .translations { order: 2; }
      .VPNavScreen .appearance { order: 3; }
      .VPNavScreen .theme-family-control--screen { order: 2; }
      .VPNavScreen .social-links { order: 5; }
    }
  `, "<wrong-mobile-family-order-fixture>"),
  "Expected order: 4",
)
verifyMobileThemeFamilyOrder(cssSource, cssFile)
const css = postcss.parse(cssSource, { from: cssFile })

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
expectFailure(
  "wrong reduced-motion duration",
  () => verifyReducedAppearanceMotion(`
    @media (prefers-reduced-motion: reduce) {
      .VPSwitch.VPSwitchAppearance,
      .VPSwitch.VPSwitchAppearance .check,
      .dark .VPSwitch.VPSwitchAppearance .icon .sun,
      .dark .VPSwitch.VPSwitchAppearance .icon .moon {
        transition-duration: 0.01s !important;
      }
    }
  `, "<wrong-reduced-motion-duration-fixture>"),
  "Expected transition-duration: 0s",
)
verifyReducedAppearanceMotion(readSource(cssFile), cssFile)

const cta = readDeclarations(findRule(css, [".VPButton.brand", ".VPButton.alt"], "CTA touch targets"))
expectDeclaration(cta, "min-width", "var(--touch-target-min)")
expectDeclaration(cta, "min-height", "var(--touch-target-min)")

const appearance = readDeclarations(findRule(css, [".VPSwitch.VPSwitchAppearance"], "appearance touch target"))
expectDeclaration(appearance, "width", "var(--touch-target-min)")
expectDeclaration(appearance, "height", "var(--touch-target-min)")

const localOutline = readDeclarations(findRule(css, [".VPLocalNavOutlineDropdown button"], "local outline touch target"))
expectDeclaration(localOutline, "min-height", "var(--touch-target-min)")

expectFailure(
  "wrong saved icon semantic role",
  () => verifySavedIconRole(`
    .theme-state--saved .theme-icon {
      color: var(--status-success-fg);
    }
  `, "<wrong-saved-icon-role-fixture>"),
  "Expected color: var(--text-accent)",
)
verifySavedIconRole(readSource(cssFile), cssFile)

const themeIconSource = readSource("site/.vitepress/theme/components/theme-overview/ThemeIcon.vue")
for (const icon of ["circle-check", "circle-x", "info", "triangle-alert"]) {
  expect(
    themeIconSource.includes(`lucide-static/icons/${icon}.svg?url`),
    `ThemeIcon must use the Lucide ${icon} asset`,
  )
}

const interactionStatesSource = readSource("site/.vitepress/theme/components/theme-overview/ThemeInteractionStates.vue")
expect(interactionStatesSource.includes('<ThemeIcon name="circle-check" />'), "Saved state must use the Lucide circle-check icon")

const statusRolesSource = readSource("site/.vitepress/theme/components/theme-overview/ThemeStatusRoles.vue")
for (const icon of ["circle-check", "triangle-alert", "circle-x", "info"]) {
  expect(statusRolesSource.includes(`<ThemeIcon name="${icon}" />`), `Status roles must use the Lucide ${icon} icon`)
}

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
