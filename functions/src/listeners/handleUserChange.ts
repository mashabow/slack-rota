import { Middleware, SlackEventMiddlewareArgs } from "@slack/bolt";
import * as functions from "firebase-functions";

export const handleUserChange: Middleware<
  SlackEventMiddlewareArgs<"user_change">
> = async ({ event, client, context }) => {
  functions.logger.info("event", { event });
};
