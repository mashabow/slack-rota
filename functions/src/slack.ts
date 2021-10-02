import {
  App,
  ExpressReceiver,
  BlockOverflowAction,
  ViewStateValue,
} from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import * as functions from "firebase-functions";
import {
  RotationModal,
  SuccessMessage,
  RotationMessage,
  ID,
} from "./component";
import { Rotation } from "./model/rotation";
import { RotationStore } from "./store";

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

  /**
   * { [user_id]: user_name } の辞書を返す
   */
  const getUserNameDict = async (
    client: WebClient
  ): Promise<Record<string, string> | null> => {
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

  app.command("/rota", async ({ ack, body, client }) => {
    await ack();

    try {
      const result = await client.views.open({
        trigger_id: body.trigger_id,
        view: RotationModal({ channelId: body.channel_id }),
      });
      functions.logger.info("result", { result });
    } catch (error) {
      functions.logger.error("error", { error });
    }
  });

  app.view(ID.SUBMIT_CALLBACK, async ({ ack, body, view, client }) => {
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

    await rotationStore.set(rotation);

    const userId = body.user.id;
    const userNameDict = rotation.mentionAll
      ? null
      : await getUserNameDict(client);
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
  });

  app.action<BlockOverflowAction>(
    ID.OVERFLOW_MENU,
    async ({ ack, action, body, client }) => {
      await ack();

      const channelId = body.channel?.id;
      if (!channelId) {
        functions.logger.error("Missing channel id", { body });
        return;
      }

      const userId = body.user.id;
      const [type, rotationId] = action.selected_option.value.split(":");
      const rotation = await rotationStore.get(rotationId);
      if (!rotation) {
        try {
          await client.chat.postEphemeral({
            channel: channelId,
            text: "このローテーションは削除済みです",
            user: userId,
          });
        } catch (error) {
          functions.logger.error("error", { error });
        }
        return;
      }

      switch (type) {
        case "edit":
          try {
            await client.views.open({
              trigger_id: body.trigger_id,
              view: RotationModal({
                channelId,
                rotation: rotation.rotate(), // 次回の担当者を先頭に表示したいので、rotate でずらしておく
              }),
            });
          } catch (error) {
            functions.logger.error("error", { error });
          }
          break;
        case "rotate":
          try {
            const newRotation = rotation.rotate();
            await rotationStore.set(newRotation);
            const userNameDict = newRotation.mentionAll
              ? null
              : await getUserNameDict(client);
            await client.chat.update({
              channel: channelId,
              ts: body.container.message_ts,
              text: newRotation.message,
              blocks: RotationMessage({ rotation: newRotation, userNameDict }),
              unfurl_links: false,
            });
          } catch (error) {
            functions.logger.error("error", { error });
          }
          break;
        case "unrotate":
          try {
            const newRotation = rotation.unrotate();
            await rotationStore.set(newRotation);
            const userNameDict = newRotation.mentionAll
              ? null
              : await getUserNameDict(client);
            await client.chat.update({
              channel: channelId,
              ts: body.container.message_ts,
              text: newRotation.message,
              blocks: RotationMessage({ rotation: newRotation, userNameDict }),
              unfurl_links: false,
            });
          } catch (error) {
            functions.logger.error("error", { error });
          }
          break;
        case "noop":
          break;
        case "delete":
          try {
            await rotationStore.delete(rotationId);
            // respond() だと reply_broadcast が効かない？
            await client.chat.postMessage({
              channel: channelId,
              text: `<@${userId}> さんがこのローテーションを削除しました 👋`,
              thread_ts: body.container.message_ts,
              reply_broadcast: true,
            });
          } catch (error) {
            functions.logger.error("error", { error });
          }
          break;
        default: {
          functions.logger.error("Unknown overflow menu action", { action });
          functions.logger.info("body", { body });
        }
      }
    }
  );

  const postRotation = async (rotation: Rotation): Promise<void> => {
    const userNameDict = rotation.mentionAll
      ? null
      : await getUserNameDict(app.client);
    try {
      await app.client.chat.postMessage({
        token: config.slack.bot_token,
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
