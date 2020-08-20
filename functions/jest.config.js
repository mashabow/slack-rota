// eslint-disable-next-line no-undef
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.[jt]s?(x)"],
  testPathIgnorePatterns: ["/lib/", "/node_modules/"],
  globals: {
    "ts-jest": {
      // tsc からエラーが出てもテストは実行する
      diagnostics: { warnOnly: true },
    },
  },
};
