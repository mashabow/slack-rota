import { describe, it, expect } from "@jest/globals";
import {
  SettingModal,
  SettingSuccessMessage,
  RotationMessage,
} from "./component";
import { Rotation } from "./model/rotation";

const rotation = Rotation.fromJSON({
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

describe("SettingModal", () => {
  it("renders correctly", () => {
    expect(SettingModal({ channelId: "channel-id" })).toMatchSnapshot();
  });
});

describe("SettingSuccessMessage", () => {
  it("renders correctly", () => {
    expect(
      SettingSuccessMessage({
        rotation,
        userId: "user-x",
      })
    ).toMatchSnapshot();
  });
});

describe("RotationMessage", () => {
  it("renders correctly", () => {
    expect(RotationMessage({ rotation })).toMatchSnapshot();
  });
});
