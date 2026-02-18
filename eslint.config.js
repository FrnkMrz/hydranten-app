import js from '@eslint/js';
import globals from 'globals';

export default [
    js.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                __APP_VERSION__: 'readonly',
            },
            ecmaVersion: 2022,
            sourceType: 'module',
        },
        rules: {
            "no-unused-vars": ["warn", {
                "argsIgnorePattern": "^_",
                "varsIgnorePattern": "^_",
                "caughtErrorsIgnorePattern": "^_"
            }],
            "no-undef": "error"
        },
        ignores: ["dist/", "coverage/", "playwright-report/", "test-results/"]
    }
];
