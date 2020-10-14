import { describe, it, expect } from "@jest/globals";
import {
  MockedWebClient,
  MockWebClient,
} from "@slack-wrench/jest-mock-web-client";
import * as admin from "firebase-admin";
import { setupFunctionsTest, postSlackEvent, rotations } from "./index.helper";

const test = setupFunctionsTest();

// setupFunctionsTest() の後で import する必要がある
// eslint-disable-next-line import/order
import { slack, cron } from "../index";

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

  // Firestore
  const rotationsRef = admin.firestore().collection("rotations");
  const getAllRotations = async () =>
    (await rotationsRef.get()).docs.map((doc) => doc.data());
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

  describe("slack", () => {
    describe("/rota command", () => {
      it("opens RotationModal", async () => {
        const res = await postSlackEvent(slack, {
          command: "/rota",
          text: "foobar",
          channel_id: "channel-id",
          trigger_id: "trigger-id",
          // ...more unused parameters
        });
        expect(res.body).toEqual({}); // ack
        expect(client.views.open.mock.calls).toMatchSnapshot();

        expect(await getAllRotations()).toEqual(rotations);
      });
    });

    describe("submit from RotationModal", () => {
      const payloadObj = {
        type: "view_submission",
        team: { id: "team-id", domain: "team-domain" },
        user: {
          id: "user-id",
          // ...snip
        },
        view: {
          type: "modal",
          private_metadata: '{"channel":"channel-id"}',
          callback_id: "submit_callback",
          state: {
            values: {
              hour: {
                hour: {
                  type: "static_select",
                  selected_option: {
                    text: {
                      type: "plain_text",
                      text: "23時",
                      emoji: true,
                    },
                    value: "23",
                  },
                },
              },
              minute: {
                minute: {
                  type: "static_select",
                  selected_option: {
                    text: {
                      type: "plain_text",
                      text: "45分",
                      emoji: true,
                    },
                    value: "45",
                  },
                },
              },
              members: {
                members: {
                  type: "multi_users_select",
                  selected_users: ["user-a", "user-b", "user-c"],
                },
              },
              message: {
                message: {
                  type: "plain_text_input",
                  value: "てすてす\n\n*テスト*です",
                },
              },
              days: {
                days: {
                  type: "multi_static_select",
                  selected_options: [
                    {
                      text: {
                        type: "plain_text",
                        text: "月曜",
                        emoji: true,
                      },
                      value: "1",
                    },
                    {
                      text: {
                        type: "plain_text",
                        text: "水曜",
                        emoji: true,
                      },
                      value: "3",
                    },
                    {
                      text: {
                        type: "plain_text",
                        text: "金曜",
                        emoji: true,
                      },
                      value: "5",
                    },
                  ],
                },
              },
              mention_all: {
                mention_all: {
                  type: "radio_buttons",
                  selected_option: {
                    text: {
                      type: "mrkdwn",
                      text: "全員にメンションする",
                      verbatim: true,
                    },
                    value: "true",
                  },
                },
              },
            },
          },
          // ...snip
        },
        // ...snip
      };
      const submittedRotation = {
        id: "1597200000000",
        channel: "channel-id",
        members: ["user-a", "user-b", "user-c"],
        message: "てすてす\n\n*テスト*です",
        onDuty: "user-c",
        schedule: {
          days: [1, 3, 5],
          hour: 23,
          minute: 45,
        },
        mentionAll: true,
      };

      it("creates a new rotation in Firestore and posts a CreateSuccessMessage", async () => {
        Date.now = jest.fn(() => 1597200000000);

        const res = await postSlackEvent(slack, {
          payload: JSON.stringify(payloadObj),
        });
        expect(res.body).toEqual({}); // ack
        expect(client.chat.postMessage.mock.calls).toMatchSnapshot();

        expect(await getAllRotations()).toEqual([
          submittedRotation,
          ...rotations,
        ]);
      });

      it("updates a existing rotation in Firestore and posts a CreateSuccessMessage", async () => {
        const res = await postSlackEvent(slack, {
          payload: JSON.stringify({
            ...payloadObj,
            view: {
              ...payloadObj.view,
              private_metadata:
                '{"rotation_id":"rotation-4","channel":"channel-id"}',
            },
          }),
        });
        expect(res.body).toEqual({}); // ack
        expect(client.chat.postMessage.mock.calls).toMatchSnapshot();

        expect(await getAllRotations()).toEqual([
          ...rotations.slice(0, 3),
          {
            ...submittedRotation,
            id: "rotation-4",
          },
        ]);
      });
    });

    describe("overflow menu actions", () => {
      const postOverflowAction = (selected_option: {
        readonly text: {
          readonly type: string;
          readonly text: string;
          readonly emoji: boolean;
        };
        readonly value: string;
      }) =>
        postSlackEvent(slack, {
          payload: JSON.stringify({
            type: "block_actions",
            user: {
              id: "user-id",
              // ...snip
            },
            container: {
              type: "message",
              message_ts: "1596814246.000200",
              channel_id: "channel-id",
              is_ephemeral: false,
              thread_ts: "1596814246.000200",
            },
            team: { id: "team-id", domain: "team-domain" },
            channel: { id: "channel-id", name: "channel-name" },
            actions: [
              {
                type: "overflow",
                action_id: "overflow_menu",
                block_id: "QpPST",
                selected_option,
                action_ts: "1597254212.672091",
              },
            ],
            // ...snip
          }),
        });

      describe("rotate", () => {
        it("rotates the selected rotation and posts that", async () => {
          const res = await postOverflowAction({
            text: {
              type: "plain_text",
              text: "ひとつ進む",
              emoji: true,
            },
            value: "rotate:rotation-1",
          });
          expect(res.body).toEqual({}); // ack
          expect(client.chat.postMessage.mock.calls).toMatchSnapshot();

          expect(await getAllRotations()).toEqual([
            { ...rotations[0], onDuty: "user-b" },
            rotations[1],
            rotations[2],
            rotations[3],
          ]);
        });

        it("posts 'already deleted' as ephemeral if the rotation not exist", async () => {
          const res = await postOverflowAction({
            text: {
              type: "plain_text",
              text: "ひとつ進む",
              emoji: true,
            },
            value: "rotate:rotation-not-exist",
          });
          expect(res.body).toEqual({}); // ack
          expect(client.chat.postEphemeral.mock.calls).toMatchSnapshot();

          expect(await getAllRotations()).toEqual(rotations);
        });
      });

      describe("unrotate", () => {
        it("unrotates the selected rotation and posts that", async () => {
          const res = await postOverflowAction({
            text: {
              type: "plain_text",
              text: "ひとつ戻る",
              emoji: true,
            },
            value: "unrotate:rotation-1",
          });
          expect(res.body).toEqual({}); // ack
          expect(client.chat.postMessage.mock.calls).toMatchSnapshot();

          expect(await getAllRotations()).toEqual([
            { ...rotations[0], onDuty: "user-c" },
            rotations[1],
            rotations[2],
            rotations[3],
          ]);
        });

        it("posts 'already deleted' as ephemeral if the rotation not exist", async () => {
          const res = await postOverflowAction({
            text: {
              type: "plain_text",
              text: "ひとつ戻る",
              emoji: true,
            },
            value: "unrotate:rotation-not-exist",
          });
          expect(res.body).toEqual({}); // ack
          expect(client.chat.postEphemeral.mock.calls).toMatchSnapshot();

          expect(
            (await rotationsRef.get()).docs.map((doc) => doc.data())
          ).toEqual(rotations);
        });
      });

      describe("delete", () => {
        it("deletes the selected rotation from Firestore and posts that", async () => {
          const res = await postOverflowAction({
            text: {
              type: "plain_text",
              text: "削除",
              emoji: true,
            },
            value: "delete:rotation-1",
          });
          expect(res.body).toEqual({}); // ack
          expect(client.chat.postMessage.mock.calls).toMatchSnapshot();

          expect(await getAllRotations()).toEqual(
            rotations.filter((r) => r.id !== "rotation-1")
          );
        });

        it("posts 'already deleted' as ephemeral if the rotation not exist", async () => {
          const res = await postOverflowAction({
            text: {
              type: "plain_text",
              text: "削除",
              emoji: true,
            },
            value: "delete:rotation-not-exist",
          });
          expect(res.body).toEqual({}); // ack
          expect(client.chat.postEphemeral.mock.calls).toMatchSnapshot();

          expect(await getAllRotations()).toEqual(rotations);
        });
      });
    });
  });

  describe("cron", () => {
    const wrappedCron = test.wrap(cron);

    it("posts matched rotations and updates onDuty fields of them", async () => {
      await wrappedCron({
        timestamp: "2020-08-08T22:33:44.000Z", // Sun, 09 Aug 2020 07:33:44 JST
      });
      expect(client.chat.postMessage.mock.calls).toMatchSnapshot();
      expect(await getAllRotations()).toEqual([
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
      expect(await getAllRotations()).toEqual(rotations);
    });
  });
});
