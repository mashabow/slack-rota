import { describe, it, expect } from "@jest/globals";
import {
  MockedWebClient,
  MockWebClient,
} from "@slack-wrench/jest-mock-web-client";
import dotenv from "dotenv";
import * as admin from "firebase-admin";
import functionsTest from "firebase-functions-test";
import { RotationJSON } from "./model/rotation";

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
test.mockConfig({
  slack: {
    bot_token: "dummy-bot-token",
    signing_secret: "dummy-signing-secret",
  },
});

import { cron } from "./index";

describe("functions", () => {
  afterAll(() => {
    test.cleanup();
  });

  // Mock Slack API client
  let client: MockWebClient;
  beforeEach(async () => {
    client = MockedWebClient.mock.instances[0];
  });
  afterEach(async () => {
    MockedWebClient.mockClear();
  });

  describe("cron", () => {
    const wrappedCron = test.wrap(cron);
    const rotationsRef = admin.firestore().collection("rotations");
    const rotations: readonly RotationJSON[] = [
      {
        id: "rotation-1",
        members: ["user-a", "user-b", "user-c"],
        onDuty: "user-a",
        message: "rotation-1 message",
        channel: "channel-1",
        schedule: {
          days: [0],
          hour: 7,
          minute: 35,
        },
      },
      {
        id: "rotation-2",
        members: ["user-p", "user-q"],
        onDuty: "user-q",
        message: "rotation-2 message",
        channel: "channel-2",
        schedule: {
          days: [0, 6],
          hour: 7,
          minute: 35,
        },
      },
      {
        id: "rotation-3",
        members: ["user-s", "user-t"],
        onDuty: "user-s",
        message: "rotation-3 message",
        channel: "channel-3",
        schedule: {
          days: [0],
          hour: 22,
          minute: 35,
        },
      },
      {
        id: "rotation-4",
        members: ["user-x", "user-y", "user-z"],
        onDuty: "user-y",
        message: "rotation-4 message",
        channel: "channel-4",
        schedule: {
          days: [2, 3, 4, 5],
          hour: 7,
          minute: 35,
        },
      },
    ];
    let client: MockWebClient;

    beforeEach(async () => {
      // Prepare rotations in Firestore
      await Promise.all(
        rotations.map((rotation) => rotationsRef.doc(rotation.id).set(rotation))
      );
    });
    afterEach(async () => {
      // Delete all rotations from Firestore
      const snapshot = await rotationsRef.get();
      await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
    });

    it("updates onDuty fields of matched rotations", async () => {
      await wrappedCron({
        timestamp: "2020-08-08T22:33:44.000Z", // Sun, 09 Aug 2020 07:33:44 JST
      });
      expect(client.chat.postMessage).toHaveBeenCalledWith([]); // TODO

      const snapshot = await rotationsRef.get();
      expect(snapshot.docs.map((doc) => doc.data())).toEqual([
        { ...rotations[0], onDuty: "user-b" },
        { ...rotations[1], onDuty: "user-p" },
        rotations[2],
        rotations[3],
      ]);
    });
  });
});
