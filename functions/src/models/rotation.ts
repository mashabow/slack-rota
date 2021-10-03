import { NonFunctionProperties, Optional } from "../util";
import { Schedule, ScheduleJSON } from "./schedule";

type RotationArgs = NonFunctionProperties<Rotation>;
export type RotationJSON = Omit<RotationArgs, "schedule"> & {
  readonly schedule: ScheduleJSON;
};

export class Rotation {
  readonly id: string;
  readonly installationId: string;
  // members の先頭が担当者。store には、最後に post したときの状態で保存する
  readonly members: readonly string[];
  readonly message: string;
  readonly channel: string;
  readonly schedule: Schedule;
  readonly mentionAll: boolean;

  private constructor(args: RotationArgs) {
    this.id = args.id;
    this.installationId = args.installationId;
    this.members = args.members;
    this.message = args.message;
    this.channel = args.channel;
    this.schedule = args.schedule;
    this.mentionAll = args.mentionAll;
  }

  toJSON(): RotationJSON {
    return {
      id: this.id,
      installationId: this.installationId,
      members: this.members,
      message: this.message,
      channel: this.channel,
      schedule: this.schedule.toJSON(),
      mentionAll: this.mentionAll,
    };
  }

  static fromJSON(json: Optional<RotationJSON, "id">): Rotation {
    return new Rotation({
      id: json.id ?? Date.now().toString(),
      installationId: json.installationId,
      members: json.members,
      message: json.message,
      channel: json.channel,
      schedule: Schedule.fromJSON(json.schedule),
      mentionAll: json.mentionAll,
    });
  }

  rotate(): Rotation {
    return new Rotation({
      ...this,
      members: [...this.members.slice(1), this.members[0]],
    });
  }

  unrotate(): Rotation {
    return new Rotation({
      ...this,
      members: [
        this.members[this.members.length - 1],
        ...this.members.slice(0, -1),
      ],
    });
  }
}
