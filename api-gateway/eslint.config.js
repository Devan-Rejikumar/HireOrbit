const typescript = require('@typescript-eslint/parser');
const plugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  {
    ignores: ['dist/', 'node_modules/']
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: typescript,
      parserOptions: {
        project: false,
        ecmaVersion: 2020,
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': plugin
    },
    rules: {
      'no-console': 'off',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'indent': ['error', 2],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-multiple-empty-lines': ['error', { 'max': 1 }],
      'comma-dangle': ['error', 'always-multiline'],
      'object-curly-spacing': ['error', 'always']
    }
  }
];