import * as functions from 'firebase-functions';
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


app.command('/rota', async ({ command, ack, say }) => {
  await ack();
  await say(`${command.text}`);
});
