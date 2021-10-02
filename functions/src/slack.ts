import { App, ExpressReceiver, BlockOverflowAction } from "@slack/bolt";
import * as functions from "firebase-functions";
import { RotationModal, RotationMessage, ID } from "./component";
import { getUserNameDict } from "./listeners/getUserNameDict";
import { submitCallback } from "./listeners/submitCallback";
import { Rotation } from "./model/rotation";
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
    endpoints: "/events",
    processBeforeResponse: true,
  });

  const app = new App({
    receiver: expressReceiver,
    token: config.slack.bot_token,
  });

  app.use(async ({ context, next }) => {
    context.rota = { rotationStore };
    await next?.();
  });

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

  app.view(ID.SUBMIT_CALLBACK, submitCallback);

  app.action<BlockOverflowAction>(
    ID.OVERFLOW_MENU,
    async ({ ack, action, body, client, context }) => {
      await ack();

      const channelId = body.channel?.id;
      if (!channelId) {
        functions.logger.error("Missing channel id", { body });
        return;
      }

      const userId = body.user.id;
      const [type, rotationId] = action.selected_option.value.split(":");
      const rotation = await context.rota.rotationStore.get(rotationId);
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
        case "unrotate":
          try {
            const newRotation =
              type === "rotate" ? rotation.rotate() : rotation.unrotate();
            await context.rota.rotationStore.set(newRotation);
            const userNameDict = await getUserNameDict(newRotation, client);
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
            await context.rota.rotationStore.delete(rotationId);
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
    const userNameDict = await getUserNameDict(rotation, app.client);
    try {
      await app.client.chat.postMessage({
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
