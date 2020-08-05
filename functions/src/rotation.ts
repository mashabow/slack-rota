export const INTERVAL_MINUTES = 5;

export interface Rotation {
  readonly id: string;
  readonly members: readonly string[];
  readonly onDuty: string; // 担当者の user_id。member の中の 1 人
  readonly message: string;
  readonly channel: string;
  // JST
  readonly hour: number; // 0, 1, …, 23
  readonly minute: number; // 0, 5, …, 55
}

export const rotate = (rotation: Rotation): Rotation => {
  const index = rotation.members.indexOf(rotation.onDuty);
  return {
    ...rotation,
    onDuty: rotation.members[index + 1] ?? rotation.members[0],
  };
};
