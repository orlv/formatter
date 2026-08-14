import pluginVue from 'eslint-plugin-vue'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import jsdoc from 'eslint-plugin-jsdoc'
import globals from 'globals'
import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tsEslint from 'typescript-eslint'

export default defineConfig([
  { ignores: ['dist', 'node_modules', 'tmp', 'temp'] },
  {
    files: ['**/*.{js,cjs,mjs,ts,mts,cts,vue}'],
    extends: [
      js.configs.recommended,
      jsdoc.configs['flat/recommended'],
      pluginVue.configs['flat/recommended'],
      eslintConfigPrettier
    ],
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

      'vue/require-prop-types': 0,
      'vue/multi-word-component-names': 0,
      'no-param-reassign': 'error',
      'no-var': 'error',
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
      'vue/no-deprecated-destroyed-lifecycle': 0, // vue 2
      'object-shorthand': ['warn', 'properties'],
      'jsdoc/ts-no-empty-object-type': 0,
      curly: ['error'],
      'one-var': ['error', 'never']
    }
  },
  {
    files: ['**/*.{ts,mts,cts}'],
    languageOptions: {
      parser: tsEslint.parser
    },
    plugins: {
      '@typescript-eslint': tsEslint.plugin
    },
    rules: {
      'no-undef': 0,
      'no-unused-vars': 0,
      'jsdoc/require-jsdoc': 0
    }
  }
])
