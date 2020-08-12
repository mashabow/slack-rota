import { describe, it, expect } from "@jest/globals";
import {
  MockedWebClient,
  MockWebClient,
} from "@slack-wrench/jest-mock-web-client";
import dotenv from "dotenv";
import * as admin from "firebase-admin";
import functionsTest from "firebase-functions-test";
import { RotationJSON } from "./model/rotation";
import { CONFIG, postSlackEvent } from "./test-helper";

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
test.mockConfig(CONFIG);

import { slack, cron } from "./index";

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
    client.chat.postMessage.mockClear();
  });

  describe("slack", () => {
    describe("/rota command", () => {
      it("opens SettingModal", async () => {
        const res = await postSlackEvent(slack, {
          command: "/rota",
          text: "foobar",
          channel_id: "channel-id",
          trigger_id: "trigger-id",
          // ...more unused parameters
        });
        expect(res.body).toEqual({}); // ack
        expect(client.views.open.mock.calls).toMatchSnapshot();
      });
    });
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

    it("posts matched rotations and updates onDuty fields of them", async () => {
      await wrappedCron({
        timestamp: "2020-08-08T22:33:44.000Z", // Sun, 09 Aug 2020 07:33:44 JST
      });
      expect(client.chat.postMessage.mock.calls).toMatchSnapshot();
      expect((await rotationsRef.get()).docs.map((doc) => doc.data())).toEqual([
        { ...rotations[0], onDuty: "user-b" },
        { ...rotations[1], onDuty: "user-p" },
        rotations[2],
        rotations[3],
      ]);
    });

    it("does nothing when no rotation matched", async () => {
      await wrappedCron({
        timestamp: "2020-08-09T22:33:44.000Z", // Mon, 10 Aug 2020 07:33:44 JST
      });
      expect(client.chat.postMessage.mock.calls).toEqual([]);
      expect((await rotationsRef.get()).docs.map((doc) => doc.data())).toEqual(
        rotations
      );
    });
  });
});
