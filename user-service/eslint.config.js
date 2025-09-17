const typescript = require('@typescript-eslint/eslint-plugin');
const parser = require('@typescript-eslint/parser');

module.exports = [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        project: false,
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      // Development friendly rules
      'no-console': 'off',                    // Allows console.log for testing
      '@typescript-eslint/no-explicit-any': 'warn',  // Warning instead of error

    
      'semi': ['error', 'always'],            
      'quotes': ['error', 'single'],          
      'indent': ['error', 2],                 

     
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
      }],
    },
  },
  {
    ignores: ['dist/', 'node_modules/'],
  },
];