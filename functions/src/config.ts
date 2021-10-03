import * as functions from "firebase-functions";

export interface FunctionsConfig {
  slack: {
    signing_secret: string;
    client_id: string;
    client_secret: string;
  };
}

export const getConfig = (): FunctionsConfig =>
  functions.config() as FunctionsConfig;
