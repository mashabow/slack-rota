// eslint-disable-next-line no-undef
module.exports = {
  roots: ["<rootDir>/src"],
  preset: "ts-jest",
  testEnvironment: "node",
  globals: {
    "ts-jest": {
      // tsc からエラーが出てもテストは実行する
      diagnostics: { warnOnly: true },
    },
  },
};
