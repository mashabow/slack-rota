import roundToNearestMinutes from "date-fns/roundToNearestMinutes";
import utcToZonedTime from "date-fns-tz/utcToZonedTime";
import { NonFunctionProperties } from "../util";

export const DAY_STRINGS = ["日", "月", "火", "水", "木", "金", "土"] as const;
export const INTERVAL_MINUTES = 5;

type ScheduleArgs = NonFunctionProperties<Schedule>;
export type ScheduleJSON = ScheduleArgs;

export class Schedule {
  // JST での時間
  readonly days: readonly number[]; // 0, 1, …, 6。日曜始まり
  readonly hour: number; // 0, 1, …, 23
  readonly minute: number; // 0, 5, …, 55

  private constructor(args: ScheduleArgs) {
    this.days = args.days;
    this.hour = args.hour;
    this.minute = args.minute;
  }

  toJSON(): ScheduleJSON {
    return {
      days: this.days,
      hour: this.hour,
      minute: this.minute,
    };
  }

  static fromJSON(json: ScheduleJSON): Schedule {
    return new Schedule({
      days: json.days,
      hour: json.hour,
      minute: json.minute,
    });
  }

  static dateToNearestSchedule(date: Date): Schedule {
    const utc = roundToNearestMinutes(date, {
      nearestTo: INTERVAL_MINUTES,
    });
    const jst = utcToZonedTime(utc, "Asia/Tokyo");

    return Schedule.fromJSON({
      days: [jst.getDay()],
      hour: jst.getHours(),
      minute: jst.getMinutes(),
    });
  }

  toString(): string {
    const days = this.days.map((day) => `${DAY_STRINGS[day]}曜`).join("・");
    const time = `${this.hour}:${this.minute.toString().padStart(2, "0")}`;
    return `${days}の ${time}`;
  }
}
