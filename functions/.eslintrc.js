// eslint-disable-next-line no-undef
module.exports = {
  root: true,
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  extends: [
    "eslint:recommended",
    "plugin:import/recommended",
    "plugin:import/react",
    "plugin:import/typescript",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "prettier/react",
    "prettier/@typescript-eslint",
  ],
  plugins: ["@typescript-eslint"],
  rules: {
    "import/newline-after-import": "error",
    "import/order": ["error", { alphabetize: { order: "asc" } }],
    "react/jsx-key": "off",
    "@typescript-eslint/ban-ts-comment": "off",
  },
};
