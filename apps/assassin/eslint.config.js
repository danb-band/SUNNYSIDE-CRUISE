import { createBaseConfig } from "global-eslint";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tsParser from "@typescript-eslint/parser";

const config = [
  ...createBaseConfig(),
  ...nextVitals,
  ...nextTs,

  {
    ignores: ["./eslint.config.js"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
  },
];

export default config;
