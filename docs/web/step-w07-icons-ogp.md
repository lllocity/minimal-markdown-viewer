# Step W07: アイコン / OGP / メタデータ整備（Web 版）

## 目的

Web 版に「アプリらしい見た目」と「共有したときの見栄え」を与える。具体的には:

- **ファビコン / アプリアイコン**: ブラウザタブ・ブックマーク・iOS ホーム画面に出るアイコン。
- **OGP 画像 / メタデータ**: SNS やチャットにリンクを貼ったときに出るカード（タイトル・説明・画像）。

> 用語メモ
> - **OGP（Open Graph Protocol）**: リンクをシェアしたとき、相手側（X / Slack / Facebook 等）が
>   ページの `<head>` にある `og:*` メタタグを読んでカード表示する仕組み。
> - **ファイル規約（file convention）**: Next.js では `app/` に決まった名前の画像を置くだけで、
>   対応する `<head>` タグ（`<link rel="icon">` や `<meta property="og:image">`）が自動生成される。

## 前提条件

- W06 まで完了（ビューア本体とロジックのテストが揃っている）。
- ロゴ画像（本 + "markdown" のデザイン）が用意できていること。

## 手順

### 1. 画像を Next.js のファイル規約どおりに配置

`web/app/` 直下に以下を置く（拡張子・サイズは規約に合わせる）:

| ファイル | サイズ | 役割 | 生成される `<head>` |
|----------|--------|------|---------------------|
| `favicon.ico` | 256×256 | ブラウザタブ | `<link rel="icon" ...ico>` |
| `icon.png` | 512×512 | 汎用アイコン | `<link rel="icon" ...png>` |
| `apple-icon.png` | 180×180 | iOS ホーム画面 | `<link rel="apple-touch-icon" ...>` |
| `opengraph-image.png` | 1200×630 | SNS カード画像 | `<meta property="og:image" ...>`（+ `twitter:image` も自動付与） |
| `opengraph-image.alt.txt` | — | OGP 画像の代替テキスト | `<meta property="og:image:alt" ...>` |

> **画像を置くだけ**で `<head>` タグは自動生成される。`layout.tsx` に手書きする必要はない。

### 2. `app/layout.tsx` にメタデータを補完

ファイル規約で補えない「テキスト系メタデータ」を `metadata` オブジェクトで足す:

- `metadataBase`: OGP 画像を**絶対 URL**にするための基準 URL。
  認証で使う `AUTH_URL` を再利用（ローカルは `http://localhost:3000`、本番は W08 で Vercel ドメイン）。
- `openGraph`: `type` / `locale` / `siteName` / `title` / `description`。画像はファイル規約から自動マージ。
- `twitter`: `card: "summary_large_image"`（大画像カード）。`twitter:image` は `opengraph-image.png` から自動付与される。

```ts
const appUrl = process.env.AUTH_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: appName,
  description: appDescription,
  applicationName: appName,
  openGraph: { type: "website", locale: "ja_JP", siteName: appName, title: appName, description: appDescription },
  twitter: { card: "summary_large_image", title: appName, description: appDescription },
};
```

### 3. 動作確認

```bash
cd web
npm run lint    # 警告なし
npm test        # 15 件緑（W06 から不変。View/メタデータはテスト対象外）
npm run build   # 成功。ルート一覧に /icon.png /apple-icon.png /opengraph-image.png が出る
```

さらに実際の `<head>` を確認:

```bash
npm start &
curl -s http://localhost:3000 | grep -oE '<meta[^>]*og:[^>]*>|<link[^>]*icon[^>]*>'
```

## 確認ポイント（どうなれば成功か）

- `npm run build` のルート一覧に `/icon.png` `/apple-icon.png` `/opengraph-image.png` が **○（Static）** で出る。
- ページの `<head>` に以下が出力される:
  - `og:title` / `og:description` / `og:site_name` / `og:locale` / `og:type`
  - `og:image`（`width=1200` `height=630`）と `og:image:alt`
  - `twitter:card=summary_large_image` と `twitter:image`
  - `<link rel="icon">`（favicon.ico / icon.png）と `<link rel="apple-touch-icon">`
- `og:image` の URL が `AUTH_URL` を基準にした**絶対 URL**になっている。
- ビルド時に `metadataBase` に関する警告が出ない。

## よくあるエラーと対処法

| 症状 | 原因 / 対処 |
|------|------|
| ビルドで `metadataBase` の警告 | `metadata.metadataBase` 未設定。`new URL(AUTH_URL)` を設定する |
| `og:image` の URL が `localhost` のまま本番に出る | 本番の `AUTH_URL` が未設定。W08 で Vercel の環境変数に本番ドメインを入れる |
| `web/public` という**ファイル**ができてしまった | 画像保存時の事故。Next.js は `public` という名前のファイルを配信できないので削除する（アイコンは `app/` のファイル規約で足りる） |
| X でカード画像が出ない | `twitter:card` 未設定。`summary_large_image` を設定すれば `og:image` をフォールバック利用する |

## 学んだこと・メモ

- **「画像を置くだけ」でアイコン/OGP タグが自動生成される**のが Next.js ファイル規約の強み。
  `layout.tsx` には規約で補えないテキスト系だけを書けばよい。
- `opengraph-image.png` を置くと `og:image` に加えて `twitter:image` も自動で付く（想定より手厚い）。
- OGP の絶対 URL には基準 URL が要る。認証用の `AUTH_URL` を使い回すことで env 変数を増やさずに済んだ。
  本番ドメインの確定は W08（Vercel デプロイ）に委ねる形。
- iOS 版の「アプリアイコン設定」に対応する作業。道具（Xcode の Assets vs Next.js ファイル規約）は違うが、
  「所定の場所に所定サイズの画像を置く」という考え方は共通。
