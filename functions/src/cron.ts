import * as functions from "firebase-functions";
import roundToNearestMinutes from "date-fns/roundToNearestMinutes";
import utcToZonedTime from "date-fns-tz/utcToZonedTime";
import { RotationStore } from "./store";
import { Rotation } from "./model/rotation";
import { INTERVAL_MINUTES } from "./model/schedule";

export const cronHandler = (
  rotationStore: RotationStore,
  postRotation: (rotation: Rotation) => Promise<void>
) => async (context: functions.EventContext): Promise<void> => {
  const utc = roundToNearestMinutes(new Date(context.timestamp), {
    nearestTo: INTERVAL_MINUTES,
  });
  const jst = utcToZonedTime(utc, "Asia/Tokyo");

  const rotations = await rotationStore.getByTime(
    jst.getDay(),
    jst.getHours(),
    jst.getMinutes()
  );
  functions.logger.log("rotations", { rotations });

  for (const rotation of rotations) {
    const newRotation = rotation.rotate();
    await postRotation(newRotation);
    await rotationStore.set(newRotation);
  }
};
