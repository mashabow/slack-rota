import { describe, it, expect } from "@jest/globals";
import { Schedule } from "./schedule";

describe("Schedule", () => {
  const json = {
    days: [3, 0, 2],
    hour: 15,
    minute: 45,
  };

  describe("toJSON", () => {
    it("converts an instance to a JSON object", () => {
      const schedule = Schedule.fromJSON(json);
      expect(schedule.toJSON()).toEqual({
        days: [0, 2, 3],
        hour: 15,
        minute: 45,
      });
    });
  });

  describe("fromJSON", () => {
    it("creates an instance from a JSON object", () => {
      const schedule = Schedule.fromJSON(json);
      expect(schedule.days).toEqual([0, 2, 3]); // sorted
      expect(schedule.hour).toBe(15);
      expect(schedule.minute).toBe(45);
    });
  });

  describe("toJSON", () => {
    it("creates a nearest instance from a Date object", () => {
      const schedule = Schedule.dateToNearestSchedule(
        // Sun, 09 Aug 2020 07:33:44 JST
        new Date("Sat, 08 Aug 2020 22:33:44 GMT")
      );
      expect(schedule.days).toEqual([0]);
      expect(schedule.hour).toBe(7);
      expect(schedule.minute).toBe(35);
    });
  });

  describe("toString", () => {
    it("converts to a human-readable Japanese string", () => {
      const schedule = Schedule.fromJSON(json);
      expect(schedule.toString()).toBe("日曜・火曜・水曜の 15:45");
    });

    it("pads the minute with zero", () => {
      const schedule = Schedule.fromJSON({
        days: [0],
        hour: 8,
        minute: 5,
      });
      expect(schedule.toString()).toBe("日曜の 8:05");
    });
  });
});
