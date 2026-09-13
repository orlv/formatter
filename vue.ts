import pluginVue from 'eslint-plugin-vue'
import tsEslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'
import type { Linter } from 'eslint'
import base, { typescriptRules } from './base.ts'

const config: Linter.Config[] = defineConfig([
  {
    files: ['**/*.{js,cjs,mjs,ts,mts,cts,vue}'],
    extends: [pluginVue.configs['flat/recommended']]
  },
  base,
  {
    files: ['**/*.{js,cjs,mjs,ts,mts,cts,vue}'],
    rules: {
      'vue/require-prop-types': 0,
      'vue/require-default-prop': 0,
      'vue/multi-word-component-names': 0,
      'vue/no-deprecated-destroyed-lifecycle': 0 // vue 2
    }
  }
])

export default config

export const typescript: Linter.Config[] = defineConfig([
  config,
  {
    files: ['**/*.vue'],
    extends: [tsEslint.configs.recommended, pluginVue.configs['flat/base']],
    languageOptions: {
      parserOptions: {
        parser: tsEslint.parser,
        extraFileExtensions: ['.vue']
      }
    },
    rules: typescriptRules
  }
])
