import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { ESLint } from 'eslint'
import legacy, { typescript as legacyTypescript } from '@orlv/formatter'
import config from '@orlv/formatter/base'
import vue, { typescript } from '@orlv/formatter/vue'

const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: config })
const vueEslint = new ESLint({ overrideConfigFile: true, overrideConfig: vue })
const typedEslint = new ESLint({ overrideConfigFile: true, overrideConfig: typescript })

for (const extension of ['js', 'mjs', 'cjs']) {
  test(`keeps JavaScript checks for .${extension}`, async () => {
    const [result] = await eslint.lintText('const unused = missingName\n', { filePath: `example.${extension}` })

    assert.deepEqual(result.messages.map(({ ruleId }) => ruleId).sort(), ['no-undef', 'no-unused-vars'])
  })
}

test('keeps JavaScript JSDoc checks', async () => {
  const [result] = await eslint.lintText('export function value() { return 1 }\n', { filePath: 'example.js' })

  assert.ok(result.messages.some(({ ruleId }) => ruleId === 'jsdoc/require-jsdoc'))
})

test('keeps JavaScript Vue support without a tsconfig', async () => {
  const [result] = await vueEslint.lintText(
    '<script setup>const title = "Hello"</script>\n<template><p>{{ title }}</p></template>\n',
    { filePath: 'example.vue' }
  )

  assert.equal(result.errorCount, 0, JSON.stringify(result.messages))
})

test('keeps unused variable checks in JavaScript Vue', async () => {
  const [result] = await vueEslint.lintText(
    '<script setup>const unused = 1</script>\n<template><p>Hello</p></template>\n',
    { filePath: 'example.vue' }
  )

  assert.ok(result.messages.some(({ ruleId }) => ruleId === 'no-unused-vars'))
})

for (const extension of ['ts', 'mts', 'cts']) {
  test(`accepts TypeScript declarations and type-only imports in .${extension}`, async () => {
    const [result] = await eslint.lintText(
      'import type { User } from "./user.js"\nexport interface Profile { user: User }\n',
      { filePath: `example.${extension}` }
    )

    assert.equal(result.errorCount, 0, JSON.stringify(result.messages))
  })
}

test('reports unused TypeScript imports and variables', async () => {
  const [result] = await eslint.lintText('import type { User } from "./user.js"\nconst unused: number = 1\n', {
    filePath: 'example.ts'
  })

  assert.deepEqual(
    result.messages.map(({ ruleId }) => ruleId),
    ['@typescript-eslint/no-unused-vars', '@typescript-eslint/no-unused-vars']
  )
})

test('reports explicit any', async () => {
  const [result] = await eslint.lintText('export type Value = any\n', { filePath: 'example.ts' })

  assert.ok(result.messages.some(({ ruleId }) => ruleId === '@typescript-eslint/no-explicit-any'))
})

test('does not check JSDoc in TypeScript or Vue TypeScript', async () => {
  const source = '/** @param oldName */\nfunction identity(value: number): number { return value }\n\n'

  for (const extension of ['ts', 'mts', 'cts']) {
    const [result] = await eslint.lintText(`${source}export { identity }\n`, { filePath: `example.${extension}` })

    assert.equal(result.errorCount, 0, JSON.stringify(result.messages))
    assert.ok(
      result.messages.every(({ ruleId }) => !ruleId?.startsWith('jsdoc/')),
      JSON.stringify(result.messages)
    )
  }

  const [result] = await typedEslint.lintText(
    `<script setup lang="ts">\n${source}</script>\n<template><p>{{ identity(1) }}</p></template>\n`,
    { filePath: 'example.vue' }
  )

  assert.equal(result.errorCount, 0, JSON.stringify(result.messages))
  assert.ok(
    result.messages.every(({ ruleId }) => !ruleId?.startsWith('jsdoc/')),
    JSON.stringify(result.messages)
  )
})

test('accepts TypeScript parameter properties and expression options', async () => {
  const [result] = await eslint.lintText(
    'export class User { constructor(public id: number) {} }\n\nexport function run(enabled: boolean, callback: () => void): void { enabled && callback() }\n',
    { filePath: 'example.ts' }
  )

  assert.equal(result.errorCount, 0, JSON.stringify(result.messages))
})

test('checks Vue TypeScript and recognizes template references', async () => {
  const [result] = await typedEslint.lintText(
    '<script setup lang="ts">\nimport type { User } from "./user.js"\nconst props = defineProps<{ user: User }>()\n</script>\n<template><p>{{ props.user.name }}</p></template>\n',
    { filePath: 'example.vue' }
  )

  assert.equal(result.errorCount, 0, JSON.stringify(result.messages))
})

test('reports unused declarations in Vue TypeScript', async () => {
  const [result] = await typedEslint.lintText(
    '<script setup lang="ts">const unused: number = 1</script>\n<template><p>Hello</p></template>\n',
    { filePath: 'example.vue' }
  )

  assert.ok(result.messages.some(({ ruleId }) => ruleId === '@typescript-eslint/no-unused-vars'))
  assert.ok(result.messages.every(({ ruleId }) => ruleId !== 'no-unused-vars'))
})

test('allows consumer overrides', async () => {
  const customEslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [...typescript, { rules: { '@typescript-eslint/no-explicit-any': 'off' } }]
  })
  const [result] = await customEslint.lintText('export type Value = any\n', { filePath: 'example.ts' })

  assert.equal(result.errorCount, 0, JSON.stringify(result.messages))
})

test('keeps the root exports compatible with the Vue entry', () => {
  assert.equal(legacy, vue)
  assert.equal(legacyTypescript, typescript)
})

test('checks JavaScript and TypeScript without loading Vue packages', () => {
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      `
    import { registerHooks } from 'node:module'
    registerHooks({
      resolve(specifier, context, nextResolve) {
        if (specifier.includes('eslint-plugin-vue') || specifier.includes('vue-eslint-parser')) {
          throw new Error('Unexpected Vue dependency: ' + specifier)
        }
        return nextResolve(specifier, context)
      }
    })
    const { default: config } = await import('@orlv/formatter/base')
    const { ESLint } = await import('eslint')
    const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: config })
    for (const extension of ['js', 'ts']) {
      const [result] = await eslint.lintText('export const value = 1', { filePath: 'example.' + extension })
      if (result.errorCount) throw new Error(JSON.stringify(result.messages))
    }
  `
    ],
    { cwd: new URL('..', import.meta.url), encoding: 'utf8', timeout: 20000 }
  )

  assert.equal(result.status, 0, result.error?.message ?? result.stderr)
})

test('leaves TypeScript global type names to the compiler in Vue scripts', async () => {
  const [result] = await typedEslint.lintText(
    '<script setup lang="ts">const timeout: NodeJS.Timeout = setTimeout(() => {}, 1)</script>\n<template><p>{{ timeout }}</p></template>\n',
    { filePath: 'example.vue' }
  )

  assert.equal(result.errorCount, 0, JSON.stringify(result.messages))
})

test('enforces common style rules in JavaScript, TypeScript, and Vue', async () => {
  const source = `
    const collect = function () {
      const self = this
      let value = 1
      let count = 0
      count += 1
      count -= 1
      return [self, value, count, arguments]
    }
    console.log(collect)
  `
  const corrected = `
    const collect = function (...args) {
      const value = 1
      let count = 0
      count++
      count--
      return [this, value, count, args]
    }

    console.log(collect)
  `
  const rules = ['@typescript-eslint/no-this-alias', 'prefer-rest-params', 'prefer-const', 'formatter/prefer-increment']
  const cases = [
    ...['js', 'mjs', 'cjs', 'ts', 'mts', 'cts'].map((extension) => ({
      linter: eslint,
      filePath: `example.${extension}`,
      prefix: '',
      suffix: ''
    })),
    { linter: vueEslint, filePath: 'example.vue', prefix: '<script>', suffix: '</script>' },
    { linter: typedEslint, filePath: 'example.vue', prefix: '<script lang="ts">', suffix: '</script>' }
  ]

  for (const { linter, filePath, prefix, suffix } of cases) {
    const [result] = await linter.lintText(prefix + source + suffix, { filePath })

    for (const rule of rules) {
      assert.ok(
        result.messages.some(({ ruleId, severity }) => ruleId === rule && severity === 2),
        `${filePath} ${prefix}: ${rule}: ${JSON.stringify(result.messages)}`
      )
    }

    assert.equal(
      result.messages.filter(({ ruleId }) => ruleId === 'formatter/prefer-increment').length,
      2,
      `${filePath} ${prefix}: formatter/prefer-increment: ${JSON.stringify(result.messages)}`
    )

    const [accepted] = await linter.lintText(prefix + corrected + suffix, { filePath })
    assert.equal(accepted.errorCount, 0, `${filePath} ${prefix}: ${JSON.stringify(accepted.messages)}`)
  }
})

test('fixes increment and decrement assignments', async () => {
  const linter = new ESLint({ overrideConfigFile: true, overrideConfig: config, fix: true })
  const [result] = await linter.lintText(
    'let count = 0\ncount += 1\ncount -= 1\nconst next = count += 1\nconsole.log(count, next)\n',
    { filePath: 'example.js' }
  )

  assert.equal(result.errorCount, 0, JSON.stringify(result.messages))
  assert.equal(result.output, 'let count = 0\ncount++\ncount--\nconst next = ++count\nconsole.log(count, next)\n')
})

test('adds blank lines around blocks', async () => {
  const linter = new ESLint({ overrideConfigFile: true, overrideConfig: config, fix: true })
  const [result] = await linter.lintText(
    `export function run(values: number[]): void {
  console.log('before if')
  if (values.length) {
    console.log(values)
  }
  console.log('before for')
  for (const value of values) {
    console.log(value)
  }
  console.log('before try')
  try {
    console.log(values)
  } catch (error) {
    console.error(error)
  }
  console.log('done')
  globalThis.fetch = async () => {
    return new Response()
  }
  console.log(globalThis.fetch)
}
`,
    { filePath: 'example.ts' }
  )

  assert.equal(result.errorCount, 0, JSON.stringify(result.messages))
  assert.equal(
    result.output,
    `export function run(values: number[]): void {
  console.log('before if')

  if (values.length) {
    console.log(values)
  }

  console.log('before for')

  for (const value of values) {
    console.log(value)
  }

  console.log('before try')

  try {
    console.log(values)
  } catch (error) {
    console.error(error)
  }

  console.log('done')
  globalThis.fetch = async () => {
    return new Response()
  }
  console.log(globalThis.fetch)
}
`
  )
})
