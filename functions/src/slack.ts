import * as functions from "firebase-functions";
import { App, ExpressReceiver, BlockOverflowAction } from "@slack/bolt";
import { RotationStore } from "./store";
import { Rotation } from "./model/rotation";
import {
  SettingModal,
  SettingSuccessMessage,
  RotationMessage,
  ID,
} from "./component";
import { ro } from "date-fns/locale";

const config = functions.config();

export const createSlackApp = (rotationStore: RotationStore) => {
  const expressReceiver = new ExpressReceiver({
    signingSecret: config.slack.signing_secret,
    endpoints: "/events",
    processBeforeResponse: true,
  });

  const app = new App({
    receiver: expressReceiver,
    token: config.slack.bot_token,
  });

  app.command("/rota", async ({ ack, body, context }) => {
    await ack();

    try {
      const result = await app.client.views.open({
        token: context.botToken as string,
        trigger_id: body.trigger_id,
        view: SettingModal({ channelId: body.channel_id }),
      });
      functions.logger.info("result", { result });
    } catch (error) {
      functions.logger.error("error", { error });
    }
  });

  app.view(ID.SUBMIT_CALLBACK, async ({ ack, body, view }) => {
    await ack();

    const rotation = Rotation.fromJSON({
      members: view.state.values[ID.MEMBERS][ID.MEMBERS].selected_users,
      message: view.state.values[ID.MESSAGE][ID.MESSAGE].value,
      channel: JSON.parse(view.private_metadata)[ID.CHANNEL],
      schedule: {
        days: view.state.values[ID.DAYS][
          ID.DAYS
        ].selected_options.map((option: { value: string }) =>
          parseInt(option.value)
        ),
        hour: Number(view.state.values[ID.HOUR][ID.HOUR].selected_option.value),
        minute: Number(
          view.state.values[ID.MINUTE][ID.MINUTE].selected_option.value
        ),
      },
    });

    await rotationStore.set(rotation);

    const userId = body.user.id;
    try {
      await app.client.chat.postMessage({
        token: config.slack.bot_token,
        channel: rotation.channel,
        text: `<@${userId}> さんがローテーションを作成しました！`,
        blocks: SettingSuccessMessage({ rotation, userId }),
      });
    } catch (error) {
      functions.logger.error("error", { error });
    }
  });

  app.action<BlockOverflowAction>(
    ID.OVERFLOW_MENU,
    async ({ ack, action, body }) => {
      await ack();

      const [type, rotationId] = action.selected_option.value.split(":");
      switch (type) {
        case "delete": {
          // TODO: rotations が存在していない場合も成功するので、存在チェックを入れる？
          await rotationStore.delete(rotationId);
          try {
            // respond() だと reply_broadcast が効かない？
            await app.client.chat.postMessage({
              token: config.slack.bot_token,
              channel: body.channel!.id,
              text: `<@${body.user.id}> さんがこのローテーションを削除しました 👋`,
              thread_ts: body.container.message_ts,
              reply_broadcast: true,
            });
          } catch (error) {
            functions.logger.error("error", { error });
          }
        }
        default: {
          functions.logger.error("Unknown overflow menu action", { action });
          functions.logger.info("body", { body });
        }
      }
    }
  );

  const postRotation = async (rotation: Rotation): Promise<void> => {
    try {
      await app.client.chat.postMessage({
        token: config.slack.bot_token,
        channel: rotation.channel,
        text: rotation.message,
        blocks: RotationMessage({ rotation }),
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
