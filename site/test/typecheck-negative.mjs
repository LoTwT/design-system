import { spawnSync } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
const config = join("site", "test", "tsconfig.invalid-css-import.json")
const result = spawnSync("pnpm", ["exec", "vue-tsc", "--noEmit", "-p", config], {
  cwd: rootDir,
  encoding: "utf8",
})
const output = `${result.stdout ?? ""}${result.stderr ?? ""}`

if (result.error)
  throw result.error
if (result.status === 0)
  throw new Error("CSS default-import fixture did not fail closed")
const rejectsStringUse = output.includes("has no default export")
  || (output.includes("Property 'trim' does not exist") && output.includes("import(\"*.css\")"))
if (!output.includes("invalid-css-default-import.ts") || !rejectsStringUse)
  throw new Error(`CSS default-import fixture failed for an unexpected reason:\n${output}`)

console.log("site CSS import negative typecheck passed")
