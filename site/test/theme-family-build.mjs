import { spawn } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs"
import { createServer } from "node:http"
import { dirname, extname, join, relative } from "node:path"
import { tmpdir } from "node:os"
import { setTimeout as delay } from "node:timers/promises"
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

const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"))?.[1]

function chromeBinary() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  ]
  const binary = candidates.find(candidate => candidate && existsSync(candidate))
  expect(binary, "A Chrome/Chromium binary is required for the generated behavior gate")
  return binary
}

function launchChrome(profile) {
  const browserProcess = spawn(chromeBinary(), [
    "--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--remote-debugging-port=0",
    `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] })
  return new Promise((resolve, reject) => {
    let log = ""
    const timer = setTimeout(() => reject(new Error(`Chrome did not expose DevTools: ${log.slice(-1000)}`)), 10000)
    browserProcess.stderr.on("data", (chunk) => {
      log += chunk
      const url = log.match(/DevTools listening on (ws:\/\/\S+)/)?.[1]
      if (url) {
        clearTimeout(timer)
        resolve({ process: browserProcess, url })
      }
    })
    browserProcess.once("exit", code => reject(new Error(`Chrome exited before DevTools was ready (${code}): ${log.slice(-1000)}`)))
  })
}

async function connectCdp(url) {
  const socket = new WebSocket(url)
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true })
    socket.addEventListener("error", reject, { once: true })
  })
  let nextId = 0
  const pending = new Map()
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data)
    if (!message.id)
      return
    const request = pending.get(message.id)
    pending.delete(message.id)
    if (message.error)
      request.reject(new Error(message.error.message))
    else
      request.resolve(message.result)
  })
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++nextId
    pending.set(id, { reject, resolve })
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
  })
  return { send, socket }
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

async function verifyBrowserBehavior() {
  const profile = mkdtempSync(join(tmpdir(), "theme-family-chrome-"))
  const server = staticServer()
  let chrome
  let socket
  try {
    await new Promise((resolve, reject) => server.listen(0, "127.0.0.1").once("listening", resolve).once("error", reject))
    chrome = await launchChrome(profile)
    const cdp = await connectCdp(chrome.url)
    socket = cdp.socket
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" })
    const { sessionId } = await cdp.send("Target.attachToTarget", { flatten: true, targetId })
    await cdp.send("Emulation.setDeviceMetricsOverride", { deviceScaleFactor: 1, height: 844, mobile: false, width: 390 }, sessionId)
    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }, { name: "prefers-reduced-motion", value: "reduce" }] }, sessionId)
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${server.address().port}/` }, sessionId)
    for (let attempt = 0; attempt < 100; attempt++) {
      const ready = await cdp.send("Runtime.evaluate", { expression: "document.readyState === 'complete' && !!document.querySelector('.VPNavBarHamburger') && !!document.querySelector('.theme-family-control--header.is-ready')", returnByValue: true }, sessionId)
      if (ready.result.value)
        break
      await delay(50)
      expect(attempt < 99, "Generated page did not become browser-ready")
    }
    const beforeMobile = await cdp.send("Runtime.evaluate", { expression: "const light = !document.documentElement.classList.contains('dark'); document.querySelector('.VPNavBarHamburger').click(); light", returnByValue: true }, sessionId)
    expect(beforeMobile.result.value, "Mounted Header Theme Family control must preserve Light scheme")
    for (let attempt = 0; attempt < 100; attempt++) {
      const mounted = await cdp.send("Runtime.evaluate", { expression: "!!document.querySelector('.theme-family-control--screen.is-ready')", returnByValue: true }, sessionId)
      if (mounted.result.value)
        break
      await delay(50)
      expect(attempt < 99, "Generated mobile Theme Family interface did not mount")
    }
    const evaluated = await cdp.send("Runtime.evaluate", { expression: `(() => {
      const control = document.querySelector('.theme-family-control--screen')
      const button = control?.querySelector('.theme-family-switch')
      const thumb = control?.querySelector('.theme-family-switch__thumb')
      if (!control || !button || !thumb) return null
      const lightBeforeFamily = !document.documentElement.classList.contains('dark')
      button.click()
      const lightAfterFamily = !document.documentElement.classList.contains('dark') && document.documentElement.classList.contains('brutal') && document.documentElement.dataset.themeFamily === 'neo'
      document.documentElement.classList.add('dark'); button.click()
      const darkAfterFamily = document.documentElement.classList.contains('dark') && !document.documentElement.classList.contains('brutal') && document.documentElement.dataset.themeFamily === 'default'
      const read = () => getComputedStyle(thumb).transitionDuration
      document.documentElement.classList.remove('dark'); const lightDuration = read()
      document.documentElement.classList.add('dark'); const darkDuration = read()
      button.focus()
      return { darkAfterFamily, darkDuration, lightAfterFamily, lightBeforeFamily, lightDuration, order: getComputedStyle(control).order,
        display: getComputedStyle(control).display, width: getComputedStyle(button).width,
        height: getComputedStyle(button).height, outline: getComputedStyle(button).outline }
    })()`, returnByValue: true }, sessionId)
    const result = evaluated.result.value
    expect(result, "Generated mobile Theme Family interface must mount in Chrome")
    expect(result.lightBeforeFamily && result.lightAfterFamily && result.darkAfterFamily, "Mounted Theme Family path must preserve Light and Dark schemes")
    const isZero = value => value.split(",").every(duration => Number.parseFloat(duration) === 0)
    expect(isZero(result.lightDuration) && isZero(result.darkDuration), "Theme Family thumb must compute to zero transition duration under reduced motion")
    expect(result.order === "4", "Mobile Theme Family control must compute to final order 4")
    expect(result.display === "grid" && result.width === "44px" && result.height === "44px", "Mobile Theme Family control must keep its rendered placement and 44px target")
    expect(result.outline.includes("solid 2px"), "Theme Family switch must keep a rendered focus outline")
  }
  finally {
    socket?.close()
    chrome?.process.kill()
    if (chrome)
      await Promise.race([new Promise(resolve => chrome.process.once("exit", resolve)), delay(1000)])
    await new Promise(resolve => server.close(resolve))
    rmSync(profile, { force: true, recursive: true })
  }
}

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
expect(generatedFiles.length > 0, "Site build must emit HTML")
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

}
expect(renderedInterfaces > 0, "Generated pages must render the Theme Family interface")
await verifyBrowserBehavior()

console.log("site Theme Family build contract passed")
