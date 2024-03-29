import { describe, it, expect } from "@jest/globals";
import { RotationModal, SuccessMessage, RotationMessage } from "../components";
import { Rotation } from "../models/rotation";

const rotationMentionAll = Rotation.fromJSON({
  id: "rotation-id",
  installationId: "installation-id",
  members: ["user-a", "user-b", "user-c"],
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
  installationId: "installation-id",
  members: ["user-a", "user-b", "user-c"],
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

describe("SuccessMessage", () => {
  it("renders correctly when mentionAll: true", () => {
    expect(
      SuccessMessage({
        rotation: rotationMentionAll,
        userId: "user-x",
        userNameDict: null,
        isUpdate: false,
      })
    ).toMatchSnapshot();
  });
  it("renders correctly when mentionAll: false", () => {
    expect(
      SuccessMessage({
        rotation: rotationNotMentionAll,
        userId: "user-x",
        userNameDict: {
          "user-a": "userA",
          "user-b": "userB",
          "user-c": "userC",
        },
        isUpdate: false,
      })
    ).toMatchSnapshot();
  });
  it("renders correctly when isUpdate: true", () => {
    expect(
      SuccessMessage({
        rotation: rotationMentionAll,
        userId: "user-x",
        userNameDict: null,
        isUpdate: true,
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
