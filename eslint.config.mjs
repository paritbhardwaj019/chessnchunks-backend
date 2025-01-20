import globals from 'globals';
import pluginJs from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        process: true,
        __dirname: true,
      },
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  pluginJs.configs.recommended,
  {
    plugins: {
      prettier,
    },
    rules: {
      'prettier/prettier': 'error',
      ...eslintConfigPrettier.rules,
      'no-console': ['warn'],
    },
  },
];
