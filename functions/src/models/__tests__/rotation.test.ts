import { describe, it, expect, jest } from "@jest/globals";
import { Rotation } from "../rotation";

describe("Rotation", () => {
  const json = {
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
  };

  describe("toJSON", () => {
    it("converts an instance to a JSON object", () => {
      const rotation = Rotation.fromJSON(json);
      expect(rotation.toJSON()).toEqual(json);
    });
  });

  describe("fromJSON", () => {
    it("creates an instance from a JSON object", () => {
      const rotation = Rotation.fromJSON(json);
      expect(rotation.id).toBe(json.id);
      expect(rotation.installationId).toEqual(json.installationId);
      expect(rotation.members).toEqual(json.members);
      expect(rotation.channel).toBe(json.channel);
      expect(rotation.schedule.toJSON()).toEqual(json.schedule);
      expect(rotation.mentionAll).toBe(json.mentionAll);
    });

    it("defaults to unix timestamp for id", () => {
      Date.now = jest.fn(() => 1597200000000);
      const rotation = Rotation.fromJSON({ ...json, id: undefined });
      expect(rotation.id).toBe("1597200000000");
    });
  });

  describe("rotate", () => {
    it("rotates the members array", () => {
      const original = Rotation.fromJSON(json);
      const rotated = original.rotate();
      expect(rotated.members).toEqual(["user-b", "user-c", "user-a"]);

      expect(rotated).not.toBe(original);
      expect(rotated.id).toBe(original.id);
      expect(rotated.installationId).toEqual(original.installationId);
      expect(rotated.channel).toBe(original.channel);
      expect(rotated.schedule.toJSON()).toEqual(original.schedule.toJSON());
      expect(rotated.mentionAll).toBe(json.mentionAll);
    });
  });

  describe("unrotate", () => {
    it("unrotates the members array", () => {
      const original = Rotation.fromJSON(json);
      const unrotated = original.unrotate();
      expect(unrotated.members).toEqual(["user-c", "user-a", "user-b"]);

      expect(unrotated).not.toBe(original);
      expect(unrotated.id).toBe(original.id);
      expect(unrotated.installationId).toEqual(original.installationId);
      expect(unrotated.channel).toBe(original.channel);
      expect(unrotated.schedule.toJSON()).toEqual(original.schedule.toJSON());
      expect(unrotated.mentionAll).toBe(json.mentionAll);
    });
  });
});
