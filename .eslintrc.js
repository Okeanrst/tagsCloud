module.exports = {
  env: {
    'jest/globals': true,
  },
  root: true,
  extends: ['react-app'],
  plugins: ['jest', 'prettier', 'react-hooks', 'unicorn', 'react'],
  rules: {
    semi: ['error', 'always'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'prettier/prettier': ['warn'],
    // 'no-magic-numbers': ['warn'],
    // '@typescript-eslint/no-magic-numbers': ['error'],
    'react-hooks/exhaustive-deps': ['error'],
    '@typescript-eslint/no-shadow': ['error', { allow: ['resolve', 'reject'] }],
    '@typescript-eslint/no-unused-vars': ['warn'],
    'no-console': ['warn'],
    'unicorn/no-keyword-prefix': ['error', { disallowedPrefixes: ['new'] }],
    'unicorn/no-console-spaces': ['error'],
    'react/jsx-sort-props': ['error'],
    'react/jsx-boolean-value': ['error'],
    'spaced-comment': ['error'],
  },
  settings: {
    'import/resolver': {
      'babel-module': {},
    },
  },
};
