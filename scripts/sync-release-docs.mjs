import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const [version, root = process.cwd()] = process.argv.slice(2)

if (!version)
  throw new Error("Usage: node scripts/sync-release-docs.mjs <version> [root]")

if (version === "0.1.0" || version.includes("-"))
  process.exit(0)

const updates = {
  "site/index.md": [
    ["text: Paper & Ink defaults with an upcoming opt-in Neo-Brutal family on one semantic API.", "text: Paper & Ink defaults with opt-in Neo-Brutal Light and Dark on one semantic API."],
    ["> [!IMPORTANT]\n> This site follows the current `main` branch. Neo-Brutalism and the `brutal.css` entry are not included in npm `latest` (`0.1.0`) yet.\n\n", ""],
  ],
  "site/guide/getting-started.md": [
    ["> [!IMPORTANT]\n> The Neo-Brutal family is available on the current `main` branch but is not included in npm `latest` (`0.1.0`) yet. The import below will work after a release that publishes the `brutal.css` export.\n\n", ""],
  ],
  "site/guide/package-contract.md": [
    ["> [!IMPORTANT]\n> This page describes the current `main` branch. npm `latest` is `0.1.0` and does not include the `./brutal.css` export yet.\n\n", ""],
    ["`@ayingott/theme` on `main` exposes five public entries:", "`@ayingott/theme` exposes five public entries:"],
  ],
}

for (const [file, replacements] of Object.entries(updates)) {
  const path = resolve(root, file)
  let source = readFileSync(path, "utf8")

  const hasAllReleaseCopy = replacements.every(([, released]) => released === "" || source.includes(released))
  const hasAnyPreReleaseCopy = replacements.some(([preRelease]) => source.includes(preRelease))

  if (hasAllReleaseCopy && !hasAnyPreReleaseCopy)
    continue

  for (const [from, to] of replacements) {
    if (!source.includes(from))
      throw new Error(`${file} is missing the expected pre-release documentation fragment`)
    source = source.replace(from, to)
  }

  writeFileSync(path, source)
}
