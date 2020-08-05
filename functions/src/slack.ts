import * as functions from "firebase-functions";
import { App, ExpressReceiver } from "@slack/bolt";
import { RotationStore } from "./store";
import { Rotation } from "./rotation";
import {
  SettingModal,
  SettingSuccessMessage,
  RotationMessage,
  ID,
} from "./component";

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

  app.view(ID.SUBMIT_CALLBACK, async ({ ack, body, view, context }) => {
    await ack();
    // functions.logger.info("body", { body });

    const rotation: Rotation = {
      id: new Date().valueOf().toString(),
      members: view.state.values[ID.MEMBERS][ID.MEMBERS].selected_users,
      onDuty: view.state.values[ID.MEMBERS][ID.MEMBERS].selected_users[0],
      message: view.state.values[ID.MESSAGE][ID.MESSAGE].value,
      channel: JSON.parse(view.private_metadata)[ID.CHANNEL],
      hour: Number(view.state.values[ID.HOUR][ID.HOUR].selected_option.value),
      minute: Number(
        view.state.values[ID.MINUTE][ID.MINUTE].selected_option.value
      ),
    };

    await rotationStore.set(rotation);

    try {
      await app.client.chat.postMessage({
        token: config.slack.bot_token,
        channel: rotation.channel,
        text: "ローテーションが設定されました",
        blocks: SettingSuccessMessage({ rotation, userId: body.user.id }),
      });
    } catch (error) {
      functions.logger.error("error", { error });
    }
  });

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
