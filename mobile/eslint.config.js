// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    rules: {
      // TypeScript/Metro resolve the @/ alias; the generic import resolver does not.
      'import/no-unresolved': 'off',
    },
  },
]);
