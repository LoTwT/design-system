import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { runInNewContext } from "node:vm"
import ts from "typescript"

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
function expect(condition, message) {
  if (!condition)
    throw new Error(message)
}

const readSource = file => readFileSync(join(rootDir, file), "utf8")

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

const expectClasses = (root, expected, label) => expect(
  JSON.stringify([...root.classes].sort()) === JSON.stringify([...expected].sort()),
  `${label}: expected classes ${[...expected].join(" ")}; received ${[...root.classes].join(" ")}`,
)

function loadTsModule(file, { globals = {}, imports = {}, source = readSource(file) } = {}) {
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: file,
  }).outputText
  const exports = {}
  const sandbox = { exports, ...globals, require(id) {
    expect(Object.hasOwn(imports, id), `${file} requested unexpected runtime import: ${id}`)
    return imports[id]
  } }
  runInNewContext(output, sandbox, { filename: file })
  return exports
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

function runInitScript(storedFamily, { initialDark = false, storageThrows = false } = {}) {
  const root = createRoot(initialDark ? ["dark"] : [])
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
  expect(reads.length > 0 && reads.every(key => key === themeFamily.THEME_FAMILY_STORAGE_KEY), "Init script may only read the family storage key")
  expect(writes.length === 0, "Init script must not persist during first paint")
  return root
}

for (const initialDark of [false, true]) {
  const scheme = initialDark ? ["dark"] : []
  const defaultInit = runInitScript(null, { initialDark })
  expectClasses(defaultInit, scheme, `Missing saved family from ${initialDark ? "Dark" : "Light"}`)
  expect(defaultInit.dataset.themeFamily === "default", "Missing saved family must restore Default")
  const neoInit = runInitScript("neo", { initialDark })
  expectClasses(neoInit, ["brutal", ...scheme], `Saved Neo family from ${initialDark ? "Dark" : "Light"}`)
  expect(neoInit.dataset.themeFamily === "neo", "Saved Neo family must restore Neo")
}
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

const layoutSource = readSource("site/.vitepress/theme/Layout.vue")
expect(layoutSource.includes('<ThemeFamilyControl placement="header" />'), "Layout must mount the desktop Theme Family control")
expect(layoutSource.includes('<ThemeFamilyControl placement="screen" />'), "Layout must mount the mobile Theme Family control")
const layoutRoot = createRoot(["layout-sentinel"])
const layoutMounted = []
loadTsModule("site/.vitepress/theme/Layout.vue", {
  globals: { document: { documentElement: layoutRoot } },
  imports: {
    "./components/ThemeFamilyControl.vue": { default: {} },
    "vitepress/theme-without-fonts": { default: { Layout: {} } },
    vue: { onMounted: callback => layoutMounted.push(callback) },
  },
  source: layoutSource.match(/<script setup[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? "",
})
for (const callback of layoutMounted)
  callback()
expectClasses(layoutRoot, ["layout-sentinel"], "Layout hydration scheme boundary")

console.log("site Theme Family behavior contract passed")
