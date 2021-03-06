import crypto from "crypto";
import querystring from "querystring";
import dotenv from "dotenv";
import { HttpsFunction } from "firebase-functions";
import functionsTest from "firebase-functions-test";

import request from "supertest";
import { RotationJSON } from "../model/rotation";

const CONFIG = {
  slack: {
    bot_token: "dummy-bot-token",
    signing_secret: "dummy-signing-secret",
  },
};

export const setupFunctionsTest = (): ReturnType<typeof functionsTest> => {
  dotenv.config({ path: `${__dirname}/../../../.env` });
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
    `${__dirname}/../../../serviceAccountKey.json`
  );
  test.mockConfig(CONFIG);

  return test;
};

export const postSlackEvent = (
  httpsFunction: HttpsFunction,
  body: Record<string, string>
): request.Test => {
  const encodedBody = querystring.stringify(body);

  // https://api.slack.com/authentication/verifying-requests-from-slack#step-by-step_walk-through_for_validating_a_request
  const timestamp = Math.floor(Date.now() / 1000);
  const hmac = crypto.createHmac("sha256", CONFIG.slack.signing_secret);
  hmac.update(`v0:${timestamp}:${encodedBody}`);
  const signature = `v0=${hmac.digest("hex")}`;

  return request(httpsFunction)
    .post("/events")
    .set({
      "x-slack-signature": signature,
      "x-slack-request-timestamp": timestamp.toString(),
    })
    .send(encodedBody);
};

export const rotations: readonly RotationJSON[] = [
  {
    id: "rotation-1",
    members: ["user-a", "user-b", "user-c"],
    message: "rotation-1 message",
    channel: "channel-1",
    schedule: {
      days: [0],
      hour: 7,
      minute: 35,
    },
    mentionAll: true,
  },
  {
    id: "rotation-2",
    members: ["user-p", "user-q"],
    message: "rotation-2 message",
    channel: "channel-2",
    schedule: {
      days: [0, 6],
      hour: 7,
      minute: 35,
    },
    mentionAll: false,
  },
  {
    id: "rotation-3",
    members: ["user-s", "user-t"],
    message: "rotation-3 message",
    channel: "channel-3",
    schedule: {
      days: [0],
      hour: 22,
      minute: 35,
    },
    mentionAll: true,
  },
  {
    id: "rotation-4",
    members: ["user-x", "user-y", "user-z"],
    message: "rotation-4 message",
    channel: "channel-4",
    schedule: {
      days: [2, 3, 4, 5],
      hour: 7,
      minute: 35,
    },
    mentionAll: false,
  },
];
