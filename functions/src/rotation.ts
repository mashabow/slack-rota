import { NonFunctionProperties, Optional } from "./util";

export const INTERVAL_MINUTES = 5;

type RotationJSON = NonFunctionProperties<Rotation>;

export class Rotation {
  readonly id: string;
  readonly members: readonly string[];
  readonly onDuty: string; // 担当者の user_id。member の中の 1 人
  readonly message: string;
  readonly channel: string;
  // JST
  readonly hour: number; // 0, 1, …, 23
  readonly minute: number; // 0, 5, …, 55

  private constructor(args: RotationJSON) {
    this.id = args.id;
    this.members = args.members;
    this.onDuty = args.onDuty;
    this.message = args.message;
    this.channel = args.channel;
    this.hour = args.hour;
    this.minute = args.minute;
  }

  toJSON(): RotationJSON {
    return {
      id: this.id,
      members: this.members,
      onDuty: this.onDuty,
      message: this.message,
      channel: this.channel,
      hour: this.hour,
      minute: this.minute,
    };
  }

  static fromJSON(json: Optional<RotationJSON, "id" | "onDuty">): Rotation {
    return new Rotation({
      id: json.id ?? new Date().valueOf().toString(),
      members: json.members,
      onDuty: json.onDuty ?? json.members[json.members.length - 1],
      message: json.message,
      channel: json.channel,
      hour: json.hour,
      minute: json.minute,
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
