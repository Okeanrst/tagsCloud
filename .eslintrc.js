module.exports = {
  env: {
    'jest/globals': true,
  },
  root: true,
  extends: ['react-app', 'plugin:prettier/recommended'],
  plugins: ['jest', 'prettier', 'react-hooks', 'unicorn', 'react'],
  rules: {
    semi: ['error', 'always'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    // 'prettier/prettier': ['warn'],
    // 'no-magic-numbers': ['warn'],
    // '@typescript-eslint/no-magic-numbers': ['error'],
    'react-hooks/exhaustive-deps': ['error'],
    '@typescript-eslint/no-shadow': ['error', { allow: ['resolve', 'reject'] }],
    '@typescript-eslint/no-unused-vars': ['warn'],
    'no-console': ['warn'],
    'unicorn/no-keyword-prefix': ['error', { disallowedPrefixes: ['new'] }],
    'unicorn/no-console-spaces': ['error'],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-child-element-spacing.md
    'react/jsx-child-element-spacing': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-closing-bracket-location.md
    'react/jsx-closing-bracket-location': [
      'error',
      {
        selfClosing: 'tag-aligned',
        nonEmpty: 'tag-aligned',
      },
    ],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-closing-tag-location.md
    'react/jsx-closing-tag-location': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-first-prop-new-line.md
    'react/jsx-first-prop-new-line': ['error', 'multiline-multiprop'],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-sort-props.md
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
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-boolean-value.md
    'react/jsx-boolean-value': [
      'error',
      'never',
      {
        always: [],
      },
    ],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-indent.md
    'react/jsx-indent': ['error', 2],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-indent-props.md
    'react/jsx-indent-props': ['error', 2],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-max-depth.md
    'react/jsx-max-depth': [
      'error',
      {
        max: 10,
      },
    ],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-max-props-per-line.md
    'react/jsx-max-props-per-line': 'off',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-one-expression-per-line.md
    'react/jsx-one-expression-per-line': 'off',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-key.md
    'react/jsx-key': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-props-no-multi-spaces.md
    'react/jsx-props-no-multi-spaces': 'error',
    'spaced-comment': ['error'],
  },
  settings: {
    'import/resolver': {
      'babel-module': {},
    },
  },
};
