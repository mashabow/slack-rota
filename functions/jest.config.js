// eslint-disable-next-line no-undef
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  globals: {
    "ts-jest": {
      // tsc からエラーが出てもテストは実行する
      diagnostics: { warnOnly: true },
    },
  },
};
