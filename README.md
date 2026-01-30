# 漢字大好き (Kanji Daisuki)

日本語学習者向けのSNS。好きな漢字をアバターとして選び、日本語のみで投稿できるユニークなプラットフォームです。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com) でアカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクトのURLとAnon Keyを取得

### 3. 環境変数の設定

`.env.local` ファイルを作成:

```bash
cp .env.local.example .env.local
```

以下の値を設定:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. データベースのセットアップ

Supabase Dashboard の SQL Editor で以下を実行:

1. `supabase/schema.sql` - テーブル、関数、RLSポリシーの作成
2. `supabase/seed.sql` - 初期漢字データの投入

### 5. Storage バケットの作成

Supabase Dashboard > Storage で:

1. `post-images` という名前でバケットを作成
2. Public bucket に設定

または SQL Editor で:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true);
```

### 6. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

## 機能

- **漢字アバター**: 100種類の漢字から自分を表す1文字を選択（各漢字最大10名まで）
- **日本語限定投稿**: ひらがな・カタカナ・漢字・絵文字のみで投稿
- **画像投稿**: 投稿に画像を添付可能
- **いいね機能**: 投稿にいいねを送る
- **プロフィール**: 選んだ漢字とその理由を公開

## 技術スタック

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Icons**: Lucide React

## ディレクトリ構成

```
src/
├── app/                  # App Router pages
│   ├── (auth)/          # 認証ページ
│   ├── post/            # 投稿作成
│   ├── profile/         # プロフィール
│   ├── search/          # 漢字検索
│   ├── select/          # 漢字選択ウィザード
│   └── settings/        # 設定
├── components/          # 共通コンポーネント
├── lib/                 # Supabaseクライアント
├── types/               # TypeScript型定義
└── utils/               # ユーティリティ関数
```
