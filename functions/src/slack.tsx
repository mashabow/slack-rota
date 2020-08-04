/** @jsx JSXSlack.h **/
import {
  JSXSlack,
  Modal,
  Input,
  Textarea,
  UsersSelect,
} from "@speee-js/jsx-slack";
import * as functions from "firebase-functions";
import { App, ExpressReceiver } from "@slack/bolt";

const config = functions.config();

const expressReceiver = new ExpressReceiver({
  signingSecret: config.slack.signing_secret,
  endpoints: "/events",
  processBeforeResponse: true,
});

const app = new App({
  receiver: expressReceiver,
  token: config.slack.bot_token,
});

export const slackApp = expressReceiver.app;

const ID = {
  SUBMIT_CALLBACK: "submit_callback",
  MEMBERS: "members",
  MESSAGE: "message",
  CHANNEL: "channel",
} as const;

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
      <Textarea id={ID.MESSAGE} name={ID.MESSAGE} required label="メッセージ" />
      {/* TODO: 日時指定 */}
      <Input type="hidden" name={ID.CHANNEL} value={body.channel_id} />
      <Input type="submit" value="登録" />
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
  functions.logger.info("body", { body });

  const values = {
    members: view.state.values[ID.MEMBERS][ID.MEMBERS].selected_users,
    message: view.state.values[ID.MESSAGE][ID.MESSAGE].value,
    channel: JSON.parse(view.private_metadata)[ID.CHANNEL],
  };
  const user = body.user.id;
  functions.logger.info("values, user", { values, user });
});
