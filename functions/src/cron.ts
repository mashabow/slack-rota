import * as functions from "firebase-functions";
import { Rotation } from "./model/rotation";
import { Schedule } from "./model/schedule";
import { RotationStore } from "./store";

export const cronHandler = (
  rotationStore: RotationStore,
  postRotation: (rotation: Rotation) => Promise<void>
) => async (context: functions.EventContext): Promise<void> => {
  const schedule = Schedule.dateToNearestSchedule(new Date(context.timestamp));
  const rotations = await rotationStore.getBySchedule(schedule);
  functions.logger.log("rotations", { rotations });

  for (const rotation of rotations) {
    await postRotation(rotation);
    await rotationStore.set(rotation.rotate());
  }
};
