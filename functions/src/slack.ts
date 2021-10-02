import { App, ExpressReceiver, BlockOverflowAction } from "@slack/bolt";
import * as functions from "firebase-functions";
import { RotationModal, RotationMessage, ID } from "./component";
import { getUserNameDict } from "./listeners/getUserNameDict";
import { overflowMenu } from "./listeners/overflowMenu";
import { slashRota } from "./listeners/slashRota";
import { submitCallback } from "./listeners/submitCallback";
import { Rotation } from "./model/rotation";
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

  app.command("/rota", slashRota);

  app.view(ID.SUBMIT_CALLBACK, submitCallback);

  app.action<BlockOverflowAction>(ID.OVERFLOW_MENU, overflowMenu);

  const postRotation = async (rotation: Rotation): Promise<void> => {
    const userNameDict = await getUserNameDict(rotation, app.client);
    try {
      await app.client.chat.postMessage({
        channel: rotation.channel,
        text: rotation.message,
        blocks: RotationMessage({ rotation, userNameDict }),
        unfurl_links: false,
      });
    } catch (error) {
      functions.logger.error("error", { error });
    }
  };

  return {
    slackHandler: expressReceiver.app,
    postRotation,
  };
};
