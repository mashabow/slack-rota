import {
  Middleware,
  SlackViewAction,
  SlackViewMiddlewareArgs,
  ViewStateValue,
} from "@slack/bolt";
import * as functions from "firebase-functions";
import { ID, SuccessMessage } from "../component";
import { Rotation } from "../model/rotation";
import { getUserNameDict } from "./getUserNameDict";

export const handleModalSubmission: Middleware<
  SlackViewMiddlewareArgs<SlackViewAction>
> = async ({ ack, body, view, client, context }) => {
  await ack();

  const hiddenFields = JSON.parse(view.private_metadata);
  const getViewStateValue = (id: string): ViewStateValue =>
    view.state.values[id][id];

  const rotation = Rotation.fromJSON({
    id: hiddenFields[ID.ROTATION_ID], // 新規作成のときは undefined
    // 型定義上は optional だが、正常系では必ず存在するはず
    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    members: getViewStateValue(ID.MEMBERS).selected_users!,
    message: getViewStateValue(ID.MESSAGE).value!,
    channel: hiddenFields[ID.CHANNEL],
    schedule: {
      days: getViewStateValue(ID.DAYS).selected_options!.map(
        (option: { value: string }) => parseInt(option.value)
      ),
      hour: Number(getViewStateValue(ID.HOUR).selected_option!.value),
      minute: Number(getViewStateValue(ID.MINUTE).selected_option!.value),
    },
    mentionAll: JSON.parse(
      getViewStateValue(ID.MENTION_ALL).selected_option!.value
    ),
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
  }).unrotate(); // store には「前回の担当者が先頭」になるように保存するので、一つ戻した状態にする

  await context.rota.rotationStore.set(rotation);

  const userId = body.user.id;
  const userNameDict = await getUserNameDict(rotation, client);
  const isUpdate = Boolean(hiddenFields[ID.ROTATION_ID]);
  try {
    await client.chat.postMessage({
      channel: rotation.channel,
      text: `<@${userId}> さんがローテーションを${
        isUpdate ? "編集" : "作成"
      }しました！`,
      blocks: SuccessMessage({
        rotation,
        userId,
        userNameDict,
        isUpdate,
      }),
      unfurl_links: false,
    });
  } catch (error) {
    functions.logger.error("error", { error });
  }
};
