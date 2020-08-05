import * as functions from "firebase-functions";
import roundToNearestMinutes from "date-fns/roundToNearestMinutes";
import utcToZonedTime from "date-fns-tz/utcToZonedTime";
import { RotationStore } from "./store";
import { INTERVAL_MINUTES, Rotation, rotate } from "./rotation";

export const cronHandler = (
  rotationStore: RotationStore,
  postRotation: (rotation: Rotation) => Promise<void>
) => async (context: functions.EventContext): Promise<void> => {
  const utc = roundToNearestMinutes(new Date(context.timestamp), {
    nearestTo: INTERVAL_MINUTES,
  });
  const jst = utcToZonedTime(utc, "Asia/Tokyo");

  const rotations = await rotationStore.getByTime(
    jst.getHours(),
    jst.getMinutes()
  );
  functions.logger.log("rotations", { rotations });

  for (const rotation of rotations) {
    const newRotation = rotate(rotation);
    await postRotation(newRotation);
    await rotationStore.set(newRotation);
  }
};
