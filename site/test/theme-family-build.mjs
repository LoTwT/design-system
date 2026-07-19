import { readFileSync, readdirSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { runInNewContext } from "node:vm"

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
const distDir = join(rootDir, "site/.vitepress/dist")

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

function executeInit(script, savedFamily) {
  const classes = new Set(["dark"])
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

for (const file of htmlFiles(distDir)) {
  const label = relative(rootDir, file)
  const html = readFileSync(file, "utf8")
  const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1]
  expect(head !== undefined, `${label} must render a document head`)
  expect(!/<style\b/i.test(head), `${label} must not render an author-style head block`)
  expect(!/<link\b(?=[^>]*\brel=["']stylesheet["'])/i.test(head), `${label} must not render a page stylesheet head link`)
  const initScripts = [...head.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1])
    .filter(script => script.includes("ayingott:theme-family"))
  expect(initScripts.length === 1, `${label} must render one Theme Family init script`)
  const defaultState = executeInit(initScripts[0], null)
  expect(defaultState.family === "default" && !defaultState.classes.has("brutal") && defaultState.classes.has("dark"), `${label} init script must preserve Dark while restoring Default`)
  const neoState = executeInit(initScripts[0], "neo")
  expect(neoState.family === "neo" && neoState.classes.has("brutal") && neoState.classes.has("dark"), `${label} init script must compose Neo with Dark`)
}

console.log("site Theme Family build contract passed")
