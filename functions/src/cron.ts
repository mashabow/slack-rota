import * as functions from "firebase-functions";
import roundToNearestMinutes from "date-fns/roundToNearestMinutes";
import utcToZonedTime from "date-fns-tz/utcToZonedTime";
import { RotationStore } from "./store";

export const cronHandler = (rotationStore: RotationStore) => async (
  context: functions.EventContext
): Promise<void> => {
  const utc = roundToNearestMinutes(new Date(context.timestamp), {
    nearestTo: 5,
  });
  const jst = utcToZonedTime(utc, "Asia/Tokyo");

  const rotations = await rotationStore.getByTime(
    jst.getHours(),
    jst.getMinutes()
  );

  functions.logger.log("rotations", { rotations });
};
