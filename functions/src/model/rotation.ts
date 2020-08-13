import { NonFunctionProperties, Optional } from "../util";
import { Schedule, ScheduleJSON } from "./schedule";

type RotationArgs = NonFunctionProperties<Rotation>;
export type RotationJSON = Omit<RotationArgs, "schedule"> & {
  readonly schedule: ScheduleJSON;
};

export class Rotation {
  readonly id: string;
  readonly members: readonly string[];
  // 担当者の user_id。members の中の 1 人。
  // store には、「最後に post したときの担当者」の状態で保存する。「次の担当者」ではない。
  readonly onDuty: string;
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
      id: json.id ?? Date.now().toString(),
      members: json.members,
      // 初回 post 時に先頭のメンバーを onDuty にしたいので、末尾のメンバーを割り当てておく
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

  unrotate(): Rotation {
    const index = this.members.indexOf(this.onDuty);
    return new Rotation({
      ...this,
      onDuty: this.members[index - 1] ?? this.members[this.members.length - 1],
    });
  }

  getOrderedRestMembers(): readonly string[] {
    const index = this.members.indexOf(this.onDuty);
    return [...this.members.slice(index + 1), ...this.members.slice(0, index)];
  }
}
