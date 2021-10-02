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
    clientId: config.slack.client_id,
    clientSecret: config.slack.client_secret,
    // OAuth の state を生成するときの salt のようなもの
    // Firebase だと stateStore を自前で用意する必要ある？
    stateSecret: "my-state-secret",
    scopes: ["chat:write", "chat:write.public", "commands", "users:read"],
    installationStore: {
      storeInstallation: async (installation) => {
        if (installation.isEnterpriseInstall && installation.enterprise) {
          // OrG 全体へのインストールに対応する場合
          return await database.set(installation.enterprise.id, installation);
        }
        if (installation.team) {
          // 単独のワークスペースへのインストールの場合
          return await database.set(installation.team.id, installation);
        }
        throw new Error("Failed saving installation data to installationStore");
      },
      fetchInstallation: async (installQuery) => {
        if (installQuery.isEnterpriseInstall && installQuery.enterpriseId) {
          // OrG 全体へのインストール情報の参照
          return await database.get(installQuery.enterpriseId);
        }
        if (installQuery.teamId) {
          // 単独のワークスペースへのインストール情報の参照
          return await database.get(installQuery.teamId);
        }
        throw new Error("Failed fetching installation");
      },
      deleteInstallation: async (installQuery) => {
        if (installQuery.isEnterpriseInstall && installQuery.enterpriseId) {
          // OrG 全体へのインストール情報の削除
          return await database.delete(installQuery.enterpriseId);
        }
        if (installQuery.teamId) {
          // 単独のワークスペースへのインストール情報の削除
          return await database.delete(installQuery.teamId);
        }
        throw new Error("Failed to delete installation");
      },
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
