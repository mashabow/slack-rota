/** @jsx JSXSlack.h **/
import { JSXSlack, Modal, Section } from "@speee-js/jsx-slack";
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

app.command("/rota", async ({ ack, body, context }) => {
  await ack();

  const modal = JSXSlack(
    <Modal title="Rota">
      <Section>Hello, world!</Section>
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
