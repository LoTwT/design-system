import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs"
import { createServer } from "node:http"
import { dirname, extname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { runInNewContext } from "node:vm"
import { chromium } from "playwright-core"
import { contrastRatio } from "./theme-contract-helpers.mjs"
const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
const distDir = join(rootDir, "site/.vitepress/dist")
const brutalContract = JSON.parse(readFileSync(join(rootDir, "docs/spec/brutal-theme-contract.json"), "utf8"))
const publicRoles = Object.keys({ ...brutalContract.commonDeclarations, ...brutalContract.modeDeclarations.light })
  .filter(name => !name.startsWith("brutal-")).sort()
// Captured from the built 3c20675 baseline before changing Neo Dark. Hash only
// resolved public roles; internal palette aliases can change without an API change.
const unchangedModeDigests = {
  paper: "d471c5ecc3f9f2ecf6d48164a63fcd6848b384d5596bf2c1935ed3241d4aca83",
  ink: "6e5601da8d2873b5060aa0c684e2c9482e37f39f63cc29d75a031bed3b1724f3",
  neoLight: "9d9f57e9b091a8be2c1061138e8a4a7f86add96bd9cae51a849bc42f619032d5",
}
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
    const isHeader = control => control.classList.contains("theme-family-control--header")
    return items.length === expected.controls && root.classList.contains("dark") === expected.dark
      && root.dataset.themeFamily === expected.family && root.classList.contains("brutal") === (expected.family === "neo")
      && localStorage.getItem("ayingott:theme-family") === expected.storage
      && items.every((control) => control.classList.contains("is-ready") && !control.hasAttribute("aria-hidden")
        && control.querySelector(".theme-family-switch")?.getAttribute("role") === "switch"
        && control.querySelector(".theme-family-switch")?.getAttribute("aria-checked") === String(expected.family === "neo")
        && control.querySelector(".theme-family-control__status")?.getAttribute("aria-live") === "polite"
        && control.querySelector(".theme-family-control__status")?.textContent.trim() === expected.status)
      && items.filter(isHeader).every(control => control.querySelector(".theme-family-control__label") === null)
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

async function focusByTab(page, locator, label, maximumTabs = 24) {
  for (let index = 0; index < maximumTabs; index++) {
    await page.keyboard.press("Tab")
    if (await locator.evaluate(element => document.activeElement === element))
      return
  }
  throw new Error(`${label} must be reachable by keyboard Tab navigation`)
}

async function verifyUnchangedModes(page) {
  expect(publicRoles.length === 69, "Unchanged-mode public role set drifted")
  for (const [mode, classes] of [["paper", []], ["ink", ["dark"]], ["neoLight", ["brutal"]]]) {
    const values = await page.evaluate(({ classes, roles }) => {
      document.documentElement.classList.remove("brutal", "dark")
      document.documentElement.classList.add(...classes)
      const style = getComputedStyle(document.documentElement)
      return Object.fromEntries(roles.map(role => [role, style.getPropertyValue(`--${role}`).trim()
        .replace(/#[a-f0-9]{3,8}\b/gi, hex => hex.length === 4 || hex.length === 5
          ? `#${[...hex.slice(1)].map(character => character + character).join("").toLowerCase()}`
          : hex.toLowerCase())]))
    }, { classes, roles: publicRoles })
    const digest = createHash("sha256").update(JSON.stringify(values)).digest("hex")
    expect(digest === unchangedModeDigests[mode], `${mode} computed public roles changed: ${JSON.stringify(values)}`)
  }
}

async function verifyPressableStates(page, dark) {
  const depth = dark ? "rgb(8, 8, 8)" : "rgb(17, 17, 17)"
  const shadow = offset => `${depth} ${offset}px ${offset}px 0px 0px`
  await page.evaluate(() => {
    const button = document.createElement("button")
    button.id = "contract-pressable"
    button.className = "theme-action theme-action--primary pressable focus-ring touch-target"
    button.textContent = "Pressable"
    button.style.cssText = "position: fixed; top: 100px; left: 30px; z-index: 999; width: 160px"
    document.body.append(button)
  })
  const control = page.locator("#contract-pressable")
  async function state(expected) {
    try {
      await page.waitForFunction((expected) => {
        const style = getComputedStyle(document.querySelector("#contract-pressable"))
        return Object.entries(expected).every(([property, value]) => style[property] === value)
      }, expected)
    }
    catch (cause) {
      const actual = await control.evaluate((element, properties) => {
        const style = getComputedStyle(element)
        return Object.fromEntries(properties.map(property => [property, style[property]]))
      }, Object.keys(expected))
      throw new Error(`Neo ${dark ? "Dark" : "Light"} pressable expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`, { cause })
    }
  }
  try {
    for (const reducedMotion of ["no-preference", "reduce"]) {
      await page.emulateMedia({ reducedMotion, forcedColors: "none" })
      await page.mouse.move(0, 0)
      await state({ transform: "none", boxShadow: shadow(6), backgroundColor: "rgb(255, 208, 47)", color: "rgb(17, 17, 17)" })
      await control.hover()
      await state({ transform: reducedMotion === "reduce" ? "none" : "matrix(1, 0, 0, 1, -2, -2)", boxShadow: shadow(8), backgroundColor: "rgb(255, 122, 184)" })
      await page.mouse.down()
      try {
        await state({ transform: reducedMotion === "reduce" ? "none" : "matrix(1, 0, 0, 1, 6, 6)", boxShadow: shadow(0), backgroundColor: "rgb(255, 107, 74)" })
      }
      finally {
        await page.mouse.up()
      }
      const durations = await control.evaluate(element => getComputedStyle(element).transitionDuration)
      expect(durations.split(",").every(value => Number.parseFloat(value) === (reducedMotion === "reduce" ? 0 : 0.12)), `Unexpected pressable duration: ${durations}`)

      for (const attribute of ["disabled", "aria-disabled", "data-disabled"]) {
        await control.evaluate((element, attribute) => element.setAttribute(attribute, "true"), attribute)
        await page.mouse.move(0, 0)
        await state({ transform: "none", boxShadow: shadow(6) })
        await control.hover()
        await page.mouse.down()
        try {
          await state({ transform: "none", boxShadow: shadow(6) })
        }
        finally {
          await page.mouse.up()
          await control.evaluate((element, attribute) => element.removeAttribute(attribute), attribute)
        }
      }
    }

    await page.emulateMedia({ forcedColors: "active" })
    const system = await control.evaluate((element) => {
      const reference = document.createElement("button")
      reference.style.cssText = "border: 3px solid ButtonText; outline: 2px solid Highlight"
      element.after(reference)
      const style = getComputedStyle(reference)
      const colors = { border: style.borderTopColor, outline: style.outlineColor }
      reference.remove()
      return colors
    })
    // Chromium maps the showcase's authored hover/active border to Highlight.
    // Also test the standalone utility, whose explicit ButtonText wins in every
    // state. Forced colors suppresses box shadows at paint/computed-value time.
    for (const standalone of [false, true]) {
      if (standalone) {
        await control.evaluate((element) => {
          element.classList.remove("theme-action", "theme-action--primary")
          element.style.borderStyle = "solid"
          element.style.borderWidth = "3px"
        })
      }
      await page.mouse.move(0, 0)
      await state({ borderTopColor: system.border, boxShadow: "none" })
      await control.hover()
      const activeBorder = standalone ? system.border : system.outline
      await state({ borderTopColor: activeBorder, boxShadow: "none" })
      await page.mouse.down()
      try {
        await state({ borderTopColor: activeBorder, boxShadow: "none" })
      }
      finally {
        await page.mouse.up()
      }
    }
    await focusByTab(page, control, "forced-colors pressable", 128)
    await state({ outlineColor: system.outline })
    // Chromium may replace the authored outline with its wider native auto ring.
    const focus = await control.evaluate((element) => {
      const style = getComputedStyle(element)
      return { visible: element.matches(":focus-visible"), style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) }
    })
    expect(focus.visible && !["none", "hidden"].includes(focus.style) && focus.width >= 2, "Forced-colors pressable must retain a visible system-colored keyboard outline")
  }
  finally {
    await control.evaluate(element => element.remove())
    await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "none" })
  }
}

async function verifyNeoOverview(page, origin) {
  await page.goto(`${origin}/guide/theme-overview`)
  await page.locator(".theme-family-control.is-ready").first().waitFor()
  await page.evaluate(() => document.fonts.ready)
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ height: 844, width })
    for (const dark of [false, true]) {
      await page.evaluate((dark) => {
        document.documentElement.classList.add("brutal")
        document.documentElement.classList.toggle("dark", dark)
      }, dark)
      const layout = await page.evaluate(() => {
        const root = document.documentElement
        const controls = [...document.querySelectorAll(".theme-showcase button, .theme-input, .theme-choice")]
        const undersized = controls.filter((element) => {
          const rect = element.getBoundingClientRect()
          return rect.width < 44 || rect.height < 44
        }).map(element => element.className)
        const clipped = [...document.querySelectorAll(".theme-brutal-specimen__panel")].filter((element) => {
          const rect = element.getBoundingClientRect()
          if (rect.left < 0 || rect.right + 8 > root.clientWidth)
            return true
          for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
            const style = getComputedStyle(parent)
            const bounds = parent.getBoundingClientRect()
            if (/(hidden|clip|auto|scroll)/.test(style.overflowX) && (rect.left < bounds.left || rect.right + 8 > bounds.right))
              return true
            if (/(hidden|clip|auto|scroll)/.test(style.overflowY) && (rect.top < bounds.top || rect.bottom + 8 > bounds.bottom))
              return true
          }
          return false
        }).length
        const selected = getComputedStyle(document.querySelector(".theme-choice")).backgroundColor
        return { client: root.clientWidth, scroll: root.scrollWidth, undersized, clipped, selected, controlCount: controls.length }
      })
      expect(layout.scroll <= layout.client, `Neo ${dark ? "Dark" : "Light"} overview overflows at ${width}px`)
      expect(layout.controlCount > 0 && layout.undersized.length === 0, `Undersized overview targets at ${width}px: ${layout.undersized.join(", ")}`)
      expect(layout.clipped === 0, `Neo hard shadows are clipped at ${width}px`)
      expect(layout.selected === (dark ? "rgb(55, 48, 68)" : "rgb(195, 166, 255)"), "Selected surface must retain its own color")

      if (dark) {
        const pairs = await page.evaluate(() => {
          const probe = document.createElement("span")
          document.body.append(probe)
          const pairs = []
          for (const role of ["border-default", "border-strong"]) {
            probe.style.border = `3px solid var(--${role})`
            for (const background of ["surface-canvas", "surface-panel", "surface-elevated", "surface-subtle", "surface-muted", "accent-soft"]) {
              probe.style.backgroundColor = `var(--${background})`
              const style = getComputedStyle(probe)
              pairs.push({ role, background, foreground: style.borderTopColor, color: style.backgroundColor })
            }
          }
          probe.remove()
          return pairs
        })
        const hex = rgb => `#${rgb.match(/\d+/g).map(channel => Number(channel).toString(16).padStart(2, "0")).join("")}`
        for (const pair of pairs)
          expect(contrastRatio(hex(pair.foreground), hex(pair.color)) >= 3.2, `Compiled ${pair.role}/${pair.background} misses 3.2:1`)
      }

      const input = page.locator(".theme-input")
      await focusByTab(page, input, "overview input", 128)
      const focus = await input.evaluate((element) => {
        const style = getComputedStyle(element)
        return { visible: element.matches(":focus-visible"), outline: style.outline, shadow: style.boxShadow }
      })
      const ring = dark ? "rgb(255, 208, 47)" : "rgb(61, 90, 254)"
      const outer = dark ? "rgb(61, 90, 254)" : "rgb(255, 208, 47)"
      expect(focus.visible && focus.outline === `${ring} solid 2px` && focus.shadow === `${outer} 0px 0px 0px 4px`, `Overview keyboard focus drifted: ${JSON.stringify(focus)}`)

      const artifacts = process.env.THEME_BROWSER_ARTIFACT_DIR
      if (artifacts && dark) {
        mkdirSync(artifacts, { recursive: true })
        async function capture(selector, name) {
          const specimen = page.locator(selector)
          await specimen.evaluate(element => element.scrollIntoView({ block: "center", behavior: "instant" }))
          const box = await specimen.boundingBox()
          expect(box, `Missing screenshot specimen ${selector}`)
          const viewport = page.viewportSize()
          const x = Math.max(0, box.x - 12)
          const y = Math.max(0, box.y - 12)
          // Locator screenshots crop outlines and hard shadows at the border box.
          await page.screenshot({ path: join(artifacts, `neo-dark-${name}.png`), clip: {
            x, y, width: Math.min(viewport.width - x, box.width + 24), height: Math.min(viewport.height - y, box.height + 24),
          } })
        }
        await capture(".theme-field-states", `fields-${width}`)
        if (width === 1280) {
          for (const [name, selector] of [["cards", ".theme-brutal-grid"], ["reading", ".theme-section--reading"], ["states", ".theme-state-grid"]])
            await capture(selector, name)
        }
      }
    }
  }
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
    await assertInteractive(desktopSwitch, "desktop Theme Family switch")
    const navOrder = await page.evaluate(() => {
      const box = selector => document.querySelector(selector)?.getBoundingClientRect()
      const appearance = box(".VPNavBar .appearance")
      const family = box(".VPNavBar .theme-family-control--header")
      const social = box(".VPNavBar .social-links")
      return appearance && family && social
        ? { afterAppearance: family.left >= appearance.right, beforeSocial: family.right <= social.left }
        : null
    })
    expect(navOrder?.afterAppearance && navOrder?.beforeSocial, "Theme Family switch must sit between the appearance toggle and the social links")
    const headerStatusBox = await desktop.locator(".theme-family-control__status").boundingBox()
    expect(headerStatusBox !== null && headerStatusBox.width <= 1 && headerStatusBox.height <= 1, "Header Theme Family status must be visually hidden")
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

    for (const width of [768, 769, 1024]) {
      await page.setViewportSize({ height: 844, width })
      await page.goto(`${origin}/`)
      // Measure only after webfonts settle; fallback-font metrics differ across platforms.
      await page.evaluate(() => document.fonts.ready)
      const viewportWidth = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
      expect(viewportWidth.scroll <= viewportWidth.client, `Homepage must not overflow at ${width}px; received ${viewportWidth.scroll}px content in ${viewportWidth.client}px viewport`)
    }

    // The nav title link must fit the fixed sidebar-width title box; the
    // pinned font size, logo size, and slot padding are the mechanism,
    // this layout invariant is what they protect.
    for (const width of [960, 1280]) {
      await page.setViewportSize({ height: 844, width })
      await page.goto(`${origin}/guide/getting-started`)
      // Measure only after webfonts settle; fallback-font metrics differ across platforms.
      await page.evaluate(() => document.fonts.ready)
      const titleLink = await page.evaluate(() => {
        const link = document.querySelector(".VPNavBarTitle a.title")
        return link === null ? null : { client: link.clientWidth, scroll: link.scrollWidth }
      })
      expect(titleLink !== null, `Nav title link must render at ${width}px`)
      expect(titleLink.scroll <= titleLink.client, `Nav title must fit the fixed title box at ${width}px; scrollWidth ${titleLink.scroll} exceeds clientWidth ${titleLink.client}`)
    }

    await page.setViewportSize({ height: 844, width: 320 })
    await page.goto(`${origin}/tokens/typography`)
    await page.evaluate(() => document.fonts.ready)
    const typographyWidth = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
    expect(typographyWidth.scroll <= typographyWidth.client, `Typography page must not overflow at 320px; received ${typographyWidth.scroll}px content in ${typographyWidth.client}px viewport`)

    await page.goto(`${origin}/tokens/semantic`)
    await page.evaluate(() => {
      document.documentElement.classList.add("dark", "brutal")
    })
    const paperSwatch = page.locator(".token-section").first().locator(".token-card > div").first()
    const paperSwatchColor = await paperSwatch.evaluate(element => getComputedStyle(element).backgroundColor)
    expect(paperSwatchColor === "rgb(250, 248, 244)", `Paper swatch must retain its source color under Dark Neo; received ${paperSwatchColor}`)

    await page.evaluate(() => {
      document.documentElement.classList.remove("dark")
    })
    const inkPreviewColors = await page.locator(".semantic-dark-preview").evaluate((element) => {
      const style = getComputedStyle(element)
      return { background: style.backgroundColor, foreground: style.color }
    })
    expect(inkPreviewColors.background === "rgb(18, 16, 25)", `Ink preview must retain its dark background under Light; received ${inkPreviewColors.background}`)
    expect(inkPreviewColors.foreground === "rgb(247, 241, 230)", `Ink preview text must retain its light foreground under Light; received ${inkPreviewColors.foreground}`)

    await page.goto(`${origin}/tokens/effects`)
    await verifyUnchangedModes(page)
    // Read the rendered role, not the parsed Paper value shown in the label.
    for (const neo of [false, true, false]) {
      await page.evaluate(neo => document.documentElement.classList.toggle("brutal", neo), neo)
      for (const name of ["border-width-surface", "border-width-control"]) {
        const sample = page.locator(".token-card").filter({ has: page.locator(".token-label", { hasText: `--${name}` }) }).locator(".h-12")
        const width = await sample.evaluate(element => getComputedStyle(element).borderTopWidth)
        expect(width === (neo ? "3px" : "1px"), `${name} preview must follow the active family; received ${width}`)
      }
    }

    for (const classes of [[], ["dark"], ["brutal"], ["brutal", "dark"]]) {
      const result = await page.evaluate((classes) => {
        document.documentElement.classList.remove("dark", "brutal")
        document.documentElement.classList.add(...classes)
        const card = document.createElement("div")
        card.style.cssText = "color: var(--text-secondary); box-shadow: var(--shadow-card)"
        const target = document.createElement("button")
        target.className = "touch-target"
        target.textContent = "X"
        const link = document.createElement("a")
        link.className = "touch-target-inline"
        link.style.display = "inline-flex"
        link.textContent = "X"
        document.body.append(card, target, link)
        const shadow = getComputedStyle(card).boxShadow
        card.style.boxShadow = "var(--shadow-panel)"
        const panel = getComputedStyle(card).boxShadow
        card.style.removeProperty("box-shadow")
        card.className = "shadow-hard-md"
        const physical = getComputedStyle(card).boxShadow
        const foreground = getComputedStyle(card).color
        const targetRect = target.getBoundingClientRect()
        const linkRect = link.getBoundingClientRect()
        const result = { shadow, panel, physical, foreground, width: targetRect.width, height: targetRect.height, linkHeight: linkRect.height }
        card.remove()
        target.remove()
        link.remove()
        return result
      }, classes)
      expect(result.width >= 44 && result.height >= 44, `touch-target must render at least 44×44 in ${classes.join(" ") || "Paper"}; received ${result.width}×${result.height}`)
      expect(result.linkHeight >= 44, "touch-target-inline must render at least 44px high with consumer inline-flex layout")
      expect(result.physical === `${result.foreground} 6px 6px 0px 0px`, `Physical hard shadows must retain currentColor in every family; received ${result.physical}`)
      if (classes.includes("brutal")) {
        const depth = classes.includes("dark") ? "rgb(8, 8, 8)" : "rgb(17, 17, 17)"
        expect(result.shadow === `${depth} 6px 6px 0px 0px`, `Semantic card shadow must use family depth independently of text color; received ${result.shadow}`)
        expect(result.panel === `${depth} 8px 8px 0px 0px`, `Semantic panel shadow must use family depth; received ${result.panel}`)
        await verifyPressableStates(page, classes.includes("dark"))
      }
    }

    const transitionDurations = await page.locator(".transition-demo").first().evaluate((element) => {
      const dot = element.querySelector(".transition-demo__dot")
      return {
        container: getComputedStyle(element).transitionDuration,
        dot: getComputedStyle(dot).transitionDuration,
      }
    })
    expect(isZero(transitionDurations.container) && isZero(transitionDurations.dot), "Transition specimens must compute to zero duration under reduced motion")

    await page.setViewportSize({ height: 844, width: 1280 })
    for (const classes of [[], ["dark"], ["brutal"], ["brutal", "dark"]]) {
      await page.goto(`${origin}/utilities/focus-ring`)
      await page.evaluate((classes) => {
        document.documentElement.classList.remove("dark", "brutal")
        document.documentElement.classList.add(...classes)
      }, classes)
      for (const [utility, offset] of [["focus-ring", "2px"], ["focus-ring-inset", "-2px"]]) {
        const button = page.locator(`.theme-action.${utility}`).first()
        await focusByTab(page, button, utility, 64)
        const focus = await button.evaluate((element) => {
          const style = getComputedStyle(element)
          const reference = document.createElement("span")
          reference.style.color = "var(--focus-ring-color)"
          element.append(reference)
          const color = getComputedStyle(reference).color
          reference.remove()
          return { visible: element.matches(":focus-visible"), outline: style.outline, offset: style.outlineOffset, color }
        })
        expect(focus.visible && focus.outline === `${focus.color} solid 2px` && focus.offset === offset,
          `${utility} demo must render its semantic keyboard outline; received ${JSON.stringify(focus)}`)
      }
    }

    await verifyNeoOverview(page, origin)
    console.log(`Neo refinement browser checks passed: 3 unchanged modes × 69 roles; Light/Dark pressable states and media fallbacks; 1280/390/320px overview, border contrast and keyboard focus`)
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
