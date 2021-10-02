import * as functions from "firebase-functions";
import { Rotation } from "./models/rotation";
import { Schedule } from "./models/schedule";
import { RotationStore } from "./store";

export const cronHandler =
  (
    rotationStore: RotationStore,
    postRotation: (rotation: Rotation) => Promise<void>
  ) =>
  async (context: functions.EventContext): Promise<void> => {
    const schedule = Schedule.dateToNearestSchedule(
      new Date(context.timestamp)
    );
    const rotations = await rotationStore.getBySchedule(schedule);
    functions.logger.log("rotations", { rotations });

    for (const rotation of rotations) {
      const newRotation = rotation.rotate();
      await rotationStore.set(newRotation);
      await postRotation(newRotation);
    }
  };
