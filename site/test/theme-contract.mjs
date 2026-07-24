import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import {
  exactDeclarations,
  expect,
  expectFailure,
  readSource as readSourceFromRoot,
  resolveVariable,
  sameStringSet,
  sha256Json,
  variableMap as variableMapFromRoot,
  verifyPair,
  verifyStateMappings as verifyStateMappingsFromSource,
} from "./theme-contract-helpers.mjs"

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
  "paper-muted-panel",
  "paper-muted-elevated",
  "paper-link-canvas",
  "paper-action-default",
  "paper-action-hover",
  "paper-action-active",
  "ink-primary-canvas",
  "ink-secondary-canvas",
  "ink-muted-canvas",
  "ink-muted-panel",
  "ink-muted-elevated",
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
const requiredTargetPairIds = [
  "paper-muted-canvas",
  "paper-muted-panel",
  "paper-muted-elevated",
  "ink-muted-canvas",
  "ink-muted-panel",
  "ink-muted-elevated",
]
const requiredContrastExemptionIds = ["disabled-action"]
const requiredStateMappingsSha256 = "235f87738e12826d74009aed396c34ec985b6fad0a2aaa31c3188f70e06d2f80"
const requiredLegalPairsSha256 = "fd2e8b1c08694d2cdf07d5112185c936aab35bd8e64da2a55d9d6d2bf35f5c50"
const requiredContrastExemptionsSha256 = "20d9abd4f87114673b955184bcee2534d0bd2d1f39f66b2feb3188315c2324a7"

const readSource = file => readSourceFromRoot(rootDir, file)
const variableMap = (file, selector) => variableMapFromRoot(rootDir, file, selector)
const verifyStateMappings = (source, value) => verifyStateMappingsFromSource(source, value, contract.sources.showcase)

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
  for (const pair of value.legalPairs) {
    expect(["paper", "ink"].includes(pair.mode), `Unsupported mode in ${pair.id}`)
    expect(["text", "focus", "non-text"].includes(pair.kind), `Unsupported pair kind in ${pair.id}`)
    expect(pair.minimum === (pair.kind === "text" ? 4.5 : 3), `Invalid minimum in ${pair.id}`)
    if (requiredTargetPairIds.includes(pair.id)) {
      expect(typeof pair.target === "number", `Missing target in ${pair.id}`)
      expect(pair.target >= pair.minimum, `Target below minimum in ${pair.id}`)
      expect(pair.target === 5, `Target in ${pair.id} must be 5`)
    }
    else {
      expect(pair.target === undefined, `Unexpected target in ${pair.id}`)
    }
  }
  expect(sha256Json(value.legalPairs) === requiredLegalPairsSha256, "Legal pair values drifted")
  expect(Array.isArray(value.contrastExemptions), "Contrast exemptions must be an array")
  const exemptionIds = value.contrastExemptions.map(exemption => exemption.id)
  expect(new Set(exemptionIds).size === exemptionIds.length, "Duplicate contrast exemption id")
  expect(sameStringSet(exemptionIds, requiredContrastExemptionIds), "Contrast exemption id set drifted")
  for (const exemption of value.contrastExemptions) {
    expect(exemption.kind === "inactive-component", `Unsupported contrast exemption kind in ${exemption.id}`)
    expect(Array.isArray(exemption.modes) && exemption.modes.length > 0, `Missing modes in ${exemption.id}`)
    expect(new Set(exemption.modes).size === exemption.modes.length, `Duplicate mode in ${exemption.id}`)
    expect(exemption.modes.every(mode => ["paper", "ink"].includes(mode)), `Unsupported mode in ${exemption.id}`)
    expect(typeof exemption.reason === "string" && exemption.reason.length > 0, `Missing reason in ${exemption.id}`)
    expect(Array.isArray(exemption.standardRefs) && exemption.standardRefs.length > 0, `Missing standard refs in ${exemption.id}`)
    expect(exemption.standardRefs.every(ref => /^https:\/\/www\.w3\.org\//.test(ref)), `Unsupported standard ref in ${exemption.id}`)
    const mapping = value.stateMappings[exemption.stateMapping]
    expect(mapping !== undefined, `Missing state mapping for ${exemption.id}`)
    expect(mapping.selector === exemption.selector, `Selector mismatch in ${exemption.id}`)
    expect(mapping.declarations.color === `var(--${exemption.foreground})`, `Foreground mismatch in ${exemption.id}`)
    expect(mapping.declarations.background === `var(--${exemption.background})`, `Background mismatch in ${exemption.id}`)
  }
  expect(sha256Json(value.contrastExemptions) === requiredContrastExemptionsSha256, "Contrast exemption values drifted")
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
const paperMutedCanvas = contract.legalPairs.find(pair => pair.id === "paper-muted-canvas")
expect(paperMutedCanvas !== undefined, "Missing paper-muted-canvas fixture")
const paperMutedCanvasWithoutTarget = { ...paperMutedCanvas }
delete paperMutedCanvasWithoutTarget.target
expectFailure(
  "missing required target",
  () => validateContractShape({
    ...contract,
    legalPairs: contract.legalPairs.map(pair => pair.id === paperMutedCanvas.id ? paperMutedCanvasWithoutTarget : pair),
  }),
  "Missing target in paper-muted-canvas",
)
expectFailure(
  "target below minimum",
  () => validateContractShape({
    ...contract,
    legalPairs: contract.legalPairs.map(pair => pair.id === paperMutedCanvas.id ? { ...pair, target: 4 } : pair),
  }),
  "Target below minimum in paper-muted-canvas",
)
expectFailure(
  "wrong required target",
  () => validateContractShape({
    ...contract,
    legalPairs: contract.legalPairs.map(pair => pair.id === paperMutedCanvas.id ? { ...pair, target: 5.1 } : pair),
  }),
  "Target in paper-muted-canvas must be 5",
)
expectFailure(
  "deleted required contrast exemption",
  () => validateContractShape({ ...contract, contrastExemptions: [] }),
  "Contrast exemption id set drifted",
)
expectFailure(
  "wrong required contrast exemption value",
  () => validateContractShape({
    ...contract,
    contrastExemptions: [
      { ...contract.contrastExemptions[0], reason: "Inactive component." },
    ],
  }),
  "Contrast exemption values drifted",
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
  "contrast release target",
  () => verifyPair({ id: "under-target-pair", foreground: "foreground", background: "background", minimum: 4.5, target: 5 }, [{ foreground: "#737373", background: "#ffffff" }]),
  "under-target-pair contrast #737373 on #ffffff = 4.74:1 below target 5:1",
)
expectFailure(
  "missing mapped selector",
  () => verifyStateMappings(".other { color: red; }", { stateMappings: { missing: { selector: ".missing", declarations: { color: "red" } } } }),
  "Expected exactly one showcase rule",
)

const foundation = variableMap(contract.sources.foundation, "@theme static")
const border = variableMap(contract.sources.border, "@theme static")
const paper = variableMap(contract.sources.paper, contract.selectors.paper)
const ink = variableMap(contract.sources.ink, contract.selectors.ink)
const reading = variableMap(contract.sources.reading, ":root")
const readingInk = variableMap(contract.sources.reading, contract.selectors.ink)

for (const [name, value] of Object.entries(contract.foundationDeclarations))
  expect(foundation[name] === value, `foundation --${name} must be ${value}; received ${foundation[name]}`)
for (const [name, value] of Object.entries(contract.borderDeclarations))
  expect(border[name] === value, `border --${name} must be ${value}; received ${border[name]}`)
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

for (const exemption of contract.contrastExemptions)
  console.log(`${exemption.id}: contrast exempt in ${exemption.modes.join(", ")} (${exemption.kind})`)

console.log("Paper & Ink theme contract passed")
