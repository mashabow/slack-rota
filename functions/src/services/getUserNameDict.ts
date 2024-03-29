import { WebClient } from "@slack/web-api";
import * as functions from "firebase-functions";
import { Rotation } from "../models/rotation";

/**
 * ローテーションの描画に必要な { [user_id]: user_name } の辞書を返す
 * （メンション**でない**ユーザー名の表示に必要になる）
 * rotation.mentionAll が true の場合は不要なので、null を返す
 */
export const getUserNameDict = async (
  rotation: Rotation,
  client: WebClient
): Promise<Record<string, string> | null> => {
  if (rotation.mentionAll) return null;

  try {
    const responses = await Promise.all(
      rotation.members.map((member) => client.users.info({ user: member }))
    );
    return responses.reduce<Record<string, string>>(
      (acc, { user }) => ({
        ...acc,
        // 型定義上は optional だが、正常系では必ず存在するはず
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        [user!.id!]:
          user?.profile?.display_name || user?.profile?.real_name || "???",
      }),
      {}
    );
  } catch (error) {
    functions.logger.error("error", { error });
  }
  return null;
};
