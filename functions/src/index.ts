import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { cronHandler } from "./cron";
import { INTERVAL_MINUTES } from "./models/schedule";
import { createSlackApp } from "./slack";
import { createStores } from "./stores";

admin.initializeApp();

const stores = createStores(admin.firestore());
const { slackHandler, postRotation } = createSlackApp(stores);

const functionBuilder = functions.region("asia-northeast1");

export const slack = functionBuilder.https.onRequest(slackHandler);

export const cron = functionBuilder.pubsub
  .schedule(`every ${INTERVAL_MINUTES} minutes synchronized`)
  .timeZone("Asia/Tokyo")
  .onRun(cronHandler(stores.rotationStore, postRotation));
