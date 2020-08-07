import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { cronHandler } from "./cron";
import { INTERVAL_MINUTES } from "./model/schedule";
import { createSlackApp } from "./slack";
import { RotationStore } from "./store";

admin.initializeApp();

const db = admin.firestore();
const rotationStore = new RotationStore(db);
const { slackHandler, postRotation } = createSlackApp(rotationStore);

const functionBuilder = functions.region("asia-northeast1");

export const slack = functionBuilder.https.onRequest(slackHandler);

export const cron = functionBuilder.pubsub
  .schedule(`every ${INTERVAL_MINUTES} minutes synchronized`)
  .timeZone("Asia/Tokyo")
  .onRun(cronHandler(rotationStore, postRotation));
