import eslintConfigPrettier from 'eslint-config-prettier/flat'
import jsdoc from 'eslint-plugin-jsdoc'
import globals from 'globals'
import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tsEslint from 'typescript-eslint'
import formatterPlugin from './plugin.ts'
import type { Linter } from 'eslint'

export const typescriptRules: Linter.RulesRecord = {
  'no-undef': 'off',
  'no-unused-vars': 'off',
  '@typescript-eslint/no-unused-vars': [
    'error',
    { args: 'none', caughtErrors: 'none', ignoreRestSiblings: true, vars: 'all' }
  ],
  'no-unused-expressions': 'off',
  '@typescript-eslint/no-unused-expressions': [
    'error',
    { allowShortCircuit: true, allowTernary: true, allowTaggedTemplates: true }
  ],
  'no-useless-constructor': 'off',
  '@typescript-eslint/no-useless-constructor': 'error'
}

for (const rule in jsdoc.configs['flat/recommended'].rules) {
  typescriptRules[rule] = 'off'
}

const config: Linter.Config[] = defineConfig([
  { ignores: ['dist', 'node_modules', 'tmp', 'temp'] },
  {
    files: ['**/*.{js,cjs,mjs,ts,mts,cts,vue}'],
    extends: [js.configs.recommended, jsdoc.configs['flat/recommended'], eslintConfigPrettier],
    plugins: {
      '@typescript-eslint': tsEslint.plugin,
      formatter: formatterPlugin
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      'jsdoc/require-param-description': 0,
      'jsdoc/require-returns-description': 0,
      'jsdoc/newline-after-description': 0,
      'jsdoc/no-undefined-types': 0,
      'jsdoc/require-property-description': 0,
      'jsdoc/tag-lines': 0,

      'no-param-reassign': 'error',
      'formatter/prefer-increment': 'error',
      'formatter/padding-around-blocks': 'error',
      'no-var': 'error',
      '@typescript-eslint/no-this-alias': 'error',
      'prefer-rest-params': 'error',
      'prefer-const': 'error',
      'no-lone-blocks': 'error',
      'no-return-assign': ['error', 'except-parens'],
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-template-curly-in-string': 'error',
      'no-throw-literal': 'error',
      'no-undef-init': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unneeded-ternary': ['error', { defaultAssignment: false }],
      'no-unreachable-loop': 'error',
      'no-unused-expressions': [
        'error',
        {
          allowShortCircuit: true,
          allowTernary: true,
          allowTaggedTemplates: true
        }
      ],
      'no-unused-vars': [
        'error',
        {
          args: 'none',
          caughtErrors: 'none',
          ignoreRestSiblings: true,
          vars: 'all'
        }
      ],
      'no-use-before-define': ['error', { functions: false, classes: false, variables: false }],
      'no-useless-call': 'error',
      'no-useless-computed-key': 'error',
      'no-useless-constructor': 'error',
      'no-useless-rename': 'error',
      'no-void': 'error',
      'unicode-bom': ['error', 'never'],
      yoda: ['error', 'never'],
      'object-shorthand': ['warn', 'properties'],
      'jsdoc/ts-no-empty-object-type': 0,
      curly: ['error'],
      'one-var': ['error', 'never']
    }
  },
  {
    files: ['**/*.{ts,mts,cts}'],
    extends: [tsEslint.configs.recommended],
    rules: typescriptRules
  }
])

export default config
