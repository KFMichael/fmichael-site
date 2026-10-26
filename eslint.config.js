const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['node_modules/'] },
  js.configs.recommended,
  {
    files: ['js/**/*.js'],
    languageOptions: { sourceType: 'script', ecmaVersion: 2019, globals: { ...globals.browser, OsUtils: 'readonly', module: 'readonly' } },
    rules: { eqeqeq: ['error', 'always'], 'no-var': 'off', 'prefer-const': 'off' }
  },
  {
    files: ['js/utils.js'],
    languageOptions: { globals: { ...globals.browser, module: 'writable' } }
  },
  {
    // Le code passé à page.evaluate() s'exécute dans le navigateur
    files: ['tests/a11y/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser, axe: 'readonly' } }
  },
  {
    files: ['eslint.config.js', 'tests/**/*.js'],
    languageOptions: { sourceType: 'commonjs', ecmaVersion: 2022, globals: globals.node }
  }
];
