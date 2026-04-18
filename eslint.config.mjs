import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import unicorn from 'eslint-plugin-unicorn';
import prettierPlugin from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import globals from 'globals';

export default defineConfig([
  globalIgnores(['**/node_modules/**', 'dist/**', 'build/**', 'coverage/**']),
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  reactHooks.configs.flat.recommended,
  {
    plugins: { unicorn },
    rules: {
      'unicorn/no-keyword-prefix': ['error', { disallowedPrefixes: ['new'] }],
      'unicorn/no-console-spaces': 'error',
    },
  },
  eslintConfigPrettier,
  {
    plugins: { prettier: prettierPlugin },
    rules: {
      'prettier/prettier': 'error',
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    settings: {
      react: {
        version: 'detect',
        jsxRuntime: 'automatic',
      },
    },
    rules: {
      semi: ['error', 'always'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'react-hooks/exhaustive-deps': ['error'],
      '@typescript-eslint/no-shadow': ['error', { allow: ['resolve', 'reject'] }],
      '@typescript-eslint/no-unused-vars': ['warn'],
      'no-console': ['warn'],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-child-element-spacing': 'error',
      'react/jsx-closing-bracket-location': [
        'error',
        {
          selfClosing: 'tag-aligned',
          nonEmpty: 'tag-aligned',
        },
      ],
      'react/jsx-closing-tag-location': 'error',
      'react/jsx-first-prop-new-line': ['error', 'multiline-multiprop'],
      'react/jsx-sort-props': [
        'error',
        {
          ignoreCase: true,
          callbacksLast: true,
          shorthandFirst: true,
          shorthandLast: false,
          noSortAlphabetically: false,
          reservedFirst: false,
        },
      ],
      'react/jsx-boolean-value': [
        'error',
        'never',
        {
          always: [],
        },
      ],
      'react/jsx-indent': ['error', 2],
      'react/jsx-indent-props': ['error', 2],
      'react/jsx-max-depth': [
        'error',
        {
          max: 10,
        },
      ],
      'react/jsx-max-props-per-line': 'off',
      'react/jsx-one-expression-per-line': 'off',
      'react/jsx-key': 'error',
      'react/jsx-props-no-multi-spaces': 'error',
      'spaced-comment': [
        'error',
        'always',
        {
          line: {
            // Allow `/// <reference ... />` (TypeScript triple-slash directives)
            markers: ['/'],
          },
        },
      ],
    },
  },
]);
