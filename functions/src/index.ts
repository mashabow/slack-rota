import * as functions from 'firebase-functions';
import { slackApp } from './slack';

export const slack = functions.region("asia-northeast1").https.onRequest(slackApp);
