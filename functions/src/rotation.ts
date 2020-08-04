export interface Rotation {
  readonly id: string;
  readonly members: readonly string[];
  readonly message: string;
  readonly channel: string;
  readonly hour: number; // 0, 1, …, 23
  readonly minute: number; // 0, 5, …, 55
}
