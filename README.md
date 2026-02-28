# Artport

アートの発見プラットフォーム。

## セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. Firebase プロジェクトの設定
`.env.local.example` を `.env.local` にコピーして、Firebase Console から値を記入してください。

```bash
cp .env.local.example .env.local
```

### 3. Firebase Console での設定
- Authentication → Google ログインを有効化
- Firestore → テストモードでデータベース作成
- Storage → バケット作成
- ルールは開発中は以下を使用:

```
// Firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. 起動
```bash
npm run dev
```

## 画面一覧
| パス | 画面 |
|---|---|
| `/login` | ログイン |
| `/` | フィード（作品一覧） |
| `/exhibitions` | 展覧会一覧 |
| `/exhibitions/:id` | 展覧会詳細 |
| `/exhibitions/create` | 展覧会作成 |
| `/post` | 作品投稿 |
| `/portfolio` | 鑑賞ポートフォリオ |
| `/artists/:id` | アーティストプロフィール |

## 技術スタック
- React 18 + Vite
- Firebase (Auth / Firestore / Storage)
- Tailwind CSS
- Gemini 2.0 Flash (Vision API)
- React Router v6
