import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginPrettier from 'eslint-plugin-prettier';
import configPrettier from 'eslint-config-prettier';

export default [
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                generateIac: 'readonly',
                toggleColumn: 'readonly',
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
];
