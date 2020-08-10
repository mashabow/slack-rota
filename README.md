# slack-rota

## テスト

### firebase-functions-test によるオンラインテスト

1. テスト用の Firebase プロジェクトを作成する
1. プロジェクトにウェブアプリを追加する
1. ⚙️ > プロジェクトを設定 > サービス アカウント > Firebase Admin SDK を表示し、[新しい秘密鍵の生成] をクリックする
1. ダウンロードした秘密鍵ファイルをリネームし、ルートディレクトリの `serviceAccountKey.json` に配置する
1. プロジェクト ID を `.env` ファイルの `TEST_PROJECT_ID` に設定する
