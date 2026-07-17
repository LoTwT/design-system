import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import {
  declarationMap,
  exactDeclarations,
  expect,
  expectFailure,
  parseCss,
  propertyMap,
  readSource,
  sameStringSet,
  sha256Json,
  variableMap,
  verifyPair,
  verifyStateMappings,
} from "./theme-contract-helpers.mjs"

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
const contractFile = "docs/spec/brutal-theme-contract.json"
const paperInkContractFile = "docs/spec/paper-ink-theme-contract.json"
const contract = JSON.parse(readFileSync(join(rootDir, contractFile), "utf8"))
const paperInkContract = JSON.parse(readFileSync(join(rootDir, paperInkContractFile), "utf8"))

const requiredDigests = {
  declarations: "f498a38744406508b0017fa6174f6a81ac3cc4d307f4bc451595524e1ec5119d",
  invariants: "a25e8795dae7d967742a8b4c5c55dd4599107331b4695eb9dee726bc1b81c17c",
  interaction: "d13711208ae566c5792cc2aa4110429be4870d35809cef2650471412a8bf53aa",
  stateMappings: "c2b34956283e5fb459bed6ac83e0c29b38971f43c4c446904314a3793c684a46",
  legalPairs: "c2e7b151684d3bdecce9d75afa505e14d8d875eb169ea0dd43912be9eb2036fe",
}
const requiredDefaultBaseline = {
  sourceSha256: "a4ed8f572c670e7521bd0ec8d0c4a5b3cd349a5d60f61a6c78404759d79fed56",
  compiledSha256: "449b8a3d5da925afca80e0a126d6744ae963f5d9ee4d3580fc4dda4c391e5c77",
  paperInkContractSha256: "7cd8579941750d2823832931798004107bd2bcae89642299585ac7ce4b6b0eaf",
}

function fileSha256(file) {
  return createHash("sha256").update(readFileSync(join(rootDir, file))).digest("hex")
}

function expectedMode(mode) {
  return { ...contract.commonDeclarations, ...contract.modeDeclarations[mode] }
}

function validateContractShape(value) {
  expect(value.version === 1, "Brutal theme contract version must be 1")
  expect(value.familyClass === "brutal", "Brutal family class must remain brutal")
  expect(value.selectors.light === ".brutal", "Brutal Light selector must remain .brutal")
  expect(value.selectors.dark === ".brutal.dark", "Brutal Dark selector must remain .brutal.dark")
  expect(
    JSON.stringify(value.imports) === JSON.stringify(["@ayingott/theme", "@ayingott/theme/brutal.css"]),
    "Brutal import order drifted",
  )

  const lightKeys = Object.keys(value.modeDeclarations.light)
  const darkKeys = Object.keys(value.modeDeclarations.dark)
  expect(sameStringSet(lightKeys, darkKeys), "Brutal Light/Dark mode declaration sets differ")
  expect(
    !lightKeys.some(key => Object.hasOwn(value.commonDeclarations, key)),
    "Brutal common and mode declarations overlap",
  )

  const requiredPublicRoles = new Set([
    ...Object.keys(paperInkContract.modeDeclarations.paper),
    ...Object.keys(paperInkContract.modeDeclarations.ink),
    ...Object.keys(paperInkContract.readingDeclarations),
    ...Object.keys(paperInkContract.readingModeOverrides.ink),
  ])
  for (const mode of ["light", "dark"]) {
    const declarations = { ...value.commonDeclarations, ...value.modeDeclarations[mode] }
    for (const role of requiredPublicRoles)
      expect(Object.hasOwn(declarations, role), `Missing public semantic role in Brutal ${mode}: --${role}`)
  }

  const pairIds = value.legalPairs.map(pair => pair.id)
  expect(new Set(pairIds).size === pairIds.length, "Duplicate Brutal legal pair id")
  for (const pair of value.legalPairs) {
    expect(["light", "dark"].includes(pair.mode), `Unsupported Brutal mode in ${pair.id}`)
    expect(["text", "focus", "non-text"].includes(pair.kind), `Unsupported Brutal pair kind in ${pair.id}`)
    expect(pair.minimum === (pair.kind === "text" ? 4.5 : 3), `Invalid minimum in ${pair.id}`)
    if (pair.target !== undefined) {
      expect(typeof pair.target === "number", `Invalid target in ${pair.id}`)
      expect(pair.target >= pair.minimum, `Target below minimum in ${pair.id}`)
    }
  }

  const actualDigests = {
    declarations: sha256Json({
      foundationDeclarations: value.foundationDeclarations,
      commonDeclarations: value.commonDeclarations,
      modeDeclarations: value.modeDeclarations,
      modeProperties: value.modeProperties,
    }),
    invariants: sha256Json(value.invariants),
    interaction: sha256Json(value.interaction),
    stateMappings: sha256Json(value.stateMappings),
    legalPairs: sha256Json(value.legalPairs),
  }
  for (const [name, digest] of Object.entries(requiredDigests)) {
    expect(value.digests[name] === digest, `Brutal ${name} pinned digest drifted`)
    expect(actualDigests[name] === digest, `Brutal ${name} values drifted`)
  }
}

function verifyDefaultBaselinePins(value) {
  for (const [name, digest] of Object.entries(requiredDefaultBaseline))
    expect(value.defaultBaseline[name] === digest, `Default baseline ${name} pin drifted`)
}

function verifyDefaultBaselines() {
  verifyDefaultBaselinePins(contract)
  expect(
    fileSha256(contract.defaultBaseline.source) === contract.defaultBaseline.sourceSha256,
    "Default theme source changed while adding Brutal",
  )
  expect(
    fileSha256(paperInkContractFile) === contract.defaultBaseline.paperInkContractSha256,
    "Paper & Ink contract must remain byte-identical",
  )
}

function verifyEntrySource() {
  const source = readSource(rootDir, contract.sources.entry)
  const root = parseCss(source, contract.sources.entry)
  const imports = root.nodes
    .filter(node => node.type === "atrule" && node.name === "import")
    .map(node => node.params)
  expect(
    JSON.stringify(imports) === JSON.stringify([
      '"./semantic/brutal.css"',
      '"./utilities/pressable.css"',
    ]),
    "Brutal entry import chain drifted",
  )
  const foundations = root.nodes.filter(node => node.type === "rule" && node.selector === ":root")
  expect(foundations.length === 1, "Brutal entry must contain one hard-shadow :root block")
  const utilities = root.nodes.filter(node => node.type === "atrule" && node.name === "utility")
  expect(
    sameStringSet(utilities.map(node => node.params), ["shadow-hard-sm", "shadow-hard-md", "shadow-hard-lg"]),
    "Brutal hard-shadow utility set drifted",
  )
  expect(
    root.nodes.every(node => (node.type === "atrule" && ["import", "utility"].includes(node.name)) || (node.type === "rule" && node.selector === ":root")),
    "Brutal entry contains unsupported syntax",
  )
}

function topLevelRule(root, selector, file) {
  const matches = root.nodes.filter(node => node.type === "rule" && node.selector === selector)
  expect(matches.length === 1, `Expected exactly one ${selector} block in ${file}`)
  return matches[0]
}

function verifySemanticSource() {
  const source = readSource(rootDir, contract.sources.semantic)
  const root = parseCss(source, contract.sources.semantic)
  const variants = root.nodes.filter(node => node.type === "atrule" && node.name === "custom-variant")
  expect(variants.length === 1, "Expected one Brutal custom variant")
  expect(variants[0].params === "brutal (&:where(.brutal, .brutal *))", "Brutal custom variant drifted")

  const allowedSelectors = new Set(Object.values(contract.selectors))
  const selectors = root.nodes.filter(node => node.type === "rule").map(rule => rule.selector)
  expect(
    selectors.length === allowedSelectors.size && selectors.every(selector => allowedSelectors.has(selector)),
    "Brutal semantic selector set drifted",
  )

  for (const mode of ["light", "dark"]) {
    const selector = contract.selectors[mode]
    const rule = topLevelRule(root, selector, contract.sources.semantic)
    exactDeclarations(`Brutal ${mode}`, declarationMap(rule, `${contract.sources.semantic} ${selector}`), expectedMode(mode))
    const colorScheme = rule.nodes.filter(node => node.type === "decl" && node.prop === "color-scheme")
    expect(colorScheme.length === 1, `Expected exactly one color-scheme in Brutal ${mode}`)
    expect(colorScheme[0].value.trim() === contract.modeProperties[mode]["color-scheme"], `Brutal ${mode} color-scheme drifted`)
  }
}

function shadowNumbers(value) {
  const parts = value.trim().split(/\s+/)
  expect(parts.length >= 4, `Unsupported hard shadow value: ${value}`)
  return parts.slice(0, 3).map((part) => {
    expect(/^-?\d+(?:\.\d+)?(?:px)?$/.test(part), `Unsupported hard shadow length: ${part}`)
    return Number.parseFloat(part)
  })
}

function verifyHardShadowMap(values) {
  for (const [name, value] of Object.entries(values)) {
    if (name === "shadow-hard-color")
      continue
    const [x, y, blur] = shadowNumbers(value)
    expect(x > 0 && y > 0, `Hard shadow offset must be positive in --${name}`)
    expect(blur === contract.invariants.shadowBlurPx, `Hard shadow blur must be 0 in --${name}`)
  }
}

function resolveRawVariable(name, maps, chain = []) {
  expect(!chain.includes(name), `Circular raw CSS variable reference: --${name}`)
  const value = maps.findLast(map => map[name] !== undefined)?.[name]
  expect(value !== undefined, `Missing raw CSS variable: --${name}`)
  const reference = value.match(/^var\(--([A-Za-z0-9_-]+)\)$/)
  return reference ? resolveRawVariable(reference[1], maps, [...chain, name]) : value
}

function verifyStructureValues(mode, maps) {
  for (const role of ["radius-card", "radius-control"]) {
    const value = resolveRawVariable(role, maps)
    expect(value === "0", `Brutal ${mode} --${role} must resolve to 0; received ${value}`)
  }
  for (const role of ["border-width-surface", "border-width-control"]) {
    const value = resolveRawVariable(role, maps)
    const width = Number.parseFloat(value)
    expect(value.endsWith("px") && width >= contract.invariants.borderWidthMinPx, `Brutal ${mode} --${role} must resolve to at least 2px; received ${value}`)
  }
  for (const role of ["shadow-card", "shadow-panel"]) {
    const value = resolveRawVariable(role, maps)
    const [, , blur] = shadowNumbers(value)
    expect(blur === contract.invariants.shadowBlurPx, `Brutal ${mode} --${role} must resolve to zero blur`)
  }
}

function verifyStructure() {
  const hardFoundation = variableMap(rootDir, contract.sources.foundation, ":root")
  exactDeclarations("Brutal hard-shadow foundation", hardFoundation, contract.foundationDeclarations)
  verifyHardShadowMap(hardFoundation)

  const radius = variableMap(rootDir, "packages/theme/src/foundation/radius.css", "@theme static")
  const border = variableMap(rootDir, "packages/theme/src/foundation/border.css", "@theme static")
  for (const mode of ["light", "dark"])
    verifyStructureValues(mode, [radius, border, hardFoundation, expectedMode(mode)])
}

function verifyNoGradients(source, file) {
  const root = parseCss(source, file)
  root.walkDecls((declaration) => {
    expect(!/gradient\(/i.test(declaration.value), `Gradient is forbidden in ${file}: ${declaration.value}`)
  })
}

function directRule(container, selector, label) {
  const matches = (container.nodes ?? []).filter(node => node.type === "rule" && node.selector === selector)
  expect(matches.length === 1, `Expected exactly one interaction rule for ${label}`)
  return matches[0]
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim()
}

function verifyMotionWindow(value) {
  expect(/^\d+(?:\.\d+)?ms$/.test(value), `Unsupported interaction duration: ${value}`)
  const milliseconds = Number.parseFloat(value)
  expect(
    milliseconds >= contract.invariants.interactionMotionMs.minimum
    && milliseconds <= contract.invariants.interactionMotionMs.maximum,
    `Interaction duration ${milliseconds}ms is outside the contract window`,
  )
}

function verifyDisabledDeclarations(declarations) {
  expect(declarations.transform === contract.interaction.disabledTransform, "Disabled pressable must not move")
  expect(declarations["box-shadow"] === contract.interaction.disabledShadow, "Disabled pressable shadow drifted")
}

function sameSelectorSet(rule, expected) {
  const actual = rule.selectors.map(selector => selector.trim())
  return sameStringSet(actual, expected)
}

function selectorSetRule(container, selectors, label) {
  const matches = (container.nodes ?? []).filter(node => node.type === "rule" && sameSelectorSet(node, selectors))
  expect(matches.length === 1, `Expected exactly one selector set for ${label}`)
  return matches[0]
}

function verifyInteractionSource() {
  const source = readSource(rootDir, contract.sources.utility)
  const root = parseCss(source, contract.sources.utility)
  const utilities = root.nodes.filter(node => node.type === "atrule" && node.name === "utility" && node.params === contract.interaction.utility)
  expect(utilities.length === 1, "Expected exactly one pressable utility")
  const utility = utilities[0]

  const base = propertyMap(directRule(utility, "&:where(.brutal, .brutal *)", "pressable base"), "pressable base")
  expect(base["box-shadow"] === "var(--shadow-card)", "Pressable base shadow drifted")
  expect(
    normalizeWhitespace(base.transition)
    === `transform ${contract.interaction.duration} var(--ease-standard), box-shadow ${contract.interaction.duration} var(--ease-standard)`,
    "Pressable transition drifted",
  )

  const hover = propertyMap(directRule(
    utility,
    '&:where(.brutal, .brutal *):not(:disabled, [aria-disabled="true"], [data-disabled]):hover',
    "pressable hover",
  ), "pressable hover")
  expect(hover.transform === contract.interaction.hoverTransform, "Pressable hover transform drifted")
  expect(hover["box-shadow"] === contract.interaction.hoverShadow, "Pressable hover shadow drifted")

  const active = propertyMap(directRule(
    utility,
    '&:where(.brutal, .brutal *):not(:disabled, [aria-disabled="true"], [data-disabled]):active',
    "pressable active",
  ), "pressable active")
  expect(active.transform === contract.interaction.activeTransform, "Pressable active transform drifted")
  expect(active["box-shadow"] === contract.interaction.activeShadow, "Pressable active shadow drifted")

  const disabled = propertyMap(directRule(
    utility,
    '&:where(.brutal, .brutal *):is(:disabled, [aria-disabled="true"], [data-disabled])',
    "pressable disabled",
  ), "pressable disabled")
  verifyDisabledDeclarations(disabled)

  const motion = variableMap(rootDir, "packages/theme/src/foundation/motion.css", "@theme static")
  verifyMotionWindow(resolveRawVariable("duration-fast", [motion]))

  const reducedMotion = root.nodes.filter(node => node.type === "atrule" && node.name === "media" && node.params === "(prefers-reduced-motion: reduce)")
  expect(reducedMotion.length === 1, "Expected one pressable reduced-motion fallback")
  const reducedBase = propertyMap(selectorSetRule(
    reducedMotion[0],
    [".brutal.pressable", ".brutal .pressable"],
    "pressable reduced-motion base",
  ), "pressable reduced-motion base")
  expect(reducedBase["transition-duration"] === contract.interaction.reducedMotionDuration, "Reduced-motion duration drifted")
  const reducedStates = propertyMap(selectorSetRule(
    reducedMotion[0],
    [".brutal.pressable:hover", ".brutal.pressable:active", ".brutal .pressable:hover", ".brutal .pressable:active"],
    "pressable reduced-motion states",
  ), "pressable reduced-motion states")
  expect(reducedStates.transform === contract.interaction.reducedMotionTransform, "Reduced-motion transform drifted")

  const forcedColors = root.nodes.filter(node => node.type === "atrule" && node.name === "media" && node.params === "(forced-colors: active)")
  expect(forcedColors.length === 1, "Expected one pressable forced-colors fallback")
  const forcedBase = propertyMap(selectorSetRule(
    forcedColors[0],
    [".brutal.pressable", ".brutal .pressable"],
    "pressable forced-colors base",
  ), "pressable forced-colors base")
  expect(forcedBase["border-color"] === contract.interaction.forcedColorsBorder, "Forced-colors border drifted")
  const forcedFocus = propertyMap(selectorSetRule(
    forcedColors[0],
    [".brutal.pressable:focus-visible", ".brutal .pressable:focus-visible"],
    "pressable forced-colors focus",
  ), "pressable forced-colors focus")
  expect(forcedFocus["outline-color"] === contract.interaction.forcedColorsOutline, "Forced-colors focus drifted")
}

function verifyShowcase() {
  const showcaseSource = readSource(rootDir, contract.sources.showcase)
  verifyStateMappings(showcaseSource, contract, contract.sources.showcase)
  verifyNoGradients(showcaseSource, contract.sources.showcase)
  const css = parseCss(showcaseSource, contract.sources.showcase)

  const panel = propertyMap(topLevelRule(css, ".theme-brutal-specimen__panel", contract.sources.showcase), "Brutal showcase panel")
  expect(panel.border === `${contract.showcaseRoles.surfaceBorderWidth} solid var(--border-default)`, "Brutal showcase surface border role drifted")
  expect(panel["border-radius"] === contract.showcaseRoles.surfaceRadius, "Brutal showcase surface radius role drifted")
  expect(panel["box-shadow"] === contract.showcaseRoles.surfaceShadow, "Brutal showcase surface shadow role drifted")

  const action = propertyMap(topLevelRule(css, ".theme-action", contract.sources.showcase), "theme action")
  expect(action.border === `${contract.showcaseRoles.controlBorderWidth} solid`, "Brutal showcase control border role drifted")
  expect(action["border-radius"] === contract.showcaseRoles.controlRadius, "Brutal showcase control radius role drifted")

  const reading = propertyMap(topLevelRule(css, ".theme-brutal-reading", contract.sources.showcase), "Brutal reading specimen")
  expect(reading.color === "var(--reading-fg-muted)", "Brutal reading foreground role drifted")
  expect(reading["font-family"] === "var(--reading-font-body)", "Brutal reading font role drifted")

  const overview = readSource(rootDir, contract.sources.overview)
  expect(overview.includes("<ThemeFamilyMatrix />"), "Theme overview must include the family matrix")
  expect(
    overview.includes('<ThemeReadingSpecimen class="theme-section--reading" />'),
    "Theme overview must bind Reading spacing semantically",
  )
  const readingSection = propertyMap(
    topLevelRule(css, ".theme-section.theme-section--reading", contract.sources.showcase),
    "Reading section spacing",
  )
  expect(readingSection["padding-block"] === "32px 14px", "Reading section spacing drifted")
  const positionalSections = []
  css.walkRules((rule) => {
    if (rule.selectors.some(selector => selector.includes(".theme-section:nth-child")))
      positionalSections.push(...rule.selectors)
  })
  expect(positionalSections.length === 0, "Theme section spacing must not depend on child position")

  const matrix = readSource(rootDir, "site/.vitepress/theme/components/theme-overview/ThemeFamilyMatrix.vue")
  for (const needle of [
    '<dl class="theme-mode-matrix"',
    '<dt class="theme-mode-matrix__heading">',
    '<dd class="theme-mode-matrix__option">',
    '<span class="theme-mode-matrix__scheme">Light</span>',
    '<span class="theme-mode-matrix__scheme">Dark</span>',
    'data-visual-mode="brutal-light"',
    'data-visual-mode="brutal-dark"',
    'class="theme-brutal-specimen brutal dark"',
    "pressable focus-ring touch-target",
    "theme-status--info",
    "theme-status--success",
    "theme-brutal-reading",
  ]) {
    expect(matrix.includes(needle), `Theme family matrix is missing: ${needle}`)
  }
}

validateContractShape(contract)
verifyDefaultBaselines()
verifyEntrySource()
verifySemanticSource()
verifyStructure()
verifyInteractionSource()
verifyNoGradients(readSource(rootDir, contract.sources.entry), contract.sources.entry)
verifyNoGradients(readSource(rootDir, contract.sources.semantic), contract.sources.semantic)
verifyNoGradients(readSource(rootDir, contract.sources.utility), contract.sources.utility)
verifyShowcase()

expectFailure(
  "missing semantic role",
  () => {
    const missing = { ...expectedMode("light") }
    delete missing["surface-panel"]
    exactDeclarations("missing-role fixture", missing, expectedMode("light"))
  },
  "declaration set drifted",
)
expectFailure(
  "wrong semantic declaration",
  () => exactDeclarations("wrong-declaration fixture", { ...expectedMode("light"), "surface-panel": "#000000" }, expectedMode("light")),
  "--surface-panel must be #ffffff",
)
expectFailure(
  "wrong family selector",
  () => validateContractShape({ ...contract, selectors: { ...contract.selectors, light: ".neo" } }),
  "Brutal Light selector must remain .brutal",
)
expectFailure(
  "Light/Dark declaration-set mismatch",
  () => validateContractShape({
    ...contract,
    modeDeclarations: {
      ...contract.modeDeclarations,
      dark: { ...contract.modeDeclarations.dark, extra: "#000000" },
    },
  }),
  "mode declaration sets differ",
)
expectFailure(
  "hard shadow blur",
  () => verifyHardShadowMap({ "shadow-hard-sm": "4px 4px 2px #111111" }),
  "Hard shadow blur must be 0",
)
expectFailure(
  "nonzero radius role",
  () => verifyStructureValues("fixture", [{
    "radius-card": "0.5rem",
    "radius-control": "0",
    "border-width-surface": "3px",
    "border-width-control": "3px",
    "shadow-card": "4px 4px 0 #111111",
    "shadow-panel": "8px 8px 0 #111111",
  }]),
  "--radius-card must resolve to 0",
)
expectFailure(
  "one-pixel border role",
  () => verifyStructureValues("fixture", [{
    "radius-card": "0",
    "radius-control": "0",
    "border-width-surface": "1px",
    "border-width-control": "3px",
    "shadow-card": "4px 4px 0 #111111",
    "shadow-panel": "8px 8px 0 #111111",
  }]),
  "--border-width-surface must resolve to at least 2px",
)
expectFailure(
  "gradient",
  () => verifyNoGradients(".brutal { background: linear-gradient(red, blue); }", "<gradient-fixture>"),
  "Gradient is forbidden",
)
expectFailure(
  "motion over window",
  () => verifyMotionWindow("300ms"),
  "outside the contract window",
)
expectFailure(
  "disabled movement",
  () => verifyDisabledDeclarations({ transform: "translate(1px, 1px)", "box-shadow": contract.interaction.disabledShadow }),
  "Disabled pressable must not move",
)
expectFailure(
  "digest tamper",
  () => validateContractShape({ ...contract, digests: { ...contract.digests, legalPairs: "0".repeat(64) } }),
  "legalPairs pinned digest drifted",
)
expectFailure(
  "default baseline digest tamper",
  () => verifyDefaultBaselinePins({
    ...contract,
    defaultBaseline: { ...contract.defaultBaseline, compiledSha256: "0".repeat(64) },
  }),
  "compiledSha256 pin drifted",
)

const bluePair = contract.legalPairs.find(pair => pair.id === "brutal-sticker-blue")
expect(bluePair !== undefined, "Missing brutal-sticker-blue pair")
expectFailure(
  "blue contrast bound to paper white",
  () => verifyPair(bluePair, [{ ...expectedMode("light"), "brutal-sticker-paper": "#fff3d6" }]),
  "below target 5:1",
)

const modeMaps = {
  light: [expectedMode("light")],
  dark: [expectedMode("dark")],
}
for (const pair of contract.legalPairs) {
  const ratio = verifyPair(pair, modeMaps[pair.mode])
  console.log(`${pair.id}: ${ratio.toFixed(2)}:1`)
}

console.log("Neo-Brutalism theme contract passed")
