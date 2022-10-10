import { Middleware, SlackEventMiddlewareArgs } from "@slack/bolt";
import * as functions from "firebase-functions";

export const handleUserChange: Middleware<
  SlackEventMiddlewareArgs<"user_change">
> = async ({ event, context }) => {
  const { user } = event;
  if (!user.deleted) return; // deactivated 以外のイベントは無視

  functions.logger.log("User deactivated", { user });

  const rotationStore = context.rota.rotationStore;
  const rotations = await rotationStore.getByMember(user.id);

  for (const rotation of rotations) {
    const newRotation = rotation.removeMember(user.id);
    if (newRotation.members.length) {
      await rotationStore.set(newRotation);
      functions.logger.log("Deactivated user removed", { newRotation });
    } else {
      await rotationStore.delete(rotation.id);
      functions.logger.log("Rotation deleted", { rotation });
    }
  }
};
