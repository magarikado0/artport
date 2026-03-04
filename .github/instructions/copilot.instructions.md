---
applyTo: '**'
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.
チャットには日本語で答えてください。コード例も日本語コメントでお願いします。
# Artport — GitHub Copilot Instructions

## プロダクト概要

**Artport** はアート発見プラットフォーム。
コンセプト:「興味がなかったアートに、気づいたら興味を持っていた」

ターゲット:
- 鑑賞者: 書道・陶芸などに興味がなかった人
- アーティスト: 展覧会の集客に悩む大学サークルなど

---

## 技術スタック

- **React 18** + **Vite**（TypeScriptなし、JavaScriptのみ）
- **Firebase**: Authentication（Googleログインのみ）/ Firestore / Storage
- **Tailwind CSS**（カスタムカラーあり）
- **React Router v6**
- **Gemini API**（モデル: `gemini-3-flash-preview`）

---

## カスタムカラー（tailwind.config.js）

```js
ink: '#1a1612'      // メインテキスト
paper: '#f7f4ef'    // 背景
warm: '#e8e0d4'     // セカンダリ背景
accent: '#c17f4a'   // ブランドカラー、AI関連要素
muted: '#8a7f74'    // サブテキスト
border: '#d4ccc2'   // ボーダー
```

## フォント

```
Cormorant Garamond → font-serif（タイトル）
Noto Sans JP       → font-sans（本文）
DM Mono            → font-mono（メタ情報、ラベル）
```

---

## ファイル構成

```
src/
├── lib/
│   ├── firebase.js      # Firebase初期化（環境変数から読み込み）
│   ├── firestore.js     # Firestore CRUD関数
│   ├── gemini.js        # Gemini API呼び出し
├── hooks/
│   └── useAuth.jsx      # 認証状態管理（AuthProvider + useAuth）
├── components/
│   ├── layout/
│   │   └── BottomNav.jsx
│   ├── shared/
│   │   └── GuideLoading.jsx  # ガイド生成中のローディング表示
│   └── artwork/
│       └── ExhibitionLink.jsx # 展覧会リンクコンポーネント
├── pages/
│   ├── LoginPage.jsx
│   ├── FeedPage.jsx
│   ├── ExhibitionsPage.jsx
│   ├── ExhibitionDetailPage.jsx
│   ├── ExhibitionCreatePage.jsx
│   ├── PostPage.jsx
│   ├── PortfolioPage.jsx
│   ├── CameraPage.jsx
│   ├── ArtistPage.jsx
│   └── ArtworkDetailPage.jsx  # 作品詳細ページ
├── styles/
│   └── index.css        # グローバルスタイル
├── App.jsx              # ルーティング定義
└── main.jsx             # アプリのエントリーポイント
```

---

## Firestoreのデータ構造

```
users/{uid}
  name, email, avatarUrl, role('viewer'|'artist'), bio, genre, createdAt

artworks/{artworkId}
  title, artistId, artistName, genre, imageUrl,
  guide(JSON文字列), exhibitionId, exhibitionTitle, createdAt

exhibitions/{exhibitionId}
  title, venue, genre(配列), startDate, endDate,
  openTime, closeTime, admission, description,
  coverUrl, artistId, artworkIds(配列), status, createdAt
```

---

## 画面構成とルーティング

| パス | 画面 | 備考 |
|---|---|---|
| `/login` | ログイン | Googleログインのみ |
| `/` | フィード | 作品一覧、Masonryグリッド |
| `/exhibitions` | 展覧会一覧 | |
| `/exhibitions/:id` | 展覧会詳細 | |
| `/exhibitions/create` | 展覧会作成 | |
| `/post` | 作品投稿 | |
| `/portfolio` | 鑑賞記録 | |
| `/camera` | カメラ | 作品スキャン→ガイド生成 |
| `/artists/:id` | アーティスト | |

---

## ボトムナビゲーション

```
⊞フィード  ◻展覧会  📷カメラ  ◯記録  △マイページ
```

- **中央はカメラ**（アプリの核心）
- 投稿・展覧会作成はマイページ内に設置

---

## AIガイド（Gemini）の仕様

### エンドポイント
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent
```

### キャッシュ戦略
- Firestoreの `artworks/{id}/guide` にJSON文字列で保存
- 2回目以降はGeminiを呼ばずキャッシュを使う
- カメラ撮影時は毎回Geminiを呼ぶ（キャッシュなし）

### レスポンス形式
```json
{
  "core": "作品の核心を表す一文（30字以内）",
  "points": [
    {"num": "01", "text": "ポイント1（50〜80字）"},
    {"num": "02", "text": "ポイント2（50〜80字）"},
    {"num": "03", "text": "ポイント3（50〜80字）"}
  ]
}
```

### generationConfig
```js
{
  temperature: 1.0,
  maxOutputTokens: 1000,
  thinkingConfig: { thinkingLevel: "minimal" }
}
```

---

## UIコンポーネントの規則

よく使うクラスは `src/styles/index.css` に定義済み:

```
.genre-tag      # ジャンルタグ（小さい丸バッジ）
.form-label     # フォームラベル
.form-input     # テキスト入力
.form-select    # セレクトボックス
.btn-primary    # メインボタン（黒背景）
.btn-secondary  # サブボタン（枠線のみ）
.guide-card     # AIガイドカード（黒背景）
.guide-label    # ガイドのラベル行
.guide-text     # ガイドのテキスト
.bottom-nav     # ボトムナビ
.nav-item       # ナビアイテム
.app-header     # ページヘッダー
.app-logo       # Artportロゴ
.section-title  # セクションタイトル
.filter-tab     # フィルタータブ
.artwork-card   # 作品カード
```

---

## コーディング規則

- コンポーネントは関数コンポーネントのみ（クラスコンポーネント不使用）
- カスタムフックは `src/hooks/` に置く
- Firestore操作は必ず `src/lib/firestore.js` の関数を使う（直接呼ばない）
- エラーハンドリングは必ず `try/catch` で行う
- データが空の場合はデモ用のフォールバックデータを表示する
- ローディング状態は必ずスケルトンまたはスピナーで表示する
- `async/await` を使う（`.then()` チェーンは使わない）
---