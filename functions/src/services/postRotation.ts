import { WebClient } from "@slack/web-api";
import * as functions from "firebase-functions";
import { RotationMessage } from "../component";
import { Rotation } from "../model/rotation";
import { getUserNameDict } from "./getUserNameDict";

export const postRotation = async (
  rotation: Rotation,
  client: WebClient
): Promise<void> => {
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
