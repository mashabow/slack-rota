import * as functions from "firebase-functions";

export interface FunctionsConfig {
  // Slack のアプリ設定画面 Basic Information > App Credentials から取得
  slack: {
    signing_secret: string;
    client_id: string;
    client_secret: string;
  };
  // 任意の値を設定
  rota: {
    state_secret: string; // OAuth の state パラメータの JWT 署名に使う
  };
}

export const getConfig = (): FunctionsConfig =>
  functions.config() as FunctionsConfig;
