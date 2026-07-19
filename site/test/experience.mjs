import { createHash } from "node:crypto"
import { readFileSync, readdirSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { runInNewContext } from "node:vm"
import postcss from "postcss"
import ts from "typescript"

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))))

function readSource(file) {
  return readFileSync(join(rootDir, file), "utf8")
}

function expectSourceIncludes(file, fragments) {
  const source = readSource(file)
  for (const fragment of fragments)
    expect(source.includes(fragment), `${file} must include: ${fragment}`)
  return source
}

function expect(condition, message) {
  if (!condition)
    throw new Error(message)
}

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node))
    return node.text
  throw new Error(`Unsupported config property name: ${node.getText()}`)
}

function property(object, name) {
  const matches = object.properties.filter(node =>
    ts.isPropertyAssignment(node) && propertyName(node.name) === name,
  )
  expect(matches.length === 1, `Expected exactly one config property: ${name}`)
  return matches[0].initializer
}

function optionalProperty(object, name) {
  const matches = object.properties.filter(node =>
    ts.isPropertyAssignment(node) && propertyName(node.name) === name,
  )
  expect(matches.length <= 1, `Duplicate config property: ${name}`)
  return matches[0]?.initializer
}

function objectValue(node, label) {
  expect(ts.isObjectLiteralExpression(node), `${label} must be an object literal`)
  return node
}

function arrayValue(node, label) {
  expect(ts.isArrayLiteralExpression(node), `${label} must be an array literal`)
  return node
}

function stringValue(node, label) {
  expect(ts.isStringLiteral(node), `${label} must be a string literal`)
  return node.text
}

function readConfig() {
  const file = "site/.vitepress/config.ts"
  const source = readSource(file)
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  expect(sourceFile.parseDiagnostics.length === 0, `${file} has TypeScript parse errors`)

  const exports = sourceFile.statements.filter(ts.isExportAssignment)
  expect(exports.length === 1, `${file} must have exactly one default export`)
  const call = exports[0].expression
  expect(ts.isCallExpression(call), `${file} default export must call defineConfig`)
  expect(ts.isIdentifier(call.expression) && call.expression.text === "defineConfig", `${file} must call defineConfig directly`)
  expect(call.arguments.length === 1, "defineConfig must receive exactly one argument")
  return objectValue(call.arguments[0], "defineConfig argument")
}

function readDeclarations(rule) {
  const declarations = new Map()
  for (const node of rule.nodes ?? []) {
    if (node.type === "comment")
      continue
    expect(node.type === "decl", `Unsupported nested CSS in ${rule.selector}: ${node.toString()}`)
    expect(!declarations.has(node.prop), `Duplicate ${node.prop} in ${rule.selector}`)
    declarations.set(node.prop, { value: node.value.trim(), important: Boolean(node.important) })
  }
  return declarations
}

function selectorSet(rule) {
  return new Set(rule.selectors.map(selector => selector.trim()))
}

function sameSet(actual, expected) {
  return actual.size === expected.size && [...expected].every(value => actual.has(value))
}

function findRule(container, selectors, label) {
  const expected = new Set(selectors)
  const matches = (container.nodes ?? []).filter(node =>
    node.type === "rule" && sameSet(selectorSet(node), expected),
  )
  expect(matches.length === 1, `Expected exactly one CSS rule for ${label}`)
  return matches[0]
}

function expectDeclaration(declarations, property, value, important = false) {
  const actual = declarations.get(property)
  expect(actual !== undefined, `Missing CSS declaration ${property}`)
  expect(actual.value === value, `Expected ${property}: ${value}; received ${actual.value}`)
  expect(actual.important === important, `Expected ${property} important=${important}`)
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

function verifyTouchTargetMinimum(source, file) {
  const css = postcss.parse(source, { from: file })
  const roots = css.nodes.filter(node => node.type === "rule" && sameSet(selectorSet(node), new Set([":root"])))
  const minimums = roots.flatMap((rule) => {
    const declaration = readDeclarations(rule).get("--touch-target-min")
    return declaration === undefined ? [] : [declaration]
  })
  expect(minimums.length === 1, `Expected exactly one CSS declaration --touch-target-min in ${file}`)
  expect(minimums[0].value === "2.75rem", `Expected --touch-target-min: 2.75rem; received ${minimums[0].value}`)
  expect(minimums[0].important === false, "Expected --touch-target-min important=false")
}

const reducedMotionSelectors = [
  ".VPSwitch.VPSwitchAppearance",
  ".VPSwitch.VPSwitchAppearance .check",
  ".dark .VPSwitch.VPSwitchAppearance .icon .sun",
  ".dark .VPSwitch.VPSwitchAppearance .icon .moon",
]

function verifyReducedAppearanceMotion(source, file) {
  const css = postcss.parse(source, { from: file })
  const reducedMotion = css.nodes.filter(node =>
    node.type === "atrule"
    && node.name === "media"
    && node.params === "(prefers-reduced-motion: reduce)",
  )
  expect(reducedMotion.length === 1, `Expected exactly one reduced-motion media query in ${file}`)
  const motion = readDeclarations(findRule(
    reducedMotion[0],
    reducedMotionSelectors,
    "reduced appearance motion",
  ))
  expectDeclaration(motion, "transition-duration", "0s", true)
}

const classListMutators = new Set(["add", "remove", "replace", "toggle"])
const assignmentOperators = new Set([
  ts.SyntaxKind.EqualsToken,
  ts.SyntaxKind.PlusEqualsToken,
  ts.SyntaxKind.MinusEqualsToken,
  ts.SyntaxKind.AsteriskEqualsToken,
  ts.SyntaxKind.AsteriskAsteriskEqualsToken,
  ts.SyntaxKind.SlashEqualsToken,
  ts.SyntaxKind.PercentEqualsToken,
  ts.SyntaxKind.LessThanLessThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
  ts.SyntaxKind.AmpersandEqualsToken,
  ts.SyntaxKind.BarEqualsToken,
  ts.SyntaxKind.CaretEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken,
])

function unwrapExpression(node) {
  let current = node
  while (
    ts.isParenthesizedExpression(current)
    || ts.isAsExpression(current)
    || ts.isTypeAssertionExpression(current)
    || ts.isNonNullExpression(current)
    || ts.isSatisfiesExpression(current)
  )
    current = current.expression
  return current
}

function staticString(node, constants) {
  const value = unwrapExpression(node)
  if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value))
    return value.text
  if (ts.isIdentifier(value))
    return constants.get(value.text)
  if (
    ts.isBinaryExpression(value)
    && value.operatorToken.kind === ts.SyntaxKind.PlusToken
  ) {
    const left = staticString(value.left, constants)
    const right = staticString(value.right, constants)
    if (left !== undefined && right !== undefined)
      return left + right
  }
}

function memberName(node, constants = new Map()) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node))
    return node.text
  if (ts.isComputedPropertyName(node))
    return staticString(node.expression, constants)
  if (ts.isPropertyAccessExpression(node))
    return node.name.text
  if (ts.isElementAccessExpression(node) && node.argumentExpression !== undefined)
    return staticString(node.argumentExpression, constants)
}

function isNamedMember(node, name, constants = new Map()) {
  return (
    (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node))
    && memberName(node, constants) === name
  )
}

function readClassListMutations(source, file) {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  expect(sourceFile.parseDiagnostics.length === 0, `${file} has TypeScript parse errors`)
  const variableCandidates = []
  const objectBindingCandidates = []
  const constants = new Map()
  const documentAliases = new Set(["document"])
  const rootAliases = new Set()
  const classListAliases = new Set()
  const mutatorFunctionAliases = new Map()
  const mutations = []
  const directRootExpressions = []
  const rootWrites = []
  const rootCalls = []

  function collectCandidates(node) {
    if (
      ts.isVariableDeclaration(node)
      && ts.isIdentifier(node.name)
      && node.initializer !== undefined
    )
      variableCandidates.push({ name: node.name.text, value: node.initializer })

    if (
      ts.isBinaryExpression(node)
      && node.operatorToken.kind === ts.SyntaxKind.EqualsToken
      && ts.isIdentifier(node.left)
    )
      variableCandidates.push({ name: node.left.text, value: node.right })

    if (
      ts.isVariableDeclaration(node)
      && ts.isObjectBindingPattern(node.name)
      && node.initializer !== undefined
    )
      objectBindingCandidates.push(node)

    ts.forEachChild(node, collectCandidates)
  }

  collectCandidates(sourceFile)

  let changed = true
  while (changed) {
    changed = false
    for (const candidate of variableCandidates) {
      if (!constants.has(candidate.name)) {
        const value = staticString(candidate.value, constants)
        if (value !== undefined) {
          constants.set(candidate.name, value)
          changed = true
        }
      }
    }
  }

  function isDocumentExpression(node) {
    const value = unwrapExpression(node)
    return (
      (ts.isIdentifier(value) && documentAliases.has(value.text))
      || (
        isNamedMember(value, "document", constants)
        && ts.isIdentifier(value.expression)
        && ["globalThis", "self", "window"].includes(value.expression.text)
      )
    )
  }

  function isRootExpression(node) {
    const value = unwrapExpression(node)
    return (
      (ts.isIdentifier(value) && rootAliases.has(value.text))
      || (
        isNamedMember(value, "documentElement", constants)
        && isDocumentExpression(value.expression)
      )
    )
  }

  changed = true
  while (changed) {
    changed = false
    for (const candidate of variableCandidates) {
      if (!documentAliases.has(candidate.name) && isDocumentExpression(candidate.value)) {
        documentAliases.add(candidate.name)
        changed = true
      }
      if (!rootAliases.has(candidate.name) && isRootExpression(candidate.value)) {
        rootAliases.add(candidate.name)
        changed = true
      }
    }
    for (const declaration of objectBindingCandidates) {
      if (!isDocumentExpression(declaration.initializer))
        continue
      for (const element of declaration.name.elements) {
        const name = memberName(element.propertyName ?? element.name, constants)
        if (
          name === "documentElement"
          && !element.dotDotDotToken
          && ts.isIdentifier(element.name)
          && !rootAliases.has(element.name.text)
        ) {
          rootAliases.add(element.name.text)
          changed = true
        }
      }
    }
  }

  changed = true
  while (changed) {
    changed = false
    for (const candidate of variableCandidates) {
      if (mutatorFunctionAliases.has(candidate.name))
        continue
      const value = unwrapExpression(candidate.value)
      const method = (
        ts.isPropertyAccessExpression(value) || ts.isElementAccessExpression(value)
      )
        ? memberName(value, constants)
        : ts.isIdentifier(value)
          ? mutatorFunctionAliases.get(value.text)
          : undefined
      if (classListMutators.has(method)) {
        mutatorFunctionAliases.set(candidate.name, method)
        changed = true
      }
    }
  }

  function isClassListExpression(node) {
    const value = unwrapExpression(node)
    return (
      (ts.isIdentifier(value) && classListAliases.has(value.text))
      || (
        isNamedMember(value, "classList", constants)
        && isRootExpression(value.expression)
      )
    )
  }

  function rootMemberPath(node) {
    const value = unwrapExpression(node)
    if (isRootExpression(value))
      return []
    if (ts.isPropertyAccessExpression(value) || ts.isElementAccessExpression(value)) {
      const parentPath = rootMemberPath(value.expression)
      const name = memberName(value, constants)
      if (parentPath !== undefined && name !== undefined)
        return [...parentPath, name]
    }
  }

  changed = true
  while (changed) {
    changed = false
    for (const candidate of variableCandidates) {
      if (!classListAliases.has(candidate.name) && isClassListExpression(candidate.value)) {
        classListAliases.add(candidate.name)
        changed = true
      }
    }
  }

  for (const declaration of objectBindingCandidates) {
    if (isRootExpression(declaration.initializer)) {
      for (const element of declaration.name.elements) {
        const name = memberName(element.propertyName ?? element.name, constants)
        if (name === "classList" && ts.isIdentifier(element.name))
          classListAliases.add(element.name.text)
      }
    }
    if (isClassListExpression(declaration.initializer)) {
      for (const element of declaration.name.elements) {
        const method = memberName(element.propertyName ?? element.name, constants)
        if (classListMutators.has(method)) {
          mutations.push({
            arguments: [],
            directCall: false,
            method,
            receiver: declaration.initializer.getText(sourceFile),
          })
        }
      }
    }
  }

  changed = true
  while (changed) {
    changed = false
    for (const candidate of variableCandidates) {
      if (!classListAliases.has(candidate.name) && isClassListExpression(candidate.value)) {
        classListAliases.add(candidate.name)
        changed = true
      }
    }
  }

  function collectEffects(node) {
    if (
      (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node))
      && isNamedMember(node, "documentElement", constants)
      && isDocumentExpression(node.expression)
    )
      directRootExpressions.push(node.getText(sourceFile))

    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      const method = memberName(node, constants)
      const receiver = node.expression
      if (isClassListExpression(receiver) && (method === undefined || classListMutators.has(method))) {
        const directCall = ts.isCallExpression(node.parent) && node.parent.expression === node
        const classListValue = unwrapExpression(receiver)
        mutations.push({
          arguments: directCall ? node.parent.arguments : [],
          directCall,
          method: method ?? "<computed>",
          receiver: (
            (ts.isPropertyAccessExpression(classListValue) || ts.isElementAccessExpression(classListValue))
            && isRootExpression(classListValue.expression)
          )
            ? classListValue.expression.getText(sourceFile)
            : classListValue.getText(sourceFile),
        })
      }
    }

    if (
      ts.isBinaryExpression(node)
      && assignmentOperators.has(node.operatorToken.kind)
      && (ts.isPropertyAccessExpression(node.left) || ts.isElementAccessExpression(node.left))
    ) {
      const path = rootMemberPath(node.left)
      if (path !== undefined) {
        rootWrites.push({
          operator: node.operatorToken.kind,
          path,
          right: node.right,
        })
      }
    }

    if (
      ts.isCallExpression(node)
      && (ts.isPropertyAccessExpression(node.expression) || ts.isElementAccessExpression(node.expression))
      && isRootExpression(node.expression.expression)
    )
      rootCalls.push(node.getText(sourceFile))

    if (
      ts.isCallExpression(node)
      && (ts.isPropertyAccessExpression(node.expression) || ts.isElementAccessExpression(node.expression))
    ) {
      const invocation = memberName(node.expression, constants)
      const target = unwrapExpression(node.expression.expression)
      const method = (
        ts.isPropertyAccessExpression(target) || ts.isElementAccessExpression(target)
      )
        ? memberName(target, constants)
        : ts.isIdentifier(target)
          ? mutatorFunctionAliases.get(target.text)
          : undefined
      if (
        ["apply", "bind", "call"].includes(invocation)
        && classListMutators.has(method)
        && node.arguments[0] !== undefined
        && isClassListExpression(node.arguments[0])
      ) {
        mutations.push({
          arguments: [],
          directCall: false,
          method,
          receiver: node.arguments[0].getText(sourceFile),
        })
      }

      if (
        invocation === "apply"
        && ts.isIdentifier(node.expression.expression)
        && node.expression.expression.text === "Reflect"
        && node.arguments[0] !== undefined
        && node.arguments[1] !== undefined
        && isClassListExpression(node.arguments[1])
      ) {
        const reflectTarget = unwrapExpression(node.arguments[0])
        const reflectMethod = (
          ts.isPropertyAccessExpression(reflectTarget) || ts.isElementAccessExpression(reflectTarget)
        )
          ? memberName(reflectTarget, constants)
          : ts.isIdentifier(reflectTarget)
            ? mutatorFunctionAliases.get(reflectTarget.text)
            : undefined
        if (classListMutators.has(reflectMethod)) {
          mutations.push({
            arguments: [],
            directCall: false,
            method: reflectMethod,
            receiver: node.arguments[1].getText(sourceFile),
          })
        }
      }
    }

    ts.forEachChild(node, collectEffects)
  }

  collectEffects(sourceFile)
  return {
    aliases: classListAliases,
    directRootExpressions,
    documentAliases,
    mutations,
    rootAliases,
    rootCalls,
    rootWrites,
  }
}

function verifyThemeFamilyClassMutation(source, file, expected) {
  const { aliases, mutations, rootCalls, rootWrites } = readClassListMutations(source, file)
  expect(aliases.size === 0, `${file} must not alias classList`)
  expect(rootCalls.length === 0, `${file} must not call methods directly on the theme root`)
  expect(rootWrites.length === 1, `${file} must contain exactly one canonical root metadata write`)
  expect(
    rootWrites[0].operator === ts.SyntaxKind.EqualsToken
    && rootWrites[0].path.length === 2
    && rootWrites[0].path[0] === "dataset"
    && rootWrites[0].path[1] === "themeFamily"
    && ts.isIdentifier(rootWrites[0].right)
    && rootWrites[0].right.text === "family",
    `${file} root write must be exactly root.dataset.themeFamily = family`,
  )
  expect(mutations.length === 1, `${file} must contain exactly one classList mutation`)

  const mutation = mutations[0]
  expect(mutation.directCall, `${file} classList mutator must be called directly`)
  expect(mutation.method === "toggle", `${file} classList mutation must use toggle`)
  expect(mutation.receiver === "root", `${file} classList mutation must target root`)
  expect(mutation.arguments.length === 2, `${file} family toggle must receive class and force arguments`)

  const [classArgument, forceArgument] = mutation.arguments
  if (expected.classIdentifier !== undefined) {
    expect(
      ts.isIdentifier(classArgument) && classArgument.text === expected.classIdentifier,
      `${file} family toggle must use ${expected.classIdentifier}`,
    )
  }
  else {
    expect(
      ts.isStringLiteral(classArgument) && classArgument.text === expected.className,
      `${file} family toggle must use the ${expected.className} class literal`,
    )
  }

  expect(ts.isBinaryExpression(forceArgument), `${file} family toggle force must be a strict equality`)
  expect(
    forceArgument.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken,
    `${file} family toggle force must use strict equality`,
  )
  expect(
    ts.isIdentifier(forceArgument.left) && forceArgument.left.text === "family",
    `${file} family toggle force must read family`,
  )

  if (expected.stateIdentifier !== undefined) {
    expect(
      ts.isIdentifier(forceArgument.right) && forceArgument.right.text === expected.stateIdentifier,
      `${file} family toggle force must use ${expected.stateIdentifier}`,
    )
  }
  else {
    expect(
      ts.isStringLiteral(forceArgument.right) && forceArgument.right.text === expected.state,
      `${file} family toggle force must use the ${expected.state} state literal`,
    )
  }
}

function verifyThemeFamilyRootBoundary(source, file) {
  const {
    aliases,
    directRootExpressions,
    documentAliases,
    mutations,
    rootAliases,
    rootCalls,
    rootWrites,
  } = readClassListMutations(source, file)
  expect(documentAliases.size === 1, `${file} must not alias document`)
  expect(rootAliases.size === 0, `${file} must not alias the theme root`)
  expect(aliases.size === 0, `${file} must not alias classList`)
  expect(directRootExpressions.length === 2, `${file} must keep exactly two reviewed theme-root reads`)
  expect(mutations.length === 0, `${file} must delegate all classList mutations to the pure root adapter`)
  expect(rootWrites.length === 0, `${file} must delegate all root writes to the pure root adapter`)
  expect(rootCalls.length === 0, `${file} must not call methods directly on the theme root`)
}

function instrumentThemeRoot() {
  const effects = []
  const classList = new Proxy({}, {
    get(_target, property) {
      return (...args) => {
        effects.push(`classList.${String(property)}(${args.map(String).join(",")})`)
        return property === "toggle" ? Boolean(args[1]) : undefined
      }
    },
    set(_target, property, value) {
      effects.push(`classList.${String(property)}=${String(value)}`)
      return true
    },
  })
  const dataset = new Proxy({}, {
    get(_target, property) {
      effects.push(`dataset.${String(property)}:read`)
    },
    set(_target, property, value) {
      effects.push(`dataset.${String(property)}=${String(value)}`)
      return true
    },
  })
  const root = new Proxy({}, {
    defineProperty(_target, property) {
      effects.push(`root.${String(property)}:define`)
      return true
    },
    deleteProperty(_target, property) {
      effects.push(`root.${String(property)}:delete`)
      return true
    },
    get(_target, property) {
      if (property === "classList")
        return classList
      if (property === "dataset")
        return dataset
      return (...args) => {
        effects.push(`root.${String(property)}(${args.map(String).join(",")})`)
      }
    },
    set(_target, property, value) {
      effects.push(`root.${String(property)}=${String(value)}`)
      return true
    },
  })
  return { effects, root }
}

function verifyThemeFamilyRootEffects(applyThemeFamilyToRoot, file) {
  expect(typeof applyThemeFamilyToRoot === "function", `${file} must export applyThemeFamilyToRoot`)
  for (const family of ["default", "neo"]) {
    const { effects, root } = instrumentThemeRoot()

    applyThemeFamilyToRoot(root, family)
    const expected = [
      `classList.toggle(brutal,${family === "neo"})`,
      `dataset.themeFamily=${family}`,
    ]
    expect(
      JSON.stringify(effects) === JSON.stringify(expected),
      `${file} ${family} root effects must be exactly ${expected.join(" then ")}`,
    )
  }
}

function verifyThemeFamilyInitEffects(script, file) {
  for (const [savedFamily, expectedFamily] of [[null, "default"], ["neo", "neo"], ["unexpected", "default"]]) {
    const { effects, root } = instrumentThemeRoot()
    const storageEffects = []
    const localStorage = new Proxy({}, {
      get(_target, property) {
        return (...args) => {
          storageEffects.push(`localStorage.${String(property)}(${args.map(String).join(",")})`)
          return property === "getItem" ? savedFamily : undefined
        }
      },
    })
    runInNewContext(script, { document: { documentElement: root }, localStorage }, { filename: file, timeout: 100 })
    const expectedEffects = [
      `classList.toggle(brutal,${expectedFamily === "neo"})`,
      `dataset.themeFamily=${expectedFamily}`,
    ]
    expect(
      JSON.stringify(storageEffects) === JSON.stringify(["localStorage.getItem(ayingott:theme-family)"]),
      `${file} must read exactly the reviewed Theme Family storage key`,
    )
    expect(
      JSON.stringify(effects) === JSON.stringify(expectedEffects),
      `${file} ${String(savedFamily)} root effects must be exactly ${expectedEffects.join(" then ")}`,
    )
  }

  const { effects, root } = instrumentThemeRoot()
  runInNewContext(script, {
    document: { documentElement: root },
    localStorage: { getItem: () => { throw new Error("blocked") } },
  }, { filename: file, timeout: 100 })
  expect(
    JSON.stringify(effects) === JSON.stringify([
      "classList.toggle(brutal,false)",
      "dataset.themeFamily=default",
    ]),
    `${file} blocked storage must fall back to exactly the default root effects`,
  )
}

function evaluateStaticModule(source, file) {
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: file,
    reportDiagnostics: true,
  })
  expect((result.diagnostics ?? []).length === 0, `${file} static module transpile failed`)

  const context = { exports: {} }
  runInNewContext(result.outputText, context, { filename: file, timeout: 100 })
  return context.exports
}

function readScopedStyle(source, file) {
  const matches = [...source.matchAll(/<style scoped>\s*([\s\S]*?)<\/style>/g)]
  expect(matches.length === 1, `${file} must contain exactly one scoped style block`)
  return matches[0][1]
}

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? listFiles(path) : [path]
  })
}

function vueBlocks(source, tag) {
  const blocks = []
  const pattern = new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)<\\/${tag}>`, "gi")
  for (const match of source.matchAll(pattern))
    blocks.push({ attributes: match[1], source: match[2] })
  return blocks
}

function cssModuleImports(source, file) {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  expect(sourceFile.parseDiagnostics.length === 0, `${file} has TypeScript parse errors`)
  const imports = []

  function collect(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
      && node.moduleSpecifier !== undefined
      && ts.isStringLiteral(node.moduleSpecifier)
      && node.moduleSpecifier.text.endsWith(".css")
    )
      imports.push(node.moduleSpecifier.text)

    if (
      ts.isCallExpression(node)
      && (
        node.expression.kind === ts.SyntaxKind.ImportKeyword
        || (ts.isIdentifier(node.expression) && node.expression.text === "require")
        || (
          (ts.isPropertyAccessExpression(node.expression) || ts.isElementAccessExpression(node.expression))
          && memberName(node.expression) === "glob"
        )
      )
      && node.arguments.length >= 1
      && ts.isStringLiteral(node.arguments[0])
      && node.arguments[0].text.endsWith(".css")
    )
      imports.push(node.arguments[0].text)

    ts.forEachChild(node, collect)
  }

  collect(sourceFile)
  return imports
}

function readThemeAuthorStyles() {
  const vitePressDirectory = join(rootDir, "site/.vitepress")
  const files = listFiles(vitePressDirectory).filter((file) => {
    const relativeFile = relative(rootDir, file)
    return !relativeFile.startsWith("site/.vitepress/cache/")
      && !relativeFile.startsWith("site/.vitepress/dist/")
  })
  const localCssFiles = files
    .filter(file => file.endsWith(".css"))
    .map(file => relative(rootDir, file))
    .sort()
  expect(
    localCssFiles.length === 1 && localCssFiles[0] === "site/.vitepress/theme/style.css",
    "Theme author CSS must keep exactly one reviewed local stylesheet",
  )

  const moduleImports = []
  const styles = []
  for (const absoluteFile of files) {
    const file = relative(rootDir, absoluteFile)
    const source = readFileSync(absoluteFile, "utf8")
    if (/\.(?:[cm]?[jt]s)$/.test(file)) {
      for (const specifier of cssModuleImports(source, file))
        moduleImports.push({ file, specifier })
    }
    if (file.endsWith(".vue")) {
      for (const [index, block] of vueBlocks(source, "script").entries()) {
        for (const specifier of cssModuleImports(block.source, `${file}#script[${index + 1}]`))
          moduleImports.push({ file, specifier })
      }
      for (const [index, block] of vueBlocks(source, "style").entries()) {
        expect(!/\bsrc\s*=/.test(block.attributes), `${file} style blocks must not use external src`)
        expect(!/\blang\s*=/.test(block.attributes), `${file} style blocks must use plain CSS`)
        styles.push({ file: `${file}#style[${index + 1}]`, source: block.source })
      }
    }
    if (file.endsWith(".css"))
      styles.push({ file, source })
  }

  expect(
    moduleImports.length === 1
    && moduleImports[0].file === "site/.vitepress/theme/index.ts"
    && moduleImports[0].specifier === "./style.css",
    "Theme scripts must import exactly the reviewed ./style.css author entry",
  )

  for (const style of styles) {
    if (style.file === "site/.vitepress/theme/style.css")
      continue
    const css = postcss.parse(style.source, { from: style.file })
    const imports = []
    css.walkAtRules((atRule) => {
      if (atRule.name.toLowerCase() === "import")
        imports.push(atRule.params)
    })
    expect(imports.length === 0, `${style.file} must not extend the reviewed author-style import graph`)
  }

  return styles
}

function declarationKey(file, declaration) {
  expect(declaration.parent?.type === "rule", `${file} transition/order declarations must belong to a rule`)
  return JSON.stringify({
    file,
    important: Boolean(declaration.important),
    media: mediaAncestors(declaration),
    property: declaration.prop.toLowerCase(),
    selectors: [...selectorSet(declaration.parent)].sort(),
    value: normalizedCssValue(declaration.value),
  })
}

function expectedDeclarationKey(file, selectors, property, value, important = false, media = []) {
  return JSON.stringify({
    file,
    important,
    media,
    property,
    selectors: [...selectors].sort(),
    value: normalizedCssValue(value),
  })
}

function verifyAuthorStyleInventory(styles) {
  const motionProperties = new Set([
    "all",
    "scroll-behavior",
    "transition",
    "transition-delay",
    "transition-duration",
    "transition-property",
    "transition-timing-function",
  ])
  const actualTransitions = []
  const actualOrders = []
  for (const style of styles) {
    const css = postcss.parse(style.source, { from: style.file })
    css.walkDecls((declaration) => {
      const property = declaration.prop.startsWith("--") ? declaration.prop : declaration.prop.toLowerCase()
      if (
        motionProperties.has(property)
        || property === "animation"
        || property.startsWith("animation-")
        || property.startsWith("view-transition-")
      )
        actualTransitions.push(declarationKey(style.file, declaration))
      if (property === "order")
        actualOrders.push(declarationKey(style.file, declaration))
    })
  }

  const familyStyle = "site/.vitepress/theme/components/ThemeFamilyControl.vue#style[1]"
  const previewStyle = "site/.vitepress/theme/components/TokenPreview.vue#style[1]"
  const globalStyle = "site/.vitepress/theme/style.css"
  const reduced = ["(prefers-reduced-motion: reduce)"]
  const expectedTransitions = [
    expectedDeclarationKey(familyStyle, [".theme-family-switch__thumb"], "transition", "background-color var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard)"),
    expectedDeclarationKey(familyStyle, [".theme-family-switch__thumb"], "transition-duration", "0s", false, reduced),
    expectedDeclarationKey(previewStyle, [".motion-demo__bar"], "transition-property", "width, transform, opacity"),
    expectedDeclarationKey(previewStyle, [".motion-demo__bar"], "transition-timing-function", "var(--ease-standard)"),
    expectedDeclarationKey(previewStyle, [".motion-demo__bar"], "transition-duration", "inherit"),
    expectedDeclarationKey(previewStyle, [".transition-demo__dot"], "transition", "inherit"),
    expectedDeclarationKey(previewStyle, [".motion-demo__bar"], "transition-duration", "0ms", true, reduced),
    expectedDeclarationKey(globalStyle, [".theme-action"], "transition", "var(--transition-interactive)"),
    expectedDeclarationKey(globalStyle, reducedMotionSelectors, "transition-duration", "0s", true, reduced),
    expectedDeclarationKey(globalStyle, [".theme-action"], "transition-duration", "0s", false, reduced),
  ].sort()
  expect(
    JSON.stringify(actualTransitions.sort()) === JSON.stringify(expectedTransitions),
    "Theme author sources must keep exactly the reviewed transition inventory",
  )

  const mobile = ["(max-width: 767px)"]
  const expectedOrders = mobileNavOrder.map(([selector, order]) =>
    expectedDeclarationKey(globalStyle, [selector], "order", order, false, mobile),
  ).sort()
  expect(
    JSON.stringify(actualOrders.sort()) === JSON.stringify(expectedOrders),
    "Theme author sources must keep exactly the reviewed mobile order inventory",
  )
}

function verifyThemeCssEntryImports(source, file) {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  expect(sourceFile.parseDiagnostics.length === 0, `${file} has TypeScript parse errors`)
  const cssImports = sourceFile.statements.flatMap((statement) => {
    if (
      ts.isImportDeclaration(statement)
      && ts.isStringLiteral(statement.moduleSpecifier)
      && statement.moduleSpecifier.text.endsWith(".css")
    )
      return [statement.moduleSpecifier.text]
    return []
  })
  expect(
    cssImports.length === 1 && cssImports[0] === "./style.css",
    `${file} must import exactly the reviewed ./style.css author entry`,
  )
}

const reviewedGlobalStyleImports = [
  '"tailwindcss"',
  '"@ayingott/theme/fonts.css"',
  '"@ayingott/theme"',
  '"@ayingott/theme/brutal.css"',
]

function verifyGlobalStyleImports(source, file) {
  const css = postcss.parse(source, { from: file })
  const imports = []
  css.walkAtRules((atRule) => {
    if (atRule.name.toLowerCase() === "import")
      imports.push(atRule.params.trim())
  })
  expect(
    imports.length === reviewedGlobalStyleImports.length
    && imports.every((value, index) => value === reviewedGlobalStyleImports[index]),
    `${file} must keep exactly the reviewed author-style import graph`,
  )
}

function declarationsForProperty(css, property) {
  const declarations = []
  css.walkDecls((declaration) => {
    if (!declaration.prop.startsWith("--") && declaration.prop.toLowerCase() === property.toLowerCase())
      declarations.push(declaration)
  })
  return declarations
}

function mediaAncestors(node) {
  const media = []
  let current = node.parent
  while (current !== undefined) {
    if (current.type === "atrule" && current.name === "media")
      media.push(current.params)
    current = current.parent
  }
  return media
}

function normalizedCssValue(value) {
  return value.trim().replace(/\s+/g, " ")
}

function verifyThemeFamilyReducedMotion(source, file) {
  const css = postcss.parse(source, { from: file })
  expect(declarationsForProperty(css, "all").length === 0, `Family component must not use the all shorthand in ${file}`)
  const reducedMotion = css.nodes.filter(node =>
    node.type === "atrule"
    && node.name === "media"
    && node.params === "(prefers-reduced-motion: reduce)",
  )
  expect(reducedMotion.length === 1, `Expected exactly one family reduced-motion media query in ${file}`)
  const thumb = readDeclarations(findRule(
    reducedMotion[0],
    [".theme-family-switch__thumb"],
    "family reduced motion",
  ))
  expectDeclaration(thumb, "transition-duration", "0s")

  const transitions = declarationsForProperty(css, "transition")
  expect(transitions.length === 1, `Expected exactly one family transition declaration in ${file}`)
  expect(
    transitions[0].parent?.type === "rule"
    && sameSet(selectorSet(transitions[0].parent), new Set([".theme-family-switch__thumb"])),
    `Family transition must only target the canonical thumb selector in ${file}`,
  )
  expect(
    normalizedCssValue(transitions[0].value)
    === "background-color var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard)",
    `Unexpected family transition value in ${file}: ${normalizedCssValue(transitions[0].value)}`,
  )
  expect(!transitions[0].important, "Expected family transition important=false")
  expect(mediaAncestors(transitions[0]).length === 0, `Family transition must be outside media queries in ${file}`)

  const durations = declarationsForProperty(css, "transition-duration")
  expect(durations.length === 1, `Expected exactly one family transition-duration declaration in ${file}`)
  expect(
    durations[0].parent?.type === "rule"
    && sameSet(selectorSet(durations[0].parent), new Set([".theme-family-switch__thumb"])),
    `Family transition-duration must only target the canonical thumb selector in ${file}`,
  )
  expect(durations[0].value.trim() === "0s", `Expected family transition-duration: 0s; received ${durations[0].value.trim()}`)
  expect(!durations[0].important, "Expected family transition-duration important=false")
  expect(
    mediaAncestors(durations[0]).length === 1
    && mediaAncestors(durations[0])[0] === "(prefers-reduced-motion: reduce)",
    `Family transition-duration must only come from the canonical reduced-motion media query in ${file}`,
  )
}

function verifyGlobalTransitionInventory(source, file) {
  const css = postcss.parse(source, { from: file })
  expect(declarationsForProperty(css, "all").length === 0, `Global site CSS must not use the all shorthand in ${file}`)
  const transitions = declarationsForProperty(css, "transition")
  expect(transitions.length === 1, `Expected exactly one global transition declaration in ${file}`)
  const actionTransition = readDeclarations(findRule(css, [".theme-action"], "global theme action transition"))
  expectDeclaration(actionTransition, "transition", "var(--transition-interactive)")

  const durations = declarationsForProperty(css, "transition-duration")
  expect(durations.length === 2, `Expected exactly two global transition-duration declarations in ${file}`)

  const reducedMotion = css.nodes.filter(node =>
    node.type === "atrule"
    && node.name === "media"
    && node.params === "(prefers-reduced-motion: reduce)",
  )
  expect(reducedMotion.length === 1, `Expected exactly one global reduced-motion media query in ${file}`)

  const appearance = readDeclarations(findRule(
    reducedMotion[0],
    reducedMotionSelectors,
    "global reduced appearance motion",
  ))
  expectDeclaration(appearance, "transition-duration", "0s", true)

  const action = readDeclarations(findRule(
    reducedMotion[0],
    [".theme-action"],
    "global reduced theme action motion",
  ))
  expectDeclaration(action, "transition-duration", "0s")
}

const mobileNavOrder = [
  [".VPNavScreen .menu", "1"],
  [".VPNavScreen .translations", "2"],
  [".VPNavScreen .appearance", "3"],
  [".VPNavScreen .theme-family-control--screen", "4"],
  [".VPNavScreen .social-links", "5"],
]

function verifyMobileThemeFamilyOrder(source, file) {
  const css = postcss.parse(source, { from: file })
  const mobile = css.nodes.filter(node =>
    node.type === "atrule"
    && node.name === "media"
    && node.params === "(max-width: 767px)",
  )
  expect(mobile.length === 1, `Expected exactly one mobile nav media query in ${file}`)

  const container = readDeclarations(findRule(
    mobile[0],
    [".VPNavScreen > .container"],
    "mobile nav order container",
  ))
  expectDeclaration(container, "display", "flex")
  expectDeclaration(container, "flex-direction", "column")

  const allOrderDeclarations = declarationsForProperty(css, "order")
  expect(
    allOrderDeclarations.length === mobileNavOrder.length,
    `Expected exactly ${mobileNavOrder.length} canonical mobile order declarations in ${file}`,
  )

  for (const [selector, order] of mobileNavOrder) {
    const declarations = readDeclarations(findRule(mobile[0], [selector], `mobile order ${selector}`))
    expectDeclaration(declarations, "order", order)

    const orderDeclarations = allOrderDeclarations.filter(declaration =>
      declaration.parent?.type === "rule"
      && sameSet(selectorSet(declaration.parent), new Set([selector])),
    )
    expect(orderDeclarations.length === 1, `Expected exactly one order declaration for ${selector} in ${file}`)
    expect(orderDeclarations[0].value.trim() === order, `Expected ${selector} order: ${order}; received ${orderDeclarations[0].value.trim()}`)
    expect(!orderDeclarations[0].important, `Expected ${selector} order important=false`)
    expect(
      mediaAncestors(orderDeclarations[0]).length === 1
      && mediaAncestors(orderDeclarations[0])[0] === "(max-width: 767px)",
      `${selector} order must only come from the canonical mobile media query in ${file}`,
    )
  }
}

function verifySavedIconRole(source, file) {
  const css = postcss.parse(source, { from: file })
  const savedIcon = readDeclarations(findRule(
    css,
    [".theme-state--saved .theme-icon"],
    "saved icon semantic role",
  ))
  expectDeclaration(savedIcon, "color", "var(--text-accent)")
}

function sha256(file) {
  return createHash("sha256").update(readFileSync(join(rootDir, file))).digest("hex")
}

const config = readConfig()

const homepageSource = expectSourceIncludes("site/index.md", [
  "text: Paper & Ink defaults with opt-in Neo-Brutal Light and Dark on one semantic API.",
  "text: Compare theme families",
  "link: /guide/theme-overview",
  "title: Two-axis themes",
])
expect(!homepageSource.includes("title: Runtime Semantics"), "Homepage must replace the Runtime Semantics card")
expect((homepageSource.match(/^  - title:/gm) ?? []).length === 3, "Homepage must keep exactly three feature cards")

expectSourceIncludes("site/guide/getting-started.md", [
  '<html class="brutal dark">',
  "Arbitrary mixed nested theme islands are unsupported",
  "The `--brutal-*` palette variables are contract-owned implementation details",
  "[Theme overview](./theme-overview)",
])
expectSourceIncludes("site/tokens/effects.md", [
  "at `:root`",
  "var(--border-width-control, var(--border-width-thin))",
  "invalid at computed-value time",
  "behaves as `unset`",
  "earlier cascaded declaration is not revived",
])
expectSourceIncludes("site/tokens/semantic.md", [
  "Use `--text-muted` for active muted UI copy",
  "express family-relative intent",
])
expectSourceIncludes("site/guide/package-contract.md", [
  "The family-local `--brutal-*` palette variables are contract-owned implementation details",
])
expectSourceIncludes("packages/theme/README.md", [
  "place both classes on that same root",
  "Arbitrary mixed nested theme islands are unsupported",
  "not a consumer direct-use API",
])
expectSourceIncludes("skills/ayingott-design-system/SKILL.md", [
  "Place the family and scheme classes together on the same theme root",
  "Do not consume the family-local `--brutal-*` palette variables directly",
  "Use `--text-muted` for active muted UI copy",
])
expectSourceIncludes("skills/ayingott-design-system/references/tokens.md", [
  "## Neo-Brutal opt-in scope",
  "Contract-owned; do not use directly in consumer CSS",
])
expectSourceIncludes("docs/spec/rfc-brutal-theme.md", [
  "co-located on one theme root",
  "not a consumer direct-use API",
  "invalid at computed-value time",
  "behaves as `unset`",
  "earlier cascaded declaration is not revived",
])
expectSourceIncludes("docs/spec/design-system-v1.0.md", [
  "两个 class 共置同一 theme root",
  "不是 consumer direct-use API",
  "computed-value time invalid",
  "按 `unset` 处理",
  "更早的 cascaded declaration 不会重新生效",
])
expectSourceIncludes("skills/ayingott-design-system/SKILL.md", [
  "invalid at computed-value time",
  "behaves as `unset`",
  "earlier cascaded declaration is not revived",
])

expect(stringValue(property(config, "lang"), "lang") === "en", "VitePress lang must be en")
expect(stringValue(property(config, "title"), "title") === "Ayingott Design System", "VitePress title must remain Ayingott Design System")

const themeConfig = objectValue(property(config, "themeConfig"), "themeConfig")
const logo = objectValue(property(themeConfig, "logo"), "themeConfig.logo")
expect(stringValue(property(logo, "light"), "themeConfig.logo.light") === "/lo.svg", "Light logo must use /lo.svg")
expect(stringValue(property(logo, "dark"), "themeConfig.logo.dark") === "/lo-white.svg", "Dark logo must use /lo-white.svg")
expect(stringValue(property(logo, "alt"), "themeConfig.logo.alt") === "Lo", "Logo alt text must remain Lo")

const head = arrayValue(property(config, "head"), "head")
const iconLinks = head.elements.flatMap((entry) => {
  if (!ts.isArrayLiteralExpression(entry) || entry.elements.length !== 2)
    return []
  if (!ts.isStringLiteral(entry.elements[0]) || entry.elements[0].text !== "link")
    return []
  if (!ts.isObjectLiteralExpression(entry.elements[1]))
    return []

  const attributes = entry.elements[1]
  const rel = optionalProperty(attributes, "rel")
  if (rel === undefined || stringValue(rel, "link rel") !== "icon")
    return []

  return [{
    type: stringValue(property(attributes, "type"), "icon type"),
    href: stringValue(property(attributes, "href"), "icon href"),
    media: stringValue(property(attributes, "media"), "icon media"),
  }]
})

expect(iconLinks.length === 2, "Expected exactly two favicon links")
expect(iconLinks.some(link =>
  link.type === "image/svg+xml"
  && link.href === "/lo.svg"
  && link.media === "(prefers-color-scheme: light)"), "Missing exact light favicon link")
expect(iconLinks.some(link =>
  link.type === "image/svg+xml"
  && link.href === "/lo-white.svg"
  && link.media === "(prefers-color-scheme: dark)"), "Missing exact dark favicon link")

const themeFamilyScripts = head.elements.filter((entry) => {
  if (!ts.isArrayLiteralExpression(entry) || entry.elements.length !== 3)
    return false
  return ts.isStringLiteral(entry.elements[0])
    && entry.elements[0].text === "script"
    && ts.isObjectLiteralExpression(entry.elements[1])
    && ts.isIdentifier(entry.elements[2])
    && entry.elements[2].text === "THEME_FAMILY_INIT_SCRIPT"
})
expect(themeFamilyScripts.length === 1, "Expected exactly one early Theme Family initialization script")

expectSourceIncludes("site/.vitepress/config.ts", [
  'import { THEME_FAMILY_INIT_SCRIPT } from "./theme/theme-family"',
  '["script", {}, THEME_FAMILY_INIT_SCRIPT]',
])
const themeIndexFile = "site/.vitepress/theme/index.ts"
const themeIndexSource = expectSourceIncludes(themeIndexFile, [
  'import Layout from "./Layout.vue"',
  "Layout,",
])
expectFailure(
  "additional Theme CSS entry import",
  () => verifyThemeCssEntryImports('import "./style.css"\nimport "./override.css"', "<additional-theme-css-entry-fixture>"),
  "must import exactly the reviewed ./style.css author entry",
)
verifyThemeCssEntryImports(themeIndexSource, themeIndexFile)
expectSourceIncludes("site/.vitepress/theme/Layout.vue", [
  '<ThemeFamilyControl placement="header" />',
  '<ThemeFamilyControl placement="screen" />',
  '#nav-bar-content-after',
  '#nav-screen-content-after',
])
const themeFamilyInitSource = expectSourceIncludes("site/.vitepress/theme/theme-family.ts", [
  'export const THEME_FAMILY_ROOT_CLASS = "brutal"',
  'export const THEME_FAMILY_STORAGE_KEY = "ayingott:theme-family"',
  "export function applyThemeFamilyToRoot",
  "localStorage.getItem",
  "root.classList.toggle",
  "root.dataset.themeFamily = family",
])
const themeFamilyModule = evaluateStaticModule(themeFamilyInitSource, "site/.vitepress/theme/theme-family.ts")
expect(typeof themeFamilyModule.THEME_FAMILY_INIT_SCRIPT === "string", "Theme Family init script must be a string")
verifyThemeFamilyInitEffects(
  themeFamilyModule.THEME_FAMILY_INIT_SCRIPT,
  "<rendered-theme-family-init-script-effects>",
)
expectFailure(
  "interprocedural init-script root mutation",
  () => verifyThemeFamilyInitEffects(
    themeFamilyModule.THEME_FAMILY_INIT_SCRIPT.replace(
      "root.dataset.themeFamily = family",
      'root.dataset.themeFamily = family\n  function forceDark(element) { element.classList.add("dark") }\n  forceDark(root)',
    ),
    "<interprocedural-init-script-fixture>",
  ),
  "root effects must be exactly",
)
verifyThemeFamilyRootEffects(
  themeFamilyModule.applyThemeFamilyToRoot,
  "site/.vitepress/theme/theme-family.ts#applyThemeFamilyToRoot",
)
expectFailure(
  "interprocedural root helper mutation",
  () => verifyThemeFamilyRootEffects((root, family) => {
    root.classList.toggle("brutal", family === "neo")
    root.dataset.themeFamily = family
    function forceDark(element) {
      element.classList.add("dark")
    }
    forceDark(root)
  }, "<interprocedural-root-helper-fixture>"),
  "root effects must be exactly",
)
expectFailure(
  "bound root method mutation",
  () => verifyThemeFamilyRootEffects((root, family) => {
    root.classList.toggle("brutal", family === "neo")
    root.dataset.themeFamily = family
    const setClass = root.setAttribute.bind(root)
    setClass("class", "dark")
  }, "<bound-root-method-fixture>"),
  "root effects must be exactly",
)
expectFailure(
  "called root method mutation",
  () => verifyThemeFamilyRootEffects((root, family) => {
    root.classList.toggle("brutal", family === "neo")
    root.dataset.themeFamily = family
    root.setAttribute.call(root, "class", "dark")
  }, "<called-root-method-fixture>"),
  "root effects must be exactly",
)
expectFailure(
  "applied root method mutation",
  () => verifyThemeFamilyRootEffects((root, family) => {
    root.classList.toggle("brutal", family === "neo")
    root.dataset.themeFamily = family
    root.setAttribute.apply(root, ["class", "dark"])
  }, "<applied-root-method-fixture>"),
  "root effects must be exactly",
)
expectFailure(
  "computed root helper mutation",
  () => verifyThemeFamilyRootEffects((root, family) => {
    root.classList.toggle("brutal", family === "neo")
    root.dataset.themeFamily = family
    const key = "classList"
    const method = "add"
    root[key][method]("dark")
  }, "<computed-root-helper-fixture>"),
  "root effects must be exactly",
)
verifyThemeFamilyClassMutation(
  themeFamilyModule.THEME_FAMILY_INIT_SCRIPT,
  "<rendered-theme-family-init-script>",
  { className: "brutal", state: "neo" },
)

const themeFamilyComposableSource = expectSourceIncludes("site/.vitepress/theme/composables/useThemeFamily.ts", [
  "applyThemeFamilyToRoot(document.documentElement, family)",
  "localStorage.setItem(THEME_FAMILY_STORAGE_KEY, family)",
  "document.documentElement.classList.contains(THEME_FAMILY_ROOT_CLASS)",
  '"Neo" : "Default"',
  'isDark.value ? "Dark" : "Light"',
])
verifyThemeFamilyRootBoundary(
  themeFamilyComposableSource,
  "site/.vitepress/theme/composables/useThemeFamily.ts",
)
expectFailure(
  "composable destructured root alias mutation",
  () => verifyThemeFamilyRootBoundary(
    `${themeFamilyComposableSource}\nconst { documentElement: schemeRoot } = document\nschemeRoot.className += " dark"`,
    "<composable-destructured-root-alias-fixture>",
  ),
  "must not alias the theme root",
)
expectFailure(
  "composable interprocedural root escape",
  () => verifyThemeFamilyRootBoundary(
    `${themeFamilyComposableSource}\nfunction forceDark(element) { element.classList.add("dark") }\nforceDark(document.documentElement)`,
    "<composable-interprocedural-root-fixture>",
  ),
  "must keep exactly two reviewed theme-root reads",
)

const familyMutationFixture = `
  const root = document.documentElement
  root.classList.toggle(THEME_FAMILY_ROOT_CLASS, family === NEO_THEME_FAMILY)
  root.dataset.themeFamily = family
`
expectFailure(
  "family classList.add scheme mutation",
  () => verifyThemeFamilyClassMutation(
    `${familyMutationFixture}\nroot.classList.add('dark')`,
    "<family-add-scheme-fixture>",
    {
      classIdentifier: "THEME_FAMILY_ROOT_CLASS",
      stateIdentifier: "NEO_THEME_FAMILY",
    },
  ),
  "must contain exactly one classList mutation",
)
expectFailure(
  "family single-quote scheme toggle mutation",
  () => verifyThemeFamilyClassMutation(
    `${familyMutationFixture}\nroot.classList.toggle('dark')`,
    "<family-toggle-scheme-fixture>",
    {
      classIdentifier: "THEME_FAMILY_ROOT_CLASS",
      stateIdentifier: "NEO_THEME_FAMILY",
    },
  ),
  "must contain exactly one classList mutation",
)
expectFailure(
  "family element-access scheme mutation",
  () => verifyThemeFamilyClassMutation(
    `${familyMutationFixture}\nroot.classList['add']('dark')`,
    "<family-element-access-scheme-fixture>",
    {
      classIdentifier: "THEME_FAMILY_ROOT_CLASS",
      stateIdentifier: "NEO_THEME_FAMILY",
    },
  ),
  "must contain exactly one classList mutation",
)
expectFailure(
  "family classList alias scheme mutation",
  () => verifyThemeFamilyClassMutation(
    `${familyMutationFixture}\nconst familyClasses = root.classList\nfamilyClasses.add('dark')`,
    "<family-alias-scheme-fixture>",
    {
      classIdentifier: "THEME_FAMILY_ROOT_CLASS",
      stateIdentifier: "NEO_THEME_FAMILY",
    },
  ),
  "must not alias classList",
)
expectFailure(
  "family indirect classList mutator call",
  () => verifyThemeFamilyClassMutation(
    `${familyMutationFixture}\nroot.classList.add.call(root.classList, 'dark')`,
    "<family-indirect-mutator-call-fixture>",
    {
      classIdentifier: "THEME_FAMILY_ROOT_CLASS",
      stateIdentifier: "NEO_THEME_FAMILY",
    },
  ),
  "must contain exactly one classList mutation",
)
expectFailure(
  "family prototype classList mutator call",
  () => verifyThemeFamilyClassMutation(
    `${familyMutationFixture}\nDOMTokenList.prototype.add.call(root.classList, 'dark')`,
    "<family-prototype-mutator-call-fixture>",
    {
      classIdentifier: "THEME_FAMILY_ROOT_CLASS",
      stateIdentifier: "NEO_THEME_FAMILY",
    },
  ),
  "must contain exactly one classList mutation",
)
expectFailure(
  "family fully computed classList mutation",
  () => verifyThemeFamilyClassMutation(
    `${familyMutationFixture}\nconst c = 'classList'\nconst m = 'add'\nroot[c][m]('dark')`,
    "<family-fully-computed-classlist-fixture>",
    {
      classIdentifier: "THEME_FAMILY_ROOT_CLASS",
      stateIdentifier: "NEO_THEME_FAMILY",
    },
  ),
  "must contain exactly one classList mutation",
)
expectFailure(
  "family root className mutation",
  () => verifyThemeFamilyClassMutation(
    `${familyMutationFixture}\nroot.className += ' dark'`,
    "<family-root-classname-fixture>",
    {
      classIdentifier: "THEME_FAMILY_ROOT_CLASS",
      stateIdentifier: "NEO_THEME_FAMILY",
    },
  ),
  "must contain exactly one canonical root metadata write",
)
expectFailure(
  "family destructured root alias mutation",
  () => verifyThemeFamilyClassMutation(
    `${familyMutationFixture}\nconst { documentElement: schemeRoot } = document\nschemeRoot.className += ' dark'`,
    "<family-destructured-root-alias-fixture>",
    {
      classIdentifier: "THEME_FAMILY_ROOT_CLASS",
      stateIdentifier: "NEO_THEME_FAMILY",
    },
  ),
  "must contain exactly one canonical root metadata write",
)
expectFailure(
  "family root class attribute mutation",
  () => verifyThemeFamilyClassMutation(
    `${familyMutationFixture}\nroot.setAttribute('class', 'dark')`,
    "<family-root-class-attribute-fixture>",
    {
      classIdentifier: "THEME_FAMILY_ROOT_CLASS",
      stateIdentifier: "NEO_THEME_FAMILY",
    },
  ),
  "must not call methods directly on the theme root",
)
verifyThemeFamilyClassMutation(
  `${familyMutationFixture}\nconst observedFamilies = new Set()\nobservedFamilies.add(family)`,
  "<neutral-set-add-fixture>",
  {
    classIdentifier: "THEME_FAMILY_ROOT_CLASS",
    stateIdentifier: "NEO_THEME_FAMILY",
  },
)

const themeFamilyControlSource = expectSourceIncludes("site/.vitepress/theme/components/ThemeFamilyControl.vue", [
  'role="switch"',
  'aria-label="Neo theme family"',
  ':aria-checked="isNeo"',
  'aria-live="polite"',
  'isReady ? effectiveState : "Default · Light"',
  "min-width: var(--touch-target-min)",
  "touch-action: manipulation",
  ".theme-family-switch:focus-visible",
  "@media (prefers-reduced-motion: reduce)",
])
const familyTransitionFixture = `
  .theme-family-switch__thumb {
    transition:
      background-color var(--duration-fast) var(--ease-standard),
      transform var(--duration-fast) var(--ease-standard);
  }
`
expectFailure(
  "wrong family reduced-motion duration",
  () => verifyThemeFamilyReducedMotion(`${familyTransitionFixture}
    @media (prefers-reduced-motion: reduce) {
      .theme-family-switch__thumb {
        transition-duration: 1s;
      }
    }
  `, "<wrong-family-reduced-motion-fixture>"),
  "Expected transition-duration: 0s",
)
expectFailure(
  "late family reduced-motion override",
  () => verifyThemeFamilyReducedMotion(`${familyTransitionFixture}
    @media (prefers-reduced-motion: reduce) {
      .theme-family-switch__thumb {
        transition-duration: 0s;
      }
    }
    .theme-family-switch__thumb {
      transition-duration: 1s !important;
    }
  `, "<late-family-reduced-motion-override-fixture>"),
  "Expected exactly one family transition-duration declaration",
)
expectFailure(
  "higher-specificity family reduced-motion override",
  () => verifyThemeFamilyReducedMotion(`${familyTransitionFixture}
    @media (prefers-reduced-motion: reduce) {
      .theme-family-switch__thumb {
        transition-duration: 0s;
      }
      .theme-family-control .theme-family-switch__thumb {
        transition-duration: 1s !important;
      }
    }
  `, "<higher-specificity-family-reduced-motion-override-fixture>"),
  "Expected exactly one family transition-duration declaration",
)
expectFailure(
  "uppercase family reduced-motion override",
  () => verifyThemeFamilyReducedMotion(`${familyTransitionFixture}
    @media (prefers-reduced-motion: reduce) {
      .theme-family-switch__thumb {
        transition-duration: 0s;
      }
      .theme-family-control .theme-family-switch__thumb {
        TRANSITION-DURATION: 1s !important;
      }
    }
  `, "<uppercase-family-reduced-motion-override-fixture>"),
  "Expected exactly one family transition-duration declaration",
)
expectFailure(
  "family transition shorthand override",
  () => verifyThemeFamilyReducedMotion(`${familyTransitionFixture}
    @media (prefers-reduced-motion: reduce) {
      .theme-family-switch__thumb {
        transition-duration: 0s;
      }
      .theme-family-control .theme-family-switch__thumb {
        transition: transform 1s !important;
      }
    }
  `, "<family-transition-shorthand-override-fixture>"),
  "Expected exactly one family transition declaration",
)
verifyThemeFamilyReducedMotion(
  readScopedStyle(themeFamilyControlSource, "site/.vitepress/theme/components/ThemeFamilyControl.vue"),
  "site/.vitepress/theme/components/ThemeFamilyControl.vue#style",
)

const cssFile = "site/.vitepress/theme/style.css"
const cssSource = readSource(cssFile)
const themeAuthorStyles = readThemeAuthorStyles()
const globalStyleImportFixture = reviewedGlobalStyleImports.map(value => `@import ${value};`).join("\n")
const globalTransitionFixture = `
  .theme-action {
    transition: var(--transition-interactive);
  }
  @media (prefers-reduced-motion: reduce) {
    .VPSwitch.VPSwitchAppearance,
    .VPSwitch.VPSwitchAppearance .check,
    .dark .VPSwitch.VPSwitchAppearance .icon .sun,
    .dark .VPSwitch.VPSwitchAppearance .icon .moon {
      transition-duration: 0s !important;
    }
    .theme-action {
      transition-duration: 0s;
    }
  }
`
expect(
  (cssSource.match(/@import "@ayingott\/theme\/brutal\.css";/g) ?? []).length === 1,
  "Site theme must import the existing Neo opt-in entry exactly once",
)
expectFailure(
  "additional local author-style import",
  () => verifyGlobalStyleImports(
    `${globalStyleImportFixture}\n@import "./theme-family-override.css";`,
    "<additional-local-author-style-import-fixture>",
  ),
  "must keep exactly the reviewed author-style import graph",
)
verifyGlobalStyleImports(cssSource, cssFile)
expectFailure(
  "global Theme Family transition override",
  () => verifyGlobalTransitionInventory(`${globalTransitionFixture}
    .theme-family-control .theme-family-switch__thumb {
      transition-duration: 1s !important;
    }
  `, "<global-family-transition-override-fixture>"),
  "Expected exactly two global transition-duration declarations",
)
expectFailure(
  "global Theme Family transition shorthand override",
  () => verifyGlobalTransitionInventory(`${globalTransitionFixture}
    .theme-family-control .theme-family-switch__thumb {
      transition: transform 1s !important;
    }
  `, "<global-family-transition-shorthand-override-fixture>"),
  "Expected exactly one global transition declaration",
)
verifyGlobalTransitionInventory(cssSource, cssFile)
expectFailure(
  "unscoped Vue author transition override",
  () => verifyAuthorStyleInventory([
    ...themeAuthorStyles,
    {
      file: "site/.vitepress/theme/Layout.vue#style[1]",
      source: ".theme-family-control .theme-family-switch__thumb { transition-duration: 1s !important; }",
    },
  ]),
  "must keep exactly the reviewed transition inventory",
)
expectFailure(
  "wrong mobile Theme Family order",
  () => verifyMobileThemeFamilyOrder(`
    @media (max-width: 767px) {
      .VPNavScreen > .container { display: flex; flex-direction: column; }
      .VPNavScreen .menu { order: 1; }
      .VPNavScreen .translations { order: 2; }
      .VPNavScreen .appearance { order: 3; }
      .VPNavScreen .theme-family-control--screen { order: 2; }
      .VPNavScreen .social-links { order: 5; }
    }
  `, "<wrong-mobile-family-order-fixture>"),
  "Expected order: 4",
)
expectFailure(
  "equivalent mobile Theme Family order override",
  () => verifyMobileThemeFamilyOrder(`
    @media (max-width: 767px) {
      .VPNavScreen > .container { display: flex; flex-direction: column; }
      .VPNavScreen .menu { order: 1; }
      .VPNavScreen .translations { order: 2; }
      .VPNavScreen .appearance { order: 3; }
      .VPNavScreen .theme-family-control--screen { order: 4; }
      .VPNavScreen .social-links { order: 5; }
    }
    @media (width <= 767px) {
      .VPNavScreen .theme-family-control--screen { order: 2 !important; }
    }
  `, "<equivalent-mobile-family-order-override-fixture>"),
  "Expected exactly 5 canonical mobile order declarations",
)
expectFailure(
  "higher-specificity mobile Theme Family order override",
  () => verifyMobileThemeFamilyOrder(`
    @media (max-width: 767px) {
      .VPNavScreen > .container { display: flex; flex-direction: column; }
      .VPNavScreen .menu { order: 1; }
      .VPNavScreen .translations { order: 2; }
      .VPNavScreen .appearance { order: 3; }
      .VPNavScreen .theme-family-control--screen { order: 4; }
      .VPNavScreen .social-links { order: 5; }
      .VPNavScreen > .container .theme-family-control--screen { order: 2 !important; }
    }
  `, "<higher-specificity-mobile-family-order-override-fixture>"),
  "Expected exactly 5 canonical mobile order declarations",
)
expectFailure(
  "uppercase mobile Theme Family order override",
  () => verifyMobileThemeFamilyOrder(`
    @media (max-width: 767px) {
      .VPNavScreen > .container { display: flex; flex-direction: column; }
      .VPNavScreen .menu { order: 1; }
      .VPNavScreen .translations { order: 2; }
      .VPNavScreen .appearance { order: 3; }
      .VPNavScreen .theme-family-control--screen { order: 4; }
      .VPNavScreen .social-links { order: 5; }
      .VPNavScreen > .container .theme-family-control--screen { ORDER: 2 !important; }
    }
  `, "<uppercase-mobile-family-order-override-fixture>"),
  "Expected exactly 5 canonical mobile order declarations",
)
verifyMobileThemeFamilyOrder(cssSource, cssFile)
verifyAuthorStyleInventory(themeAuthorStyles)
const css = postcss.parse(cssSource, { from: cssFile })

expectFailure(
  "missing touch target minimum",
  () => verifyTouchTargetMinimum(":root {}", "<missing-touch-target-fixture>"),
  "Expected exactly one CSS declaration --touch-target-min",
)
expectFailure(
  "under-44 touch target minimum",
  () => verifyTouchTargetMinimum(":root { --touch-target-min: 2rem; }", "<under-44-touch-target-fixture>"),
  "Expected --touch-target-min: 2.75rem",
)

const touchTargetFile = "packages/theme/src/layers/touch-target.css"
verifyTouchTargetMinimum(readSource(touchTargetFile), touchTargetFile)

expectFailure(
  "missing reduced-motion icon selector",
  () => verifyReducedAppearanceMotion(`
    @media (prefers-reduced-motion: reduce) {
      .VPSwitch.VPSwitchAppearance,
      .VPSwitch.VPSwitchAppearance .check,
      .dark .VPSwitch.VPSwitchAppearance .icon .sun {
        transition-duration: 0s !important;
      }
    }
  `, "<missing-reduced-motion-icon-fixture>"),
  "Expected exactly one CSS rule for reduced appearance motion",
)
expectFailure(
  "wrong reduced-motion duration",
  () => verifyReducedAppearanceMotion(`
    @media (prefers-reduced-motion: reduce) {
      .VPSwitch.VPSwitchAppearance,
      .VPSwitch.VPSwitchAppearance .check,
      .dark .VPSwitch.VPSwitchAppearance .icon .sun,
      .dark .VPSwitch.VPSwitchAppearance .icon .moon {
        transition-duration: 0.01s !important;
      }
    }
  `, "<wrong-reduced-motion-duration-fixture>"),
  "Expected transition-duration: 0s",
)
verifyReducedAppearanceMotion(readSource(cssFile), cssFile)

const cta = readDeclarations(findRule(css, [".VPButton.brand", ".VPButton.alt"], "CTA touch targets"))
expectDeclaration(cta, "min-width", "var(--touch-target-min)")
expectDeclaration(cta, "min-height", "var(--touch-target-min)")

const appearance = readDeclarations(findRule(css, [".VPSwitch.VPSwitchAppearance"], "appearance touch target"))
expectDeclaration(appearance, "width", "var(--touch-target-min)")
expectDeclaration(appearance, "height", "var(--touch-target-min)")

const localOutline = readDeclarations(findRule(css, [".VPLocalNavOutlineDropdown button"], "local outline touch target"))
expectDeclaration(localOutline, "min-height", "var(--touch-target-min)")

expectFailure(
  "wrong saved icon semantic role",
  () => verifySavedIconRole(`
    .theme-state--saved .theme-icon {
      color: var(--status-success-fg);
    }
  `, "<wrong-saved-icon-role-fixture>"),
  "Expected color: var(--text-accent)",
)
verifySavedIconRole(readSource(cssFile), cssFile)

const themeIconSource = readSource("site/.vitepress/theme/components/theme-overview/ThemeIcon.vue")
for (const icon of ["circle-check", "circle-x", "info", "triangle-alert"]) {
  expect(
    themeIconSource.includes(`lucide-static/icons/${icon}.svg?url`),
    `ThemeIcon must use the Lucide ${icon} asset`,
  )
}

const interactionStatesSource = readSource("site/.vitepress/theme/components/theme-overview/ThemeInteractionStates.vue")
expect(interactionStatesSource.includes('<ThemeIcon name="circle-check" />'), "Saved state must use the Lucide circle-check icon")

const statusRolesSource = readSource("site/.vitepress/theme/components/theme-overview/ThemeStatusRoles.vue")
for (const icon of ["circle-check", "triangle-alert", "circle-x", "info"]) {
  expect(statusRolesSource.includes(`<ThemeIcon name="${icon}" />`), `Status roles must use the Lucide ${icon} icon`)
}

const track = readDeclarations(findRule(css, [".VPSwitch.VPSwitchAppearance::before"], "appearance visual track"))
expectDeclaration(track, "top", "11px")
expectDeclaration(track, "left", "2px")
expectDeclaration(track, "width", "40px")
expectDeclaration(track, "height", "22px")

const check = readDeclarations(findRule(css, [".VPSwitch.VPSwitchAppearance .check"], "appearance check"))
expectDeclaration(check, "top", "13px")
expectDeclaration(check, "left", "3px")
expectDeclaration(check, "width", "18px")
expectDeclaration(check, "height", "18px")

const darkCheck = readDeclarations(findRule(css, [".dark .VPSwitch.VPSwitchAppearance .check"], "appearance check travel"))
expectDeclaration(darkCheck, "transform", "translateX(18px)")

expect(
  sha256("site/public/lo.svg") === "566fff909da278219c7a0bef00a5acd7fdd224bf12b9012c4d1cbf5444ea7d02",
  "site/public/lo.svg does not match the approved first-party asset",
)
expect(
  sha256("site/public/lo-white.svg") === "42fe851306f229ba2bb808a763587a7a92fe1741dfd26dbd1a9e805671250feb",
  "site/public/lo-white.svg does not match the approved first-party asset",
)

console.log("site experience source contract passed")
