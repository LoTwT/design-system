import { readFileSync, readdirSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { runInNewContext } from "node:vm"
import postcss from "postcss"

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
const distDir = join(rootDir, "site/.vitepress/dist")
const expectedRoutes = [
  "404.html", "fonts.html", "guide/getting-started.html", "guide/package-contract.html",
  "guide/theme-overview.html", "index.html", "tokens/colors.html", "tokens/effects.html",
  "tokens/semantic.html", "tokens/spacing.html", "tokens/typography.html",
  "utilities/focus-ring.html", "utilities/touch-target.html",
]

function expect(condition, message) {
  if (!condition)
    throw new Error(message)
}

function htmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name)
    return entry.isDirectory() ? htmlFiles(file) : entry.isFile() && file.endsWith(".html") ? [file] : []
  })
}

const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"))?.[1]

function stylesheetSources(head, label) {
  const hrefs = [...head.matchAll(/<link\b[^>]*>/gi)]
    .map(match => ({ href: attribute(match[0], "href"), rel: attribute(match[0], "rel") }))
    .filter(({ href, rel }) => href && rel?.split(/\s+/).includes("stylesheet"))
    .map(({ href }) => href.split(/[?#]/)[0])
  expect(hrefs.length > 0, `${label} must load its generated stylesheets`)
  return hrefs.map((href) => {
    const file = join(distDir, href.replace(/^\//, ""))
    return postcss.parse(readFileSync(file, "utf8"), { from: file })
  })
}

const element = (tag, classes = [], attributes = {}) => ({ attributes, classes: new Set(classes), tag })

function compoundMatches(compound, target) {
  if (/:{1,2}[\w-]/.test(compound))
    return false
  for (const match of compound.matchAll(/\[\s*([\w-]+)(?:\s*=\s*["']?([^\]"']+)["']?)?\s*\]/g)) {
    const [, name, expected] = match
    const actual = name.startsWith("data-v-") ? "" : target.attributes[name]
    if (actual === undefined || (expected !== undefined && actual !== expected.trim()))
      return false
  }
  for (const match of compound.matchAll(/\.([\w-]+)/g)) {
    if (!target.classes.has(match[1]))
      return false
  }
  const id = compound.match(/#([\w-]+)/)?.[1]
  if (id && target.attributes.id !== id)
    return false
  const tag = compound
    .replace(/\[[^\]]+\]/g, "")
    .replace(/[.#][\w-]+/g, "")
    .replace(/\*/g, "")
    .trim()
  return !tag || tag.toLowerCase() === target.tag
}

function selectorMatches(selector, path) {
  if (/[+~]/.test(selector))
    return false
  const compounds = selector.replace(/>/g, " ").trim().split(/\s+/)
  let pathIndex = path.length - 1
  if (!compoundMatches(compounds.at(-1), path[pathIndex]))
    return false
  for (let index = compounds.length - 2; index >= 0; index--) {
    do pathIndex--
    while (pathIndex >= 0 && !compoundMatches(compounds[index], path[pathIndex]))
    if (pathIndex < 0)
      return false
  }
  return true
}

function specificity(selector) {
  const source = selector.replace(/:where\([^)]*\)/g, "")
  const ids = source.match(/#[\w-]+/g)?.length ?? 0
  const classes = source.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/g)?.length ?? 0
  const tags = source
    .replace(/#[\w-]+|\.[\w-]+|\[[^\]]+\]|:{1,2}[\w-]+(?:\([^)]*\))?/g, " ")
    .split(/[\s>+~,*]+/)
    .filter(Boolean).length
  return ids * 100 + classes * 10 + tags
}

function mediaMatches(query, environment) {
  return query.toLowerCase().split(",").some((branch) => {
    if (/\bprint\b/.test(branch))
      return false
    const reduced = branch.match(/prefers-reduced-motion\s*:\s*(reduce|no-preference)/)?.[1]
    if (reduced && (reduced === "reduce") !== environment.reducedMotion)
      return false
    const maxWidth = Number(branch.match(/max-width\s*:\s*(\d+)px/)?.[1])
    const minWidth = Number(branch.match(/min-width\s*:\s*(\d+)px/)?.[1])
    return (!maxWidth || environment.width <= maxWidth) && (!minWidth || environment.width >= minWidth)
  })
}

function declarationValue(declaration, property) {
  const declaredProperty = declaration.prop.toLowerCase()
  if (declaredProperty === property)
    return declaration.value.trim()
  if (property === "transition-duration" && declaredProperty === "transition") {
    if (declaration.value.trim() === "none")
      return "0s"
    return declaration.value.match(/(?:^|[\s,])(-?(?:\d*\.)?\d+(?:ms|s))\b/)?.[1]
  }
}

function computedValue(stylesheets, path, property, environment) {
  let order = 0
  let winner
  function visit(nodes, active = true) {
    for (const node of nodes ?? []) {
      if (node.type === "atrule") {
        visit(node.nodes, active && (node.name !== "media" || mediaMatches(node.params, environment)))
        continue
      }
      if (node.type !== "rule" || !active)
        continue
      const matchedSpecificity = Math.max(
        ...node.selectors.filter(selector => selectorMatches(selector, path)).map(specificity),
        -1,
      )
      for (const declaration of node.nodes ?? []) {
        if (declaration.type !== "decl")
          continue
        order++
        const value = declarationValue(declaration, property)
        if (value === undefined || matchedSpecificity < 0)
          continue
        const candidate = { important: Boolean(declaration.important), order, specificity: matchedSpecificity, value }
        if (
          !winner
          || Number(candidate.important) > Number(winner.important)
          || (candidate.important === winner.important && candidate.specificity > winner.specificity)
          || (candidate.important === winner.important && candidate.specificity === winner.specificity && candidate.order > winner.order)
        )
          winner = candidate
      }
    }
  }
  for (const stylesheet of stylesheets)
    visit(stylesheet.nodes)
  return winner?.value
}

const thumbPath = dark => [
  element("html", dark ? ["dark"] : []), element("body"),
  element("div", ["theme-family-control", "theme-family-control--header", "is-ready"]),
  element("button", ["theme-family-switch"], { "aria-checked": "false" }),
  element("span", ["theme-family-switch__track"]), element("span", ["theme-family-switch__thumb"]),
]
const mobileControlPath = [
  element("html"), element("body"), element("div", ["VPNavScreen"]), element("div", ["container"]),
  element("div", ["theme-family-control", "theme-family-control--screen", "is-ready"]),
]

function executeInit(script, savedFamily, initialDark) {
  const classes = new Set(initialDark ? ["dark"] : [])
  const root = {
    classList: {
      toggle(name, force) {
        if (force)
          classes.add(name)
        else
          classes.delete(name)
      },
    },
    dataset: {},
  }
  runInNewContext(script, {
    document: { documentElement: root },
    localStorage: { getItem: () => savedFamily },
  })
  return { classes, family: root.dataset.themeFamily }
}

const generatedFiles = htmlFiles(distDir)
const generatedRoutes = generatedFiles.map(file => relative(distDir, file)).sort()
expect(JSON.stringify(generatedRoutes) === JSON.stringify(expectedRoutes), "Generated routes must match the canonical site routes")
let renderedInterfaces = 0
for (const file of generatedFiles) {
  const label = relative(rootDir, file)
  const html = readFileSync(file, "utf8")
  const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1]
  expect(head !== undefined, `${label} must render a document head`)
  expect(!/<style\b/i.test(html), `${label} must not render an author-style block`)
  const themeTags = [...html.matchAll(/<[^>]*theme-family[^>]*>/gi)].map(match => match[0])
  expect(themeTags.every(tag => attribute(tag, "style") === undefined), `${label} Theme Family interface must not render inline styles`)
  if (themeTags.length > 0) {
    renderedInterfaces++
    const switchTag = themeTags.find(tag => tag.includes("theme-family-switch\""))
    expect(switchTag && attribute(switchTag, "role") === "switch", `${label} must render the family switch role`)
    expect(attribute(switchTag, "aria-checked") === "false", `${label} must render the Default family switch state`)
    expect(themeTags.some(tag => attribute(tag, "aria-live") === "polite"), `${label} must render the family live status`)
  }
  const initScripts = [...head.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1])
    .filter(script => script.includes("ayingott:theme-family"))
  expect(initScripts.length === 1, `${label} must render one Theme Family init script`)
  for (const initialDark of [false, true]) {
    const defaultState = executeInit(initScripts[0], null, initialDark)
    expect(defaultState.family === "default" && !defaultState.classes.has("brutal") && defaultState.classes.has("dark") === initialDark, `${label} init script must preserve ${initialDark ? "Dark" : "Light"} while restoring Default`)
    const neoState = executeInit(initScripts[0], "neo", initialDark)
    expect(neoState.family === "neo" && neoState.classes.has("brutal") && neoState.classes.has("dark") === initialDark, `${label} init script must compose Neo with ${initialDark ? "Dark" : "Light"}`)
  }

  const stylesheets = stylesheetSources(head, label)
  for (const dark of [false, true]) {
    expect(
      computedValue(stylesheets, thumbPath(dark), "transition-duration", { reducedMotion: true, width: 390 }) === "0s",
      `${label} Theme Family thumb must compute to zero transition duration under reduced motion`,
    )
  }
  expect(
    computedValue(stylesheets, mobileControlPath, "order", { reducedMotion: false, width: 390 }) === "4",
    `${label} mobile Theme Family control must compute to final order 4`,
  )
}
expect(renderedInterfaces > 0, "Generated pages must render the Theme Family interface")

console.log("site Theme Family build contract passed")
