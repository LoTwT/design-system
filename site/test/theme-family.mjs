import { readFileSync, readdirSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { runInNewContext } from "node:vm"
import postcss from "postcss"
import ts from "typescript"

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))))

function expect(condition, message) {
  if (!condition)
    throw new Error(message)
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

function readSource(file) {
  return readFileSync(join(rootDir, file), "utf8")
}

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name)
    if (entry.isDirectory())
      return ["cache", "dist"].includes(entry.name) ? [] : listFiles(file)
    return entry.isFile() ? [file] : []
  })
}

function createRoot(initialClasses = []) {
  const classes = new Set(initialClasses)
  const classList = {
    add(...names) {
      for (const name of names)
        classes.add(name)
    },
    contains(name) {
      return classes.has(name)
    },
    remove(...names) {
      for (const name of names)
        classes.delete(name)
    },
    toggle(name, force) {
      const next = force === undefined ? !classes.has(name) : Boolean(force)
      if (next)
        classes.add(name)
      else
        classes.delete(name)
      return next
    },
  }
  return { classList, classes, dataset: {} }
}

function expectClasses(root, expected, label) {
  expect(
    JSON.stringify([...root.classes].sort()) === JSON.stringify([...expected].sort()),
    `${label}: expected classes ${[...expected].join(" ")}; received ${[...root.classes].join(" ")}`,
  )
}

function loadTsModule(file, { globals = {}, imports = {} } = {}) {
  const output = ts.transpileModule(readSource(file), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: file,
  }).outputText
  const exports = {}
  const sandbox = {
    exports,
    require(id) {
      expect(Object.hasOwn(imports, id), `${file} requested unexpected runtime import: ${id}`)
      return imports[id]
    },
    ...globals,
  }
  runInNewContext(output, sandbox, { filename: file })
  return exports
}

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node))
    return node.text
}

function verifyConfigHeadSafety(source, file) {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  expect(sourceFile.parseDiagnostics.length === 0, `${file} has TypeScript parse errors`)
  const forbiddenHooks = new Set(["transformHead", "transformHtml", "transformIndexHtml", "transformPageData"])
  function visit(node) {
    if (
      (ts.isPropertyAssignment(node) || ts.isMethodDeclaration(node))
      && forbiddenHooks.has(propertyName(node.name))
    )
      throw new Error(`${file} must not add a dynamic HTML/head hook`)
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
}

function markdownSources() {
  return listFiles(join(rootDir, "site"))
    .filter(file => file.endsWith(".md"))
    .map(file => ({ file: relative(rootDir, file), source: readFileSync(file, "utf8") }))
}

function verifyMarkdownClientGuards(sources) {
  for (const { file, source } of sources) {
    expect(!/<(?:style|script|link)\b/i.test(source), `${file} must not add a client style/script/link block`)
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1]
    if (frontmatter !== undefined) {
      expect(
        !/(?:^|[\s,{])["']?head["']?\s*:/im.test(frontmatter),
        `${file} must not add page-level head entries`,
      )
    }
  }
}

function verifyNoInlineThemeStyles(source, file) {
  expect(
    !/(?:^|\s)(?:style|:style|v-bind:style|v-bind)\s*=/im.test(source),
    `${file} must not add inline author styles`,
  )
}

function declarationsFor(container, selector) {
  return (container.nodes ?? []).flatMap((node) => {
    if (node.type !== "rule" || !node.selectors.map(value => value.trim()).includes(selector))
      return []
    return (node.nodes ?? []).filter(child => child.type === "decl")
  })
}

function expectDeclaration(container, selector, property, value, important = false) {
  const matches = declarationsFor(container, selector).filter(declaration =>
    declaration.prop === property
    && declaration.value.trim() === value
    && Boolean(declaration.important) === important,
  )
  expect(matches.length > 0, `Missing ${selector} { ${property}: ${value}${important ? " !important" : ""} }`)
}

function media(css, query) {
  const matches = css.nodes.filter(node => node.type === "atrule" && node.name === "media" && node.params === query)
  expect(matches.length > 0, `Missing @media ${query}`)
  return matches[0]
}

function vueStyle(source, file) {
  const blocks = [...source.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)]
  expect(blocks.length === 1, `${file} must keep one component style block`)
  return postcss.parse(blocks[0][1], { from: file })
}

const poisonRoot = createRoot(["global-sentinel"])
const storage = { getItem: () => null, setItem: () => {} }
const themeFamily = loadTsModule("site/.vitepress/theme/theme-family.ts", {
  globals: {
    document: { documentElement: poisonRoot },
    localStorage: storage,
    self: { document: { documentElement: poisonRoot } },
    window: { document: { documentElement: poisonRoot } },
  },
})

const familyRoot = createRoot(["brutal", "dark"])
themeFamily.applyThemeFamilyToRoot(familyRoot, themeFamily.DEFAULT_THEME_FAMILY)
expectClasses(familyRoot, ["dark"], "Default family")
expect(familyRoot.dataset.themeFamily === "default", "Default family must update the root dataset")
themeFamily.applyThemeFamilyToRoot(familyRoot, themeFamily.NEO_THEME_FAMILY)
expectClasses(familyRoot, ["brutal", "dark"], "Neo family")
expect(familyRoot.dataset.themeFamily === "neo", "Neo family must update the root dataset")
expectClasses(poisonRoot, ["global-sentinel"], "Adapter global boundary")
expect(Object.keys(poisonRoot.dataset).length === 0, "Adapter must not mutate an ambient global root")

function runInitScript(storedFamily, { storageThrows = false } = {}) {
  const root = createRoot(["dark"])
  const writes = []
  const reads = []
  runInNewContext(themeFamily.THEME_FAMILY_INIT_SCRIPT, {
    document: { documentElement: root },
    localStorage: {
      getItem(key) {
        reads.push(key)
        if (storageThrows)
          throw new Error("blocked")
        return storedFamily
      },
      setItem(...args) {
        writes.push(args)
      },
    },
  })
  expect(reads.length === 1 && reads[0] === themeFamily.THEME_FAMILY_STORAGE_KEY, "Init script must read the family storage key once")
  expect(writes.length === 0, "Init script must not persist during first paint")
  return root
}

const defaultInit = runInitScript(null)
expectClasses(defaultInit, ["dark"], "Missing saved family")
expect(defaultInit.dataset.themeFamily === "default", "Missing saved family must restore Default")
const neoInit = runInitScript("neo")
expectClasses(neoInit, ["brutal", "dark"], "Saved Neo family")
expect(neoInit.dataset.themeFamily === "neo", "Saved Neo family must restore Neo")
expect(runInitScript("unexpected").dataset.themeFamily === "default", "Unexpected storage must fail to Default")
expect(runInitScript(null, { storageThrows: true }).dataset.themeFamily === "default", "Blocked storage must fail to Default")

const mounted = []
const isDark = { value: false }
const composableRoot = createRoot(["brutal"])
const persisted = []
const composable = loadTsModule("site/.vitepress/theme/composables/useThemeFamily.ts", {
  globals: {
    document: { documentElement: composableRoot },
    localStorage: { setItem: (...args) => persisted.push(args) },
  },
  imports: {
    "../theme-family": themeFamily,
    vitepress: { useData: () => ({ isDark }) },
    vue: {
      computed: getter => ({ get value() { return getter() } }),
      onMounted: callback => mounted.push(callback),
      shallowRef: value => ({ value }),
    },
  },
})
const headerControl = composable.useThemeFamily()
const mobileControl = composable.useThemeFamily()
expect(!headerControl.isReady.value && !mobileControl.isReady.value, "Controls must wait for mount before becoming visible")
for (const callback of mounted)
  callback()
expect(headerControl.isReady.value && mobileControl.isReady.value, "Both controls must become ready after mount")
expect(headerControl.effectiveState.value === "Neo · Light", "Mounted controls must hydrate from the root family")
headerControl.toggleThemeFamily()
expectClasses(composableRoot, [], "Toggle to Default")
expect(mobileControl.family.value === "default", "Header and mobile controls must share family state")
expect(JSON.stringify(persisted.at(-1)) === JSON.stringify([themeFamily.THEME_FAMILY_STORAGE_KEY, "default"]), "Toggle must persist Default")
mobileControl.toggleThemeFamily()
isDark.value = true
expect(headerControl.effectiveState.value === "Neo · Dark", "Family and Appearance axes must compose")
expect(JSON.stringify(persisted.at(-1)) === JSON.stringify([themeFamily.THEME_FAMILY_STORAGE_KEY, "neo"]), "Toggle must persist Neo")

const componentFile = "site/.vitepress/theme/components/ThemeFamilyControl.vue"
const componentSource = readSource(componentFile)
for (const fragment of [
  'role="switch"',
  ':aria-checked="isNeo"',
  'aria-live="polite"',
  'aria-atomic="true"',
  '@click="toggleThemeFamily"',
  'type="button"',
])
  expect(componentSource.includes(fragment), `${componentFile} must include ${fragment}`)
verifyNoInlineThemeStyles(componentSource, componentFile)

const componentCss = vueStyle(componentSource, componentFile)
expectDeclaration(componentCss, ".theme-family-switch", "width", "var(--touch-target-min)")
expectDeclaration(componentCss, ".theme-family-switch", "height", "var(--touch-target-min)")
expectDeclaration(componentCss, ".theme-family-switch", "touch-action", "manipulation")
expectDeclaration(componentCss, ".theme-family-switch:focus-visible", "outline", "2px solid var(--focus-ring-color)")
expectDeclaration(media(componentCss, "(prefers-reduced-motion: reduce)"), ".theme-family-switch__thumb", "transition-duration", "0s")
const desktopComponent = media(componentCss, "(min-width: 768px)")
expectDeclaration(desktopComponent, ".theme-family-control--header", "display", "flex")
expectDeclaration(desktopComponent, ".theme-family-control--screen", "display", "none")

const layoutSource = readSource("site/.vitepress/theme/Layout.vue")
expect(layoutSource.includes('<ThemeFamilyControl placement="header" />'), "Layout must mount the desktop Theme Family control")
expect(layoutSource.includes('<ThemeFamilyControl placement="screen" />'), "Layout must mount the mobile Theme Family control")

const globalCss = postcss.parse(readSource("site/.vitepress/theme/style.css"), { from: "site/.vitepress/theme/style.css" })
const mobileNav = media(globalCss, "(max-width: 767px)")
expectDeclaration(mobileNav, ".VPNavScreen > .container", "display", "flex")
expectDeclaration(mobileNav, ".VPNavScreen > .container", "flex-direction", "column")
for (const [selector, order] of [
  [".VPNavScreen .menu", "1"],
  [".VPNavScreen .translations", "2"],
  [".VPNavScreen .appearance", "3"],
  [".VPNavScreen .theme-family-control--screen", "4"],
  [".VPNavScreen .social-links", "5"],
])
  expectDeclaration(mobileNav, selector, "order", order)

const themeDirectory = join(rootDir, "site/.vitepress/theme")
for (const file of listFiles(themeDirectory)) {
  const relativeFile = relative(rootDir, file)
  if (relativeFile === componentFile || !/\.(?:css|ts|vue)$/.test(file))
    continue
  expect(
    !readFileSync(file, "utf8").includes(".theme-family-switch__thumb"),
    `${relativeFile} must not override Theme Family thumb motion outside its component`,
  )
}

const markdown = markdownSources()
verifyMarkdownClientGuards(markdown)
expectFailure(
  "Markdown page head style",
  () => verifyMarkdownClientGuards([{ file: "site/index.md", source: `---\nhead:\n  - - style\n    - {}\n    - ".theme-family-switch__thumb { transition-duration: 1s !important; }"\n---\n` }]),
  "must not add page-level head entries",
)
expectFailure(
  "component inline motion",
  () => verifyNoInlineThemeStyles('<span class="theme-family-switch__thumb" style="transition-duration: 1s" />', componentFile),
  "must not add inline author styles",
)

const configFile = "site/.vitepress/config.ts"
const configSource = readSource(configFile)
verifyConfigHeadSafety(configSource, configFile)
expectFailure(
  "dynamic transformHead hook",
  () => verifyConfigHeadSafety(configSource.replace("  head: [", "  transformHead: () => [],\n  head: ["), configFile),
  "must not add a dynamic HTML/head hook",
)

console.log("site Theme Family behavior contract passed")
