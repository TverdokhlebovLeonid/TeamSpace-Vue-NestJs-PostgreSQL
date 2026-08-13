// @ts-check
import {readFileSync} from 'node:fs'
import eslint from '@eslint/js'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const prettierConfig = JSON.parse(
  readFileSync(new URL('./.prettierrc', import.meta.url), 'utf8')
)

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'eslint.config.mjs', 'openapi.json']
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  {
    rules: {
      'prettier/prettier': ['error', prettierConfig],
      curly: ['error', 'multi-line'],
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  }
)
