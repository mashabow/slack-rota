/** @jsx JSXSlack.h **/
import {
  JSXSlack,
  Modal,
  Input,
  Textarea,
  UsersSelect,
  Blocks,
  Section,
} from "@speee-js/jsx-slack";
import * as functions from "firebase-functions";
import { App, ExpressReceiver } from "@slack/bolt";
import { RotationStore } from "./store";
import { Rotation } from "./rotation";

const ID = {
  SUBMIT_CALLBACK: "submit_callback",
  MEMBERS: "members",
  MESSAGE: "message",
  CHANNEL: "channel",
} as const;

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

    const modal = JSXSlack(
      <Modal callbackId={ID.SUBMIT_CALLBACK} title="Rota" close="キャンセル">
        <UsersSelect
          id={ID.MEMBERS}
          name={ID.MEMBERS}
          required
          multiple
          label="メンバー"
        />
        <Textarea
          id={ID.MESSAGE}
          name={ID.MESSAGE}
          required
          label="メッセージ"
        />
        {/* TODO: 日時指定 */}
        <Input type="hidden" name={ID.CHANNEL} value={body.channel_id} />
        <Input type="submit" value="設定する" />
      </Modal>
    );

    try {
      const result = await app.client.views.open({
        token: context.botToken as string,
        trigger_id: body.trigger_id,
        view: modal,
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
      message: view.state.values[ID.MESSAGE][ID.MESSAGE].value,
      channel: JSON.parse(view.private_metadata)[ID.CHANNEL],
    };
    const userId = body.user.id;

    await rotationStore.set(rotation);

    const blocks = JSXSlack(
      <Blocks>
        <Section>
          <a href={`@${userId}`} />{" "}
          さんがこのチャンネルにローテーションを設定しました！
        </Section>
        <Section>
          <blockquote>{rotation.message}</blockquote>
        </Section>
      </Blocks>
    );

    try {
      await app.client.chat.postMessage({
        token: config.slack.bot_token,
        channel: rotation.channel,
        text: "ローテーションが設定されました",
        blocks,
      });
    } catch (error) {
      functions.logger.error("error", { error });
    }
  });

  return expressReceiver.app;
};
