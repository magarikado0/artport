# Artport

アートの発見プラットフォーム。

## セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. Firebase プロジェクトの設定
.env.localファイルにFirebase Console から値を記入してください。

#### モックデータの使用
開発環境でモックデータを使用する場合、`.env` ファイルに以下の設定を追加してください:

```
VITE_USE_MOCK_DATA=true
```

- `true`: FirebaseやGemini APIを使用せず、モックデータを利用します。
- `false`: 実際のFirebaseやGemini APIを使用します。

### 3. 起動
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
