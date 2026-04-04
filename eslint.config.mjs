import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginPrettier from 'eslint-plugin-prettier';
import configPrettier from 'eslint-config-prettier';

export default [
    {
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
    },
    pluginJs.configs.recommended,
    configPrettier,
    {
        plugins: {
            prettier: pluginPrettier,
        },
        rules: {
            'prettier/prettier': 'error',
            // Add any specific ESLint rules here
        },
    },
    // Allow Node.js globals (module) in script.js for conditional CJS exports
    {
        files: ['lib/script.js'],
        languageOptions: {
            globals: {
                module: 'readonly',
            },
        },
    },
    // Test files use Node.js / ESM with vitest
    {
        files: ['tests/**/*.test.js'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
];
