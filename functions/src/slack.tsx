/** @jsx JSXSlack.h **/
import {
  JSXSlack,
  Modal,
  Input,
  Textarea,
  UsersSelect,
  Blocks,
  Section,
  Select,
  Option,
  Fragment,
  Mrkdwn,
} from "@speee-js/jsx-slack";
import * as functions from "firebase-functions";
import { App, ExpressReceiver } from "@slack/bolt";
import { RotationStore } from "./store";
import { Rotation, INTERVAL_MINUTES } from "./rotation";

const ID = {
  SUBMIT_CALLBACK: "submit_callback",
  MEMBERS: "members",
  MESSAGE: "message",
  CHANNEL: "channel",
  HOUR: "hour",
  MINUTE: "minute",
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
        <Input type="hidden" name={ID.CHANNEL} value={body.channel_id} />
        {/* TODO: 曜日指定 */}
        <Select id={ID.HOUR} name={ID.HOUR} required label="時" value="10">
          {[...Array(24)].map((_, i) => {
            const hour = i.toString();
            return <Option value={hour}>{hour}時</Option>;
          })}
        </Select>
        <Select id={ID.MINUTE} name={ID.MINUTE} required label="分" value="0">
          {[...Array(60 / INTERVAL_MINUTES)].map((_, i) => {
            const minute = (i * INTERVAL_MINUTES).toString();
            return <Option value={minute}>{minute}分</Option>;
          })}
        </Select>
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
      hour: Number(view.state.values[ID.HOUR][ID.HOUR].selected_option.value),
      minute: Number(
        view.state.values[ID.MINUTE][ID.MINUTE].selected_option.value
      ),
    };
    const userId = body.user.id;

    await rotationStore.set(rotation);

    const blocks = JSXSlack(
      <Blocks>
        <Section>
          <p>
            <a href={`@${userId}`} /> さんがローテーションを設定しました！
          </p>
          <p>
            {rotation.hour}:{rotation.minute.toString().padStart(2, "0")} に 👇
            のような感じでお知らせします
          </p>
        </Section>
        <Section>
          <Mrkdwn verbatim={false}>
            {rotation.message.split("\n").map((line) => (
              <Fragment>
                &gt; {line}
                <br />
              </Fragment>
            ))}
          </Mrkdwn>
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

  const postRotation = async (rotation: Rotation): Promise<void> => {
    // TODO: rotate
    const onDuty = rotation.members[0];

    const blocks = JSXSlack(
      <Blocks>
        <Section>
          <Mrkdwn verbatim={false}>
            {rotation.message.split("\n").map((line) => (
              <Fragment>
                {line}
                <br />
              </Fragment>
            ))}
          </Mrkdwn>
        </Section>
        <Section>
          👑 <a href={`@${onDuty}`} />
          {rotation.members.slice(1).map((member) => (
            <Fragment>
              {" → "}
              <a href={`@${member}`} />
            </Fragment>
          ))}
        </Section>
      </Blocks>
    );

    try {
      await app.client.chat.postMessage({
        token: config.slack.bot_token,
        channel: rotation.channel,
        text: rotation.message,
        blocks,
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
