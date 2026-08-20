import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import boundaries from 'eslint-plugin-boundaries';
import prettier from 'eslint-config-prettier';
import importX from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';
import testingLibrary from 'eslint-plugin-testing-library';
import globals from 'globals';
import ts from 'typescript-eslint';

export default ts.config(
  { ignores: ['dist/**', 'coverage/**', 'src/app/routeTree.gen.ts', 'functions/lib/**'] },
  {
    files: ['**/*.js'],
    ...js.configs.recommended,
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...ts.configs.strictTypeChecked,
      ...ts.configs.stylisticTypeChecked,
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
      jsxA11y.flatConfigs.recommended,
      prettier,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser, ...globals.es2022 },
    },
    plugins: { 'react-hooks': hooks, boundaries, 'import-x': importX },
    settings: {
      react: { version: 'detect' },
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/*' },
        { type: 'features', pattern: 'src/features/*' },
        { type: 'shared', pattern: 'src/shared/*' },
        { type: 'domain', pattern: 'src/domain/*' },
      ],
    },
    rules: {
      ...hooks.configs.recommended.rules,
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'app', allow: ['features', 'shared', 'domain'] },
            { from: 'features', allow: ['shared', 'domain'] },
            { from: 'shared', allow: ['domain'] },
            { from: 'domain', allow: [] },
          ],
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['firebase/*'],
              message: 'Firebase must only be imported from shared/lib/firebase.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/domain/**'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'Date',
          message: 'Inject the instant as a parameter. domain/ must stay deterministic.',
        },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**'],
    plugins: { 'testing-library': testingLibrary, vitest },
    languageOptions: { globals: { ...globals.node } },
    rules: {
      ...testingLibrary.configs['flat/react'].rules,
      ...vitest.configs.recommended.rules,
      'testing-library/no-node-access': 'error',
      'testing-library/prefer-user-event': 'error',
      'vitest/expect-expect': [
        'error',
        { assertFunctionNames: ['expect', 'assertFails', 'assertSucceeds'] },
      ],
    },
  },
  {
    files: ['*.config.{js,ts}', 'src/shared/lib/firebase.ts', 'functions/**', 'tests/rules/**'],
    languageOptions: { globals: { ...globals.node } },
    rules: { 'no-restricted-imports': 'off' },
  },
);
