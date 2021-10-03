import crypto from "crypto";
import querystring from "querystring";
import { beforeEach, afterEach } from "@jest/globals";
import {
  MockedWebClient,
  MockWebClient,
} from "@slack-wrench/jest-mock-web-client";
import dotenv from "dotenv";
import * as admin from "firebase-admin";
import { HttpsFunction } from "firebase-functions";
import functionsTest from "firebase-functions-test";

import request from "supertest";

import { FunctionsConfig } from "../config";
import { installation, rotations } from "./index.fixture";

const CONFIG: FunctionsConfig = {
  slack: {
    client_id: "dummy-client-id",
    client_secret: "dummy-client-secret",
    signing_secret: "dummy-signing-secret",
  },
  rota: {
    state_secret: "dummy-state-secret",
  },
};

/**
 * オンラインテストのセットアップ
 */
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
  // @ts-expect-error: test.mockConfig の型定義が雑
  test.mockConfig(CONFIG);

  return test;
};

/**
 * Firebase Functions の関数に対して Slack の代わりにイベントを投げる
 *
 * @param httpsFunction Slack からのイベントを受け取る関数
 * @param body Slack からのリクエストボディ（イベントの内容）
 * @returns 関数が返すレスポンスの Promise
 */
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IsAny<T> = (any extends T ? true : false) extends true ? true : false;

/**
 * jest.Mock<any, any> である T の末端のプロパティを、ドット区切りの keyPath で列挙する
 */
type KeyPath<T> = {
  [K in keyof T]: K extends string
    ? // @slack-wrench/jest-mock-web-client の参照する jest の型定義が古い関係で、
      // 「jest.Mock<any, any> か否か」は「any か否か」で判別する必要がある
      IsAny<T[K]> extends true
      ? K // leaf
      : T[K] extends Record<string, unknown>
      ? `${K}.${KeyPath<T[K]>}`
      : never
    : never;
}[keyof T];

/**
 * Bolt 内部で使われている Slack API Client をモックする
 */
export const mockSlackWebClient = (): {
  getSlackWebClientCalls: (
    keyPath: KeyPath<MockWebClient>
  ) => readonly unknown[];
} => {
  let clients: MockWebClient[];

  beforeEach(() => {
    clients = MockedWebClient.mock.instances;
  });

  afterEach(() => {
    clients.map((client) => {
      client.chat.postMessage.mockClear();
      client.chat.update.mockClear();
      client.chat.postEphemeral.mockClear();
    });
  });

  return {
    // Bolt は複数の WebClient をプールして使い回すため、
    // メソッド呼び出し履歴を assert するためには、
    // 全 WebClient に対して、そのメソッドの .mock.calls を取得する必要がある
    getSlackWebClientCalls: (keyPath: KeyPath<MockWebClient>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const trace = (obj: any, keyPathParts: string[]): any => {
        if (keyPathParts.length === 0) return obj;
        const [head, ...rest] = keyPathParts;
        return trace(obj[head], rest);
      };

      return clients.map(
        (client) => trace(client, keyPath.split(".")).mock.calls
      );
    },
  };
};

export const setupFirestore = (): {
  getAllRotations: () => Promise<readonly FirebaseFirestore.DocumentData[]>;
} => {
  const db = admin.firestore();
  const rotationsRef = db.collection("rotations");
  const installationRef = db.collection("installations");

  beforeEach(async () => {
    // Prepare rotations and a installation
    await Promise.all(
      rotations.map((rotation) => rotationsRef.doc(rotation.id).set(rotation))
    );
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await installationRef.doc(installation.team!.id).set(installation);
  });

  afterEach(async () => {
    // Delete all rotations
    const snapshot = await rotationsRef.get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  });

  return {
    getAllRotations: async () =>
      (await rotationsRef.get()).docs.map((doc) => doc.data()),
  };
};
