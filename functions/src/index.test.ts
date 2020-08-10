import { describe, it, expect } from "@jest/globals";
import dotenv from "dotenv";
import functionsTest from "firebase-functions-test";

dotenv.config({ path: `${__dirname}/../../.env` });
const { TEST_PROJECT_ID } = process.env;
if (!TEST_PROJECT_ID) {
  throw new Error("Environment variable TEST_PROJECT_ID not set.");
}

const test = functionsTest(
  {
    projectId: `${TEST_PROJECT_ID}`,
    databaseURL: `https://${TEST_PROJECT_ID}.firebaseio.com`,
    storageBucket: `${TEST_PROJECT_ID}.appspot.com`,
  },
  `${__dirname}/../../serviceAccountKey.json`
);

import { cron } from "./index";

describe("functions", () => {
  afterEach(() => {
    test.cleanup();
  });

  describe("cron", () => {
    const wrappedCron = test.wrap(cron);

    it("test", async () => {
      await wrappedCron(undefined, {
        timestamp: "2020-08-08T22:33:44.000Z", // Sun, 09 Aug 2020 07:33:44 JST
      });
      expect(1).toBe(2);
    });
  });
});
