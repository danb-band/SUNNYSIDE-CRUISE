import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import tsParser from "@typescript-eslint/parser";

/**
 * @returns {import("eslint").Linter.FlatConfig[]}
 */
export function createBaseConfig() {
  return [
    prettierConfig,
    {
      ignores: [".next/**", "out/**", "build/**", "next-env.d.ts", "node_modules/**"],
    },

    {
      files: ["**/*.{ts,tsx,js,jsx}"],
      languageOptions: {
        parser: tsParser,
        parserOptions: {
          project: false,
        },
      },
      plugins: {
        prettier: prettierPlugin,
      },
      rules: {
        "prettier/prettier": "error",
      },
    },
  ];
}
