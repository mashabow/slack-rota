import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { createSlackApp } from "./slack";
import { RotationStore } from "./store";

admin.initializeApp();

const db = admin.firestore();
const rotationStore = new RotationStore(db);
const slackApp = createSlackApp(rotationStore);

export const slack = functions
  .region("asia-northeast1")
  .https.onRequest(slackApp);
