import { App, ExpressReceiver, BlockOverflowAction } from "@slack/bolt";
import * as functions from "firebase-functions";
import { ID } from "./components";
import { handleModalSubmission } from "./listeners/handleModalSubmission";
import { handleOverflowAction } from "./listeners/handleOverflowAction";
import { openModal } from "./listeners/openModal";
import { Rotation } from "./models/rotation";
import { postRotation } from "./services/postRotation";
import { RotationStore } from "./store";

declare module "@slack/bolt" {
  interface Context {
    rota: {
      rotationStore: RotationStore;
    };
  }
}

const config = functions.config();

export const createSlackApp = (
  rotationStore: RotationStore
): {
  readonly slackHandler: ExpressReceiver["app"];
  readonly postRotation: (rotation: Rotation) => Promise<void>;
} => {
  const expressReceiver = new ExpressReceiver({
    signingSecret: config.slack.signing_secret,
    endpoints: "/events",
    processBeforeResponse: true,
  });

  const app = new App({
    receiver: expressReceiver,
    token: config.slack.bot_token,
  });

  app.use(async ({ context, next }) => {
    context.rota = { rotationStore };
    await next?.();
  });

  app.command("/rota", openModal);
  app.view(ID.SUBMIT_CALLBACK, handleModalSubmission);
  app.action<BlockOverflowAction>(ID.OVERFLOW_MENU, handleOverflowAction);

  return {
    slackHandler: expressReceiver.app,
    postRotation: (rotation) => postRotation(rotation, app.client),
  };
};
