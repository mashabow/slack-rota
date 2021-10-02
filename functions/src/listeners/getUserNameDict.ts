import { WebClient } from "@slack/web-api";
import * as functions from "firebase-functions";
import { Rotation } from "../model/rotation";

/**
 * ローテーションの描画に必要な { [user_id]: user_name } の辞書を返す
 * rotation.mentionAll が false の場合は不要なので、null を返す
 */
export const getUserNameDict = async (
  rotation: Rotation,
  client: WebClient
): Promise<Record<string, string> | null> => {
  if (!rotation.mentionAll) return null;

  try {
    const json = await client.users.list();
    // 型定義上は optional だが、正常系では必ず存在するはず
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return json.members!.reduce<Record<string, string>>(
      (acc, { id, profile }) => ({
        ...acc,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        [id!]: profile?.display_name || profile?.real_name || "",
      }),
      {}
    );
  } catch (error) {
    functions.logger.error("error", { error });
  }
  return null;
};
