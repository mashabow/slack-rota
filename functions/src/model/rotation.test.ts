import { describe, it, expect } from "@jest/globals";
import { Rotation } from "./rotation";

describe("Rotation", () => {
  const json = {
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
      expect(rotation.members).toEqual(json.members);
      expect(rotation.onDuty).toBe(json.onDuty);
      expect(rotation.channel).toBe(json.channel);
      expect(rotation.schedule.toJSON()).toEqual(json.schedule);
      expect(rotation.mentionAll).toBe(json.mentionAll);
    });

    it("defaults to unix timestamp for id", () => {
      Date.now = jest.fn(() => 1597200000000);
      const rotation = Rotation.fromJSON({ ...json, id: undefined });
      expect(rotation.id).toBe("1597200000000");
    });

    it("defaults to the last member for onDuty", () => {
      const rotation = Rotation.fromJSON({ ...json, onDuty: undefined });
      expect(rotation.onDuty).toBe("user-c");
    });
  });

  describe("rotate", () => {
    it("rotates onDuty to the next member", () => {
      const original = Rotation.fromJSON(json);
      const rotated = original.rotate();
      expect(rotated.onDuty).toBe("user-c");

      expect(rotated).not.toBe(original);
      expect(rotated.id).toBe(original.id);
      expect(rotated.members).toEqual(original.members);
      expect(rotated.channel).toBe(original.channel);
      expect(rotated.schedule.toJSON()).toEqual(original.schedule.toJSON());
      expect(rotated.mentionAll).toBe(json.mentionAll);
    });

    it("rotates onDuty to the first member when onDuty was the last", () => {
      const original = Rotation.fromJSON({ ...json, onDuty: "user-c" });
      const rotated = original.rotate();
      expect(rotated.onDuty).toBe("user-a");

      expect(rotated).not.toBe(original);
      expect(rotated.id).toBe(original.id);
      expect(rotated.members).toEqual(original.members);
      expect(rotated.channel).toBe(original.channel);
      expect(rotated.schedule.toJSON()).toEqual(original.schedule.toJSON());
      expect(rotated.mentionAll).toBe(json.mentionAll);
    });
  });

  describe("unrotate", () => {
    it("unrotates onDuty to the previous member", () => {
      const original = Rotation.fromJSON(json);
      const rotated = original.unrotate();
      expect(rotated.onDuty).toBe("user-a");

      expect(rotated).not.toBe(original);
      expect(rotated.id).toBe(original.id);
      expect(rotated.members).toEqual(original.members);
      expect(rotated.channel).toBe(original.channel);
      expect(rotated.schedule.toJSON()).toEqual(original.schedule.toJSON());
      expect(rotated.mentionAll).toBe(json.mentionAll);
    });

    it("unrotates onDuty to the last member when onDuty was the first", () => {
      const original = Rotation.fromJSON({ ...json, onDuty: "user-a" });
      const rotated = original.unrotate();
      expect(rotated.onDuty).toBe("user-c");

      expect(rotated).not.toBe(original);
      expect(rotated.id).toBe(original.id);
      expect(rotated.members).toEqual(original.members);
      expect(rotated.channel).toBe(original.channel);
      expect(rotated.schedule.toJSON()).toEqual(original.schedule.toJSON());
      expect(rotated.mentionAll).toBe(json.mentionAll);
    });
  });

  describe("getOrderedRestMembers", () => {
    it("returns non-onDuty members in the rotation order", () => {
      const rotation = Rotation.fromJSON(json);
      expect(rotation.getOrderedRestMembers()).toEqual(["user-c", "user-a"]);
    });
  });
});
