import { NonFunctionProperties, Optional } from "../util";
import { Schedule, ScheduleJSON } from "./schedule";

type RotationArgs = NonFunctionProperties<Rotation>;
type RotationJSON = Omit<RotationArgs, "schedule"> & {
  readonly schedule: ScheduleJSON;
};

export class Rotation {
  readonly id: string;
  readonly members: readonly string[];
  readonly onDuty: string; // 担当者の user_id。members の中の 1 人
  readonly message: string;
  readonly channel: string;
  readonly schedule: Schedule;

  private constructor(args: RotationArgs) {
    this.id = args.id;
    this.members = args.members;
    this.onDuty = args.onDuty;
    this.message = args.message;
    this.channel = args.channel;
    this.schedule = args.schedule;
  }

  toJSON(): RotationJSON {
    return {
      id: this.id,
      members: this.members,
      onDuty: this.onDuty,
      message: this.message,
      channel: this.channel,
      schedule: this.schedule.toJSON(),
    };
  }

  static fromJSON(json: Optional<RotationJSON, "id" | "onDuty">): Rotation {
    return new Rotation({
      id: json.id ?? new Date().valueOf().toString(),
      members: json.members,
      onDuty: json.onDuty ?? json.members[json.members.length - 1],
      message: json.message,
      channel: json.channel,
      schedule: Schedule.fromJSON(json.schedule),
    });
  }

  rotate(): Rotation {
    const index = this.members.indexOf(this.onDuty);
    return new Rotation({
      ...this,
      onDuty: this.members[index + 1] ?? this.members[0],
    });
  }

  getOrderedRestMembers(): readonly string[] {
    const index = this.members.indexOf(this.onDuty);
    return [...this.members.slice(index + 1), ...this.members.slice(0, index)];
  }
}
