import { App, Authorize, AuthorizeSourceData } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import * as functions from "firebase-functions";
import { RotationMessage } from "../components";
import { Rotation } from "../models/rotation";
import { getUserNameDict } from "./getUserNameDict";

export const postRotation = async (
  rotation: Rotation,
  app: App
): Promise<void> => {
  //
  // rotation.installationId を元に botToken を取得し、それをセットした client を作成
  //
  const isEnterpriseInstall = rotation.installationId.startsWith("E");
  // @ts-expect-error private field に無理やりアクセスしている
  const { botToken } = await (app.authorize as Authorize<boolean>)(
    isEnterpriseInstall
      ? ({
          isEnterpriseInstall,
          enterpriseId: rotation.installationId,
        } as AuthorizeSourceData<true>)
      : ({
          isEnterpriseInstall,
          teamId: rotation.installationId,
        } as AuthorizeSourceData<false>)
  );
  // @ts-expect-error private field に無理やりアクセスしている
  const client = new WebClient(botToken, app.clientOptions);

  const userNameDict = await getUserNameDict(rotation, client);
  try {
    await client.chat.postMessage({
      channel: rotation.channel,
      text: rotation.message,
      blocks: RotationMessage({ rotation, userNameDict }),
      unfurl_links: false,
    });
  } catch (error) {
    functions.logger.error("error", { error });
  }
};
