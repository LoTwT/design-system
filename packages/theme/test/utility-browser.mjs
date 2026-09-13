import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)))

// Compile independent consumers: showcase CSS must not mask package fallbacks.
export async function verifyUtilityComposition(context) {
  const temporary = mkdtempSync(join(tmpdir(), "ayingott-utility-browser-"))
  const page = await context.newPage()
  await page.setViewportSize({ width: 1280, height: 800 })
  page.setDefaultTimeout(10000)
  const failures = []
  async function check(label, callback) {
    try {
      await callback()
    }
    catch (error) {
      failures.push(new Error(label, { cause: error }))
    }
  }
  const state = locator => locator.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      transform: style.transform,
      duration: style.transitionDuration,
      width: style.outlineWidth,
      shadow: style.boxShadow,
      focused: element.matches(":focus-visible"),
    }
  })
  const systemColors = () => page.evaluate(() => {
    const reference = document.createElement("button")
    reference.style.cssText = "outline: 2px solid Highlight; border: 3px solid ButtonText"
    document.body.append(reference)
    const style = getComputedStyle(reference)
    const colors = { outline: style.outlineColor, border: style.borderTopColor }
    reference.remove()
    return colors
  })
  try {
    for (const neo of [false, true]) {
      const input = join(temporary, "input.css")
      const output = join(temporary, "output.css")
      const pressables = ["pressable", "md:pressable", "brutal:pressable", "applied-pressable"]
      const focuses = ["focus-ring", "focus-ring-inset", "md:focus-ring", "applied-focus"]
      writeFileSync(input, `@import "${join(packageDir, "node_modules/tailwindcss/index.css")}" source(none);
@import "${join(packageDir, "src/index.css")}";
${neo ? `@import "${join(packageDir, "src/brutal.css")}";` : ""}
@source inline("${[...focuses, ...(neo ? pressables : [])].join(" ")}");
.applied-focus { @apply focus-ring-inset; }
${neo ? ".applied-pressable { @apply pressable; }" : ""}
`)
      execFileSync("pnpm", ["exec", "tailwindcss", "-i", input, "-o", output], { cwd: packageDir, stdio: "pipe" })
      const css = readFileSync(output, "utf8")
      for (const dark of [false, true]) {
        const mode = `${neo ? "Neo" : "Default"} ${dark ? "Dark" : "Light"}`
        await page.setContent(`<style>${css}</style><body><main></main></body>`)
        await page.evaluate(({ neo, dark }) => {
          document.documentElement.className = [neo && "brutal", dark && "dark"].filter(Boolean).join(" ")
        }, { neo, dark })
        for (const utility of focuses) {
          await page.locator("main").evaluate((element, utility) => {
            element.innerHTML = `<button class="${utility}">Focus</button>`
          }, utility)
          const button = page.locator("button")
          await page.keyboard.press("Tab")
          for (const contrast of ["no-preference", "more"]) {
            await page.emulateMedia({ contrast, reducedMotion: "no-preference", forcedColors: "none" })
            await check(`${mode} ${utility} contrast=${contrast}`, async () => {
              const actual = await state(button)
              assert.equal(actual.focused, true)
              assert.equal(actual.width, contrast === "more" ? "3px" : "2px")
              if (contrast === "more")
                assert.equal(actual.shadow, "none")
              else
                assert.notEqual(actual.shadow, "none")
            })
          }
          await page.emulateMedia({ contrast: "no-preference", forcedColors: "active" })
          await check(`${mode} ${utility} forced colors`, async () => {
            const expected = await systemColors()
            const actual = await button.evaluate(element => ({ outline: getComputedStyle(element).outlineColor, shadow: getComputedStyle(element).boxShadow }))
            assert.equal(actual.outline, expected.outline)
            assert.equal(actual.shadow, "none")
          })
        }
        if (!neo)
          continue
        for (const utility of pressables) {
          await page.locator("main").evaluate((element, utility) => {
            element.innerHTML = `<button class="${utility}" style="margin:80px;padding:20px">Press</button>`
          }, utility)
          const button = page.locator("button")
          for (const reducedMotion of ["no-preference", "reduce"]) {
            await page.emulateMedia({ contrast: "no-preference", reducedMotion, forcedColors: "none" })
            await button.hover()
            for (const active of [false, true]) {
              if (active)
                await page.mouse.down()
              try {
                // The positive case waits for the authored 120ms transition.
                await page.waitForTimeout(180)
                await check(`${mode} ${utility} motion=${reducedMotion} active=${active}`, async () => {
                  const actual = await state(button)
                  const offset = active ? 6 : -2
                  assert.equal(actual.transform, reducedMotion === "reduce" ? "none" : `matrix(1, 0, 0, 1, ${offset}, ${offset})`)
                  assert.ok(actual.duration.split(",").every(value => Number.parseFloat(value) === (reducedMotion === "reduce" ? 0 : 0.12)), actual.duration)
                })
              }
              finally {
                if (active)
                  await page.mouse.up()
              }
            }
          }
          await page.emulateMedia({ forcedColors: "active" })
          await button.evaluate(element => {
            element.style.borderStyle = "solid"
            element.style.borderWidth = "3px"
          })
          await check(`${mode} ${utility} forced colors`, async () => {
            const expected = await systemColors()
            const actual = await button.evaluate(element => ({ border: getComputedStyle(element).borderTopColor, shadow: getComputedStyle(element).boxShadow }))
            assert.equal(actual.border, expected.border)
            assert.equal(actual.shadow, "none")
          })
          await page.emulateMedia({ forcedColors: "none", reducedMotion: "no-preference" })
          await page.evaluate(() => document.documentElement.classList.remove("brutal"))
          await check(`${mode} ${utility} without family`, async () => {
            const actual = await state(button)
            assert.equal(actual.transform, "none")
            assert.equal(actual.duration, "0s")
            assert.equal(actual.shadow, "none")
          })
          await page.evaluate(() => document.documentElement.classList.add("brutal"))
        }
      }
    }
    if (failures.length)
      throw new AggregateError(failures, `${failures.length} utility composition checks failed`)
    console.log("package utility browser contract passed: four themes, contrast preferences, pressable variants and @apply")
  }
  finally {
    await page.close()
    rmSync(temporary, { recursive: true, force: true })
  }
}
