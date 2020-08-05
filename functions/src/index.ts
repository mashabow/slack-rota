import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { createSlackApp } from "./slack";
import { RotationStore } from "./store";
import { cronHandler } from "./cron";
import { INTERVAL_MINUTES } from "./rotation";

admin.initializeApp();

const db = admin.firestore();
const rotationStore = new RotationStore(db);
const slackApp = createSlackApp(rotationStore);

const functionBuilder = functions.region("asia-northeast1");

export const slack = functionBuilder.https.onRequest(slackApp);

export const cron = functionBuilder.pubsub
  .schedule(`every ${INTERVAL_MINUTES} minutes synchronized`)
  .timeZone("Asia/Tokyo")
  .onRun(cronHandler(rotationStore));
