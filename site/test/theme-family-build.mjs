import { existsSync, readFileSync, readdirSync } from "node:fs"
import { createServer } from "node:http"
import { dirname, extname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { runInNewContext } from "node:vm"
import { chromium } from "playwright-core"
const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
const distDir = join(rootDir, "site/.vitepress/dist")
const deadlineMs = Number(process.env.THEME_BROWSER_DEADLINE_MS ?? 10000)
function expect(condition, message) {
  if (!condition)
    throw new Error(message)
}
function deadline(promise, label, timeout = deadlineMs) {
  let timer
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeout}ms`)), timeout)
    }),
  ]).finally(() => clearTimeout(timer))
}
function htmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name)
    return entry.isDirectory() ? htmlFiles(file) : entry.isFile() && file.endsWith(".html") ? [file] : []
  })
}
const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"))?.[1]
function chromeBinary() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  ]
  const binary = candidates.find(candidate => candidate && existsSync(candidate))
  expect(binary, "Theme Family browser verification requires Chrome/Chromium; set CHROME_PATH when it is not installed in a standard location")
  return binary
}
function staticServer() {
  return createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://site.test").pathname)
    let file = join(distDir, pathname === "/" ? "index.html" : pathname.slice(1))
    if (!extname(file))
      file += ".html"
    if (relative(distDir, file).startsWith("..")) {
      response.writeHead(403).end()
      return
    }
    try {
      const types = { ".css": "text/css", ".html": "text/html", ".js": "text/javascript", ".svg": "image/svg+xml", ".woff2": "font/woff2" }
      response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" }).end(readFileSync(file))
    }
    catch {
      response.writeHead(404).end()
    }
  })
}
async function closeServer(server) {
  if (!server.listening)
    return
  const closed = new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  server.closeAllConnections()
  await deadline(closed, "static server close", 2000)
}
async function assertInteractive(locator, label) {
  await locator.waitFor({ state: "visible" })
  const started = Date.now()
  let state
  do {
    state = await locator.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      for (let current = element; current; current = current.parentElement) {
        const style = getComputedStyle(current)
        if (style.display === "none" || style.visibility === "hidden" || Number.parseFloat(style.opacity) === 0 || (current === element && style.pointerEvents === "none"))
          return { ok: false, reason: `${current.tagName}.${current.className}: ${style.display}/${style.visibility}/${style.opacity}/${style.pointerEvents}` }
      }
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
      return { hit: `${hit?.tagName}.${hit?.className}`, ok: rect.width > 0 && rect.height > 0 && (hit === element || element.contains(hit)), rect: rect.toJSON() }
    })
    if (state.ok)
      return
    await new Promise(resolve => setTimeout(resolve, 50))
  } while (Date.now() - started < deadlineMs)
  expect(state.ok, `${label} must be visible, opaque, pointer-enabled, and hit-testable: ${JSON.stringify(state)}`)
}

async function waitForState(page, { controls, dark, family, storage }) {
  const status = `${family === "neo" ? "Neo" : "Default"} · ${dark ? "Dark" : "Light"}`
  await page.waitForFunction((expected) => {
    const root = document.documentElement
    const items = [...document.querySelectorAll(".theme-family-control")]
    return items.length === expected.controls && root.classList.contains("dark") === expected.dark
      && root.dataset.themeFamily === expected.family && root.classList.contains("brutal") === (expected.family === "neo")
      && localStorage.getItem("ayingott:theme-family") === expected.storage
      && items.every((control) => control.classList.contains("is-ready") && !control.hasAttribute("aria-hidden")
        && control.querySelector(".theme-family-switch")?.getAttribute("role") === "switch"
        && control.querySelector(".theme-family-switch")?.getAttribute("aria-checked") === String(expected.family === "neo")
        && control.querySelector(".theme-family-control__status")?.getAttribute("aria-live") === "polite"
        && control.querySelector(".theme-family-control__status")?.textContent.trim() === expected.status)
  }, { controls, dark, family, status, storage })
}

async function beginSchemeWatch(page, dark) {
  const initial = await page.evaluate((expected) => {
    window.__themeSchemeObserver?.disconnect()
    const root = document.documentElement
    let previous = root.classList.contains("dark")
    window.__themeSchemeChanges = 0
    window.__themeSchemeObserver = new MutationObserver(() => {
      const next = root.classList.contains("dark")
      if (next !== previous) {
        window.__themeSchemeChanges++
        previous = next
      }
    })
    window.__themeSchemeObserver.observe(root, { attributeFilter: ["class"], attributes: true })
    return previous === expected
  }, dark)
  expect(initial, `scheme observer must start in ${dark ? "Dark" : "Light"}`)
}

async function expectSchemeStable(page, dark) {
  await page.waitForTimeout(250)
  const result = await page.evaluate(() => {
    window.__themeSchemeObserver?.disconnect()
    return { changes: window.__themeSchemeChanges, dark: document.documentElement.classList.contains("dark") }
  })
  expect(result.dark === dark && result.changes === 0, `Family interaction must preserve ${dark ? "Dark" : "Light"} through the post-render stability window`)
}

async function focusByTab(page, locator, label) {
  for (let index = 0; index < 24; index++) {
    await page.keyboard.press("Tab")
    if (await locator.evaluate(element => document.activeElement === element))
      return
  }
  throw new Error(`${label} must be reachable by keyboard Tab navigation`)
}

async function verifyBrowserBehavior() {
  const server = staticServer()
  let browser
  let failure
  try {
    await deadline(new Promise((resolve, reject) => server.listen(0, "127.0.0.1").once("listening", resolve).once("error", reject)), "static server listen")
    browser = await chromium.launch({
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-background-networking"],
      executablePath: chromeBinary(),
      headless: true,
      timeout: deadlineMs,
    })
    const version = browser.version()
    if (process.env.EXPECTED_CHROME_VERSION)
      expect(version === process.env.EXPECTED_CHROME_VERSION, `expected Chrome ${process.env.EXPECTED_CHROME_VERSION}, received ${version}`)
    const context = await browser.newContext({ colorScheme: "light", reducedMotion: "reduce", viewport: { height: 844, width: 1280 } })
    const page = await context.newPage()
    page.setDefaultNavigationTimeout(deadlineMs)
    page.setDefaultTimeout(deadlineMs)
    const origin = `http://127.0.0.1:${server.address().port}`
    await page.goto(`${origin}/`)
    await waitForState(page, { controls: 1, dark: false, family: "default", storage: null })
    const desktop = page.locator(".theme-family-control--header")
    const desktopSwitch = desktop.locator(".theme-family-switch")
    const desktopStatus = desktop.locator(".theme-family-control__status")
    await assertInteractive(desktopSwitch, "desktop Theme Family switch")
    await desktopStatus.waitFor({ state: "visible" })
    const lightDuration = await desktop.locator(".theme-family-switch__thumb").evaluate(element => getComputedStyle(element).transitionDuration)
    await beginSchemeWatch(page, false)
    await desktopSwitch.click()
    await waitForState(page, { controls: 1, dark: false, family: "neo", storage: "neo" })
    await expectSchemeStable(page, false)
    await page.locator(".VPSwitchAppearance:visible").click()
    await waitForState(page, { controls: 1, dark: true, family: "neo", storage: "neo" })
    const darkDuration = await desktop.locator(".theme-family-switch__thumb").evaluate(element => getComputedStyle(element).transitionDuration)
    await focusByTab(page, desktopSwitch, "desktop Theme Family switch")
    await beginSchemeWatch(page, true)
    await page.keyboard.press("Space")
    await waitForState(page, { controls: 1, dark: true, family: "default", storage: "default" })
    await expectSchemeStable(page, true)
    await page.locator(".VPSwitchAppearance:visible").click()
    await waitForState(page, { controls: 1, dark: false, family: "default", storage: "default" })

    await page.setViewportSize({ height: 844, width: 390 })
    await page.goto(`${origin}/guide/getting-started`)
    await waitForState(page, { controls: 1, dark: false, family: "default", storage: "default" })
    await page.locator(".VPNavBarHamburger").click()
    const mobile = page.locator(".theme-family-control--screen")
    const mobileSwitch = mobile.locator(".theme-family-switch")
    await waitForState(page, { controls: 2, dark: false, family: "default", storage: "default" })
    await assertInteractive(mobileSwitch, "mobile Theme Family switch")
    await mobile.locator(".theme-family-control__status").waitFor({ state: "visible" })
    await beginSchemeWatch(page, false)
    await mobileSwitch.click()
    await waitForState(page, { controls: 2, dark: false, family: "neo", storage: "neo" })
    await expectSchemeStable(page, false)
    await page.reload()
    await page.locator(".VPNavBarHamburger").click()
    await waitForState(page, { controls: 2, dark: false, family: "neo", storage: "neo" })
    await page.locator(".VPSwitchAppearance:visible").click()
    await waitForState(page, { controls: 2, dark: true, family: "neo", storage: "neo" })
    await focusByTab(page, mobileSwitch, "mobile Theme Family switch")
    const rendered = await mobileSwitch.evaluate((button) => {
      const control = button.closest(".theme-family-control")
      return { display: getComputedStyle(control).display, order: getComputedStyle(control).order,
        width: getComputedStyle(button).width, height: getComputedStyle(button).height,
        focusVisible: button.matches(":focus-visible"), outline: getComputedStyle(button).outline }
    })
    expect(rendered.display === "grid" && rendered.order === "4" && rendered.width === "44px" && rendered.height === "44px", "mobile control must render at order 4 as a grid with a 44px target")
    expect(rendered.focusVisible && rendered.outline.includes("solid 2px"), "mobile switch must expose a rendered keyboard focus outline")
    const isZero = value => value.split(",").every(duration => Number.parseFloat(duration) === 0)
    expect(isZero(lightDuration) && isZero(darkDuration), "Theme Family thumb must compute to zero transition duration under reduced motion in Light and Dark")
    console.log(`site Theme Family browser contract passed with Chrome ${version}`)
  }
  catch (error) {
    failure = error
  }
  finally {
    const cleanupErrors = []
    for (const cleanup of [() => browser?.close(), () => closeServer(server)]) {
      try {
        await deadline(Promise.resolve(cleanup()), "browser resource cleanup", 3000)
      }
      catch (error) {
        cleanupErrors.push(error)
      }
    }
    if (cleanupErrors.length)
      failure = failure ? new AggregateError([failure, ...cleanupErrors], failure.message) : new AggregateError(cleanupErrors, "browser cleanup failed")
  }
  if (failure)
    throw failure
}
function executeInit(script, savedFamily, initialDark) {
  const classes = new Set(initialDark ? ["dark"] : [])
  const root = { classList: { toggle(name, force) { force ? classes.add(name) : classes.delete(name) } }, dataset: {} }
  runInNewContext(script, { document: { documentElement: root }, localStorage: { getItem: () => savedFamily } })
  return { classes, family: root.dataset.themeFamily }
}

const generatedFiles = htmlFiles(distDir)
expect(generatedFiles.length > 0, "Site build must emit HTML")
let renderedInterfaces = 0
for (const file of generatedFiles) {
  const label = relative(rootDir, file)
  const html = readFileSync(file, "utf8")
  const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1]
  expect(head !== undefined, `${label} must render a document head`)
  expect(!/<style\b/i.test(html), `${label} must not render an author-style block`)
  const themeTags = [...html.matchAll(/<[^>]*\bclass=["'][^"']*\btheme-family-[^"']*["'][^>]*>/gi)].map(match => match[0])
  expect(themeTags.every(tag => attribute(tag, "style") === undefined), `${label} Theme Family interface must not render inline styles`)
  if (themeTags.length > 0) {
    renderedInterfaces++
    const switchTag = themeTags.find(tag => tag.includes("theme-family-switch\""))
    expect(switchTag && attribute(switchTag, "role") === "switch", `${label} must render the family switch role`)
    expect(attribute(switchTag, "aria-checked") === "false", `${label} must render the Default family switch state`)
    expect(themeTags.some(tag => attribute(tag, "aria-live") === "polite"), `${label} must render the family live status`)
  }
  const initScripts = [...head.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match => match[1]).filter(script => script.includes("ayingott:theme-family"))
  expect(initScripts.length === 1, `${label} must render one Theme Family init script`)
  for (const initialDark of [false, true]) {
    const defaultState = executeInit(initScripts[0], null, initialDark)
    expect(defaultState.family === "default" && !defaultState.classes.has("brutal") && defaultState.classes.has("dark") === initialDark, `${label} init script must preserve ${initialDark ? "Dark" : "Light"} while restoring Default`)
    const neoState = executeInit(initScripts[0], "neo", initialDark)
    expect(neoState.family === "neo" && neoState.classes.has("brutal") && neoState.classes.has("dark") === initialDark, `${label} init script must compose Neo with ${initialDark ? "Dark" : "Light"}`)
  }
}
expect(renderedInterfaces > 0, "Generated pages must render the Theme Family interface")
if (process.argv.includes("--browser"))
  await verifyBrowserBehavior()

console.log("site Theme Family build contract passed")
