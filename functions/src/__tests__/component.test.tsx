import { describe, it, expect } from "@jest/globals";
import {
  SettingModal,
  SettingSuccessMessage,
  RotationMessage,
} from "../component";
import { Rotation } from "../model/rotation";

const rotationMentionAll = Rotation.fromJSON({
  id: "rotation-id",
  members: ["user-a", "user-b", "user-c"],
  onDuty: "user-b",
  message: "message line 1\nmessage line 2",
  channel: "channel-id",
  schedule: {
    days: [2],
    hour: 23,
    minute: 45,
  },
  mentionAll: true,
});

const rotationNotMentionAll = Rotation.fromJSON({
  id: "rotation-id",
  members: ["user-a", "user-b", "user-c"],
  onDuty: "user-b",
  message: "message line 1\nmessage line 2",
  channel: "channel-id",
  schedule: {
    days: [2],
    hour: 23,
    minute: 45,
  },
  mentionAll: false,
});

describe("SettingModal", () => {
  it("renders correctly", () => {
    expect(SettingModal({ channelId: "channel-id" })).toMatchSnapshot();
  });
});

describe("SettingSuccessMessage", () => {
  it("renders correctly when mentionAll: true", () => {
    expect(
      SettingSuccessMessage({
        rotation: rotationMentionAll,
        userId: "user-x",
        userNameDict: null,
      })
    ).toMatchSnapshot();
  });
  it("renders correctly when mentionAll: false", () => {
    expect(
      SettingSuccessMessage({
        rotation: rotationNotMentionAll,
        userId: "user-x",
        userNameDict: {
          "user-a": "userA",
          "user-b": "userB",
          "user-c": "userC",
        },
      })
    ).toMatchSnapshot();
  });
});

describe("RotationMessage", () => {
  it("renders correctly when mentionAll: true", () => {
    expect(
      RotationMessage({ rotation: rotationMentionAll, userNameDict: null })
    ).toMatchSnapshot();
  });
  it("renders correctly when mentionAll: false", () => {
    expect(
      RotationMessage({
        rotation: rotationNotMentionAll,
        userNameDict: {
          "user-a": "userA",
          "user-b": "userB",
          "user-c": "userC",
        },
      })
    ).toMatchSnapshot();
  });
});
