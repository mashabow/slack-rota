import { describe, it, expect } from "@jest/globals";
import {
  RotationModal,
  CreateSuccessMessage,
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

describe("RotationModal", () => {
  describe("without `rotation` prop", () => {
    it("renders a modal to create a new rotation", () => {
      expect(RotationModal({ channelId: "channel-id" })).toMatchSnapshot();
    });
  });

  describe("with `rotation` prop", () => {
    it("renders as a modal to edit an existing rotation", () => {
      expect(
        RotationModal({
          channelId: "channel-id",
          rotation: rotationNotMentionAll,
        })
      ).toMatchSnapshot();
    });
  });
});

describe("CreateSuccessMessage", () => {
  it("renders correctly when mentionAll: true", () => {
    expect(
      CreateSuccessMessage({
        rotation: rotationMentionAll,
        userId: "user-x",
        userNameDict: null,
      })
    ).toMatchSnapshot();
  });
  it("renders correctly when mentionAll: false", () => {
    expect(
      CreateSuccessMessage({
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
