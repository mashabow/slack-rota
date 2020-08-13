# slack-rota

## テスト

```console
$ cd functions/
$ npm run test
```

### firebase-functions-test によるオンラインテスト

`functions/src/index.test.ts` は[オンラインテスト](https://firebase.google.com/docs/functions/unit-testing?hl=ja#initializing)になっているため、Firebase 上にある実物の Firestore を使用します（一方、Functions はローカルで動作します）。以下の手順で、テスト用のプロジェクトを用意してください。

1. テスト用の Firebase プロジェクトを作成する
1. プロジェクトにウェブアプリを追加する
1. ⚙️ > プロジェクトを設定 > サービス アカウント > Firebase Admin SDK を表示し、[新しい秘密鍵の生成] をクリックする
1. ダウンロードした秘密鍵ファイルをリネームし、ルートディレクトリの `serviceAccountKey.json` に配置する
1. プロジェクト ID を `.env` ファイルの `TEST_PROJECT_ID` に設定する
