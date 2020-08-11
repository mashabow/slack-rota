import crypto from "crypto";
import querystring from "querystring";
import { HttpsFunction } from "firebase-functions";
import request from "supertest";

export const CONFIG = {
  slack: {
    bot_token: "dummy-bot-token",
    signing_secret: "dummy-signing-secret",
  },
};

export const postSlackEvent = (
  httpsFunction: HttpsFunction,
  body: Record<string, string>
): request.Test => {
  const encodedBody = querystring.stringify(body);

  // https://api.slack.com/authentication/verifying-requests-from-slack#step-by-step_walk-through_for_validating_a_request
  const timestamp = Math.floor(Date.now() / 1000);
  const hmac = crypto.createHmac("sha256", CONFIG.slack.signing_secret);
  hmac.update(`v0:${timestamp}:${encodedBody}`);
  const signature = `v0=${hmac.digest("hex")}`;

  return request(httpsFunction)
    .post("/events")
    .set({
      "x-slack-signature": signature,
      "x-slack-request-timestamp": timestamp.toString(),
    })
    .send(encodedBody);
};
