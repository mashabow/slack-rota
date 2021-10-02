import { Middleware, SlackCommandMiddlewareArgs } from "@slack/bolt";
import * as functions from "firebase-functions";
import { RotationModal } from "../component";

export const openModal: Middleware<SlackCommandMiddlewareArgs> = async ({
  ack,
  body,
  client,
}) => {
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
};
