import { App, ExpressReceiver, BlockOverflowAction } from "@slack/bolt";
import * as functions from "firebase-functions";
import { ID } from "./components";
import { handleModalSubmission } from "./listeners/handleModalSubmission";
import { handleOverflowAction } from "./listeners/handleOverflowAction";
import { openModal } from "./listeners/openModal";
import { Rotation } from "./models/rotation";
import { postRotation } from "./services/postRotation";
import { Stores } from "./stores";

declare module "@slack/bolt" {
  interface Context {
    rota: {
      rotationStore: Stores["rotationStore"];
    };
  }
}

const config = functions.config();

export const createSlackApp = ({
  rotationStore,
  installationStore,
}: Stores): {
  readonly slackHandler: ExpressReceiver["app"];
  readonly postRotation: (rotation: Rotation) => Promise<void>;
} => {
  const expressReceiver = new ExpressReceiver({
    signingSecret: config.slack.signing_secret,
    clientId: config.slack.client_id,
    clientSecret: config.slack.client_secret,
    // OAuth の state を生成するときの salt のようなもの
    // Firebase だと stateStore を自前で用意する必要ある？
    stateSecret: "my-state-secret",
    scopes: ["chat:write", "chat:write.public", "commands", "users:read"],
    installationStore: {
      storeInstallation: installationStore.set,
      fetchInstallation: installationStore.get,
      deleteInstallation: installationStore.delete,
    },
    endpoints: "/events",
    processBeforeResponse: true,
  });

  const app = new App({ receiver: expressReceiver });

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
