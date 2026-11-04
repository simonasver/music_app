import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
    globalIgnores([".vite/", "out/", "resources/"]),
    {
        files: ["**/*.{ts,tsx}"],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            importPlugin.flatConfigs.recommended,
            importPlugin.flatConfigs.electron,
            importPlugin.flatConfigs.typescript,
            react.configs.flat.recommended,
            reactHooks.configs.flat.recommended,
            prettier,
        ],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        settings: {
            react: {
                version: "detect",
            },
            "import/resolver": {
                typescript: true,
                node: true,
            },
        },
        rules: {
            "react/react-in-jsx-scope": "off",
            "import/no-unresolved": ["error", { ignore: ["^@/", "^@shared/"] }],
        },
    },
]);
