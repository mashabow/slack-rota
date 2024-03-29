import { App, ExpressReceiver, BlockOverflowAction } from "@slack/bolt";
import { ID } from "./components";
import { getConfig } from "./config";
import { handleModalSubmission } from "./listeners/handleModalSubmission";
import { openModal } from "./listeners/openModal";
import { removeDeactivatedUser } from "./listeners/removeDeactivatedUser";
import { runOverflowAction } from "./listeners/runOverflowAction";
import { Rotation } from "./models/rotation";
import { postRotation } from "./services/postRotation";
import { Stores } from "./stores";
import { isBodyWithTypeEnterpriseInstall } from "./util";

declare module "@slack/bolt" {
  interface Context {
    rota: {
      rotationStore: Stores["rotationStore"];
      installationId: string;
    };
  }
}

export const createSlackApp = ({
  rotationStore,
  installationStore,
}: Stores): {
  readonly slackHandler: ExpressReceiver["app"];
  readonly postRotation: (rotation: Rotation) => Promise<void>;
} => {
  const config = getConfig();

  const expressReceiver = new ExpressReceiver({
    clientId: config.slack.client_id,
    clientSecret: config.slack.client_secret,
    signingSecret: config.slack.signing_secret,
    stateSecret: config.rota.state_secret,
    scopes: ["chat:write", "chat:write.public", "commands", "users:read"],
    installationStore: {
      storeInstallation: (i) => installationStore.set(i),
      fetchInstallation: (iq) => installationStore.get(iq),
      deleteInstallation: (iq) => installationStore.delete(iq),
    },
    installerOptions: {
      installPath: "/install",
      redirectUriPath: "/oauth_redirect",
    },
    endpoints: "/events",
    processBeforeResponse: true,
  });

  const app = new App({ receiver: expressReceiver });

  // 各リスナーで扱いやすいように、context に rotationStore と installationId を入れておく
  // リスナーの中では、引数 context を通じてアクセスできる
  app.use(async ({ context, body, next }) => {
    context.rota = {
      rotationStore,
      installationId: (isBodyWithTypeEnterpriseInstall(body)
        ? context.enterpriseId
        : context.teamId) as string,
    };
    await next?.();
  });

  // リスナーを定義
  app.command("/rota", openModal);
  app.view(ID.SUBMIT_CALLBACK, handleModalSubmission);
  app.action<BlockOverflowAction>(ID.OVERFLOW_MENU, runOverflowAction);
  app.event("user_change", removeDeactivatedUser);

  return {
    slackHandler: expressReceiver.app,
    postRotation: (rotation) => postRotation(rotation, app),
  };
};
