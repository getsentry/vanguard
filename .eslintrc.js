/**
 * @type {import('@types/eslint').Linter.BaseConfig}
 */
module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-unused-expressions": "off",
    "@typescript-eslint/ban-types": "off",
    "@typescript-eslint/no-require-imports": "off",
    "no-unused-vars": "off",
    "no-empty": "off",
    "no-useless-escape": "off",
    "@typescript-eslint/no-unsafe-function-type": "off",
  },
  settings: {
    jest: {
      version: 27,
    },
  },
};
