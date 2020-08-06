import * as functions from "firebase-functions";
import { RotationStore } from "./store";
import { Rotation } from "./model/rotation";
import { Schedule } from "./model/schedule";

export const cronHandler = (
  rotationStore: RotationStore,
  postRotation: (rotation: Rotation) => Promise<void>
) => async (context: functions.EventContext): Promise<void> => {
  const schedule = Schedule.dateToNearestSchedule(new Date(context.timestamp));
  const rotations = await rotationStore.getBySchedule(schedule);
  functions.logger.log("rotations", { rotations });

  for (const rotation of rotations) {
    const newRotation = rotation.rotate();
    await postRotation(newRotation);
    await rotationStore.set(newRotation);
  }
};
