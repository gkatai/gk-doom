import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import jestPlugin from "eslint-plugin-jest";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["**/*.test.js", "**/*.spec.js"],
    plugins: { jest: jestPlugin },
    languageOptions: {
      globals: { ...jestPlugin.environments.globals.globals },
    },
    rules: {
      ...jestPlugin.configs["flat/recommended"].rules,
    },
  },
]);
