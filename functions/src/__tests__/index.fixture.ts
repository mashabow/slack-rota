import { Installation } from "@slack/bolt";
import { RotationJSON } from "../models/rotation";

export const rotations: readonly RotationJSON[] = [
  {
    id: "rotation-1",
    installationId: "team-id",
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
    installationId: "team-id",
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
    installationId: "team-id",
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
    installationId: "another-team-id",
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

export const installation: Installation = {
  team: { id: "team-id", name: "workspace name" },
  enterprise: undefined,
  user: { token: undefined, scopes: undefined, id: "user-id" },
  tokenType: "bot",
  isEnterpriseInstall: false,
  appId: "app-id",
  authVersion: "v2",
  bot: {
    scopes: [
      "chat:write",
      "commands",
      "chat:write.public",
      "channels:read",
      "users:read",
    ],
    token: "xoxb-...",
    userId: "bot-user-id",
    id: "bot-id",
  },
};

export const submissionPayload = {
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

export const submittedRotation: RotationJSON = {
  id: "1597200000000",
  installationId: "team-id",
  channel: "channel-id",
  members: ["user-c", "user-a", "user-b"],
  message: "てすてす\n\n*テスト*です",
  schedule: {
    days: [1, 3, 5],
    hour: 23,
    minute: 45,
  },
  mentionAll: true,
};
