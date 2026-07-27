# Minimal Markdown Viewer — 仕様書

Google Drive 上の `.md` ファイルを、Markdown としてレンダリングして**読む**ためのビューア。
**iOS アプリ**（第2部）と **Web アプリ**（第3部）の2つの実装がある。第1部は両者に共通する思想・方針。

---

# 第1部　共通

## 1. 目的と背景

Google Drive は `.md` ファイルを Markdown として整形表示してくれない（生テキストのまま）。
「AI が書いた Markdown を人間が読む」場面で、**レンダリングされた状態で快適に読む**ための最小限のビューアを提供する。

到達手段は環境によって異なる:
- **iOS**: Drive / Files アプリの「アプリで開く」で単一ファイルを受け取って表示する。
- **Web**: ブラウザでログインし、自分の Drive を辿って開く（PC など iOS アプリを使えない環境向け）。

## 2. 設計思想

### 人間の役割は AI が書いたものを「読む」こと

テキスト編集は AI が担う時代になった。人間がアプリ上で Markdown を直接編集する必要はなく、
**編集は AI（Claude 等）→ Drive 保存 → このアプリで読む**というサイクルが自然なワークフローになる。

このアプリはそのサイクルの「読む」部分だけを担う。編集・保存・共有といった機能を持たないのは
未完成ではなく、**役割を意図的に絞った結果**である。

### シンプルさを維持することへのコミットメント

機能を追加するほど、認証・状態管理・エラーハンドリングの複雑さが増す。ビューアーに徹することで：

- コードベースが小さく、把握しやすい状態を保てる
- AI によるメンテナンス・改修がしやすい
- 壊れにくい

将来機能追加したくなった場合も、この思想に立ち返って取捨選択する。

## 3. スコープの考え方（共通）

両実装に共通して**実装しない**もの:

- ファイルの編集・保存（編集は AI が担うため）
- シェア・コピー機能
- 画像レンダリング（Drive 上の画像パスは解決不可のため対象外）
- `.md` / `.markdown` 以外のファイル形式

> ⚠️ **プラットフォームでスコープが異なる点**: iOS 版は OS からファイルを渡されるため
> **認証もファイルブラウズも不要（=実装しない）**。一方 Web 版は自分でファイルへ到達する必要があるため、
> **Google ログインと Drive ブラウズは意図的に実装する（=IN スコープ）**。
> 「読む専用」という思想は共通で、到達手段の違いがこのスコープ差を生む。

---

# 第2部　iOS 版仕様

## 2-1. 概要

iOS の Google Drive アプリは `.md` ファイルをネイティブ表示できない。
三点リーダー → **「アプリで開く」** でこのアプリを選択すると、Markdown としてレンダリングされた状態で閲覧できる。

## 2-2. 技術スタック

| 項目 | 選択 |
| :---- | :---- |
| 言語 | Swift 5.9+ |
| UI フレームワーク | SwiftUI |
| Markdown レンダリング | `swift-markdown-ui` 2.4.1（解決不能時は `AttributedString` にフォールバック） |
| 最低サポート iOS | iOS 16 |
| 外部ライブラリ | `swift-markdown-ui` のみ |
| Bundle ID | `io.github.lllocity.minimal-markdown-viewer` |

## 2-3. 機能スコープ（iOS）

### IN
- Drive / Files アプリの「アプリで開く」で `.md` を受け取る
- Markdown をレンダリング表示（見出し H1〜H6 / 太字・斜体 / コードブロック・インラインコード /
  箇条書き・番号リスト / リンク（タップで Safari 起動）/ 水平線 / 引用ブロック）
- シンプルな UI、ナビゲーションバーにファイル名を表示
- ライト / ダークはシステム設定に追従

### OUT（iOS 固有）
- ファイル一覧・ファイルブラウザ（OS がファイルを渡すため不要）
- Google Drive API の直接呼び出し・認証（同上）
- フォントサイズ変更

## 2-4. アーキテクチャ

```
MinimalMarkdownViewer/
├── App/        MDViewerApp.swift        # @main, onOpenURL ハンドラ
├── Views/      MarkdownView.swift       # レンダリング表示画面
├── ViewModels/ DocumentViewModel.swift  # ファイル読み込みロジック
└── Info.plist                           # UTI / Document Types 設定
```

**データフロー**: Google Drive →（「アプリで開く」）→ `file://` URL → `MDViewerApp.onOpenURL`
→ `DocumentViewModel.load(url:)`（Security-Scoped Resource を開閉しつつ UTF-8 で読み込み）→ `MarkdownView` 表示。

## 2-5. Info.plist（Document Types / UTI）

`.md` を受け取るために、Document Types と UTI を宣言する（UTI = ファイルタイプの識別子）。

- `CFBundleDocumentTypes`: `net.daringfireball.markdown` / `public.plain-text` を受理（`LSHandlerRank = Alternate`）
- `UTExportedTypeDeclarations`: `net.daringfireball.markdown`（`public.plain-text` に準拠、拡張子 `md` / `markdown`）

## 2-6. 主要コンポーネント

- **MDViewerApp.swift**: アプリエントリ。`onOpenURL` で受け取った URL を `DocumentViewModel` に渡す。
- **DocumentViewModel.swift**（`ObservableObject`）: `markdownText` / `fileName` / `errorMessage` を公開。
  `startAccessingSecurityScopedResource()` / `stop...()` を適切に処理し、失敗時は `errorMessage` を設定。
- **MarkdownView.swift**: `markdownText` を受け取りレンダリング。背景はシステム背景色、コードは等幅＋薄グレー、
  `ScrollView` で縦スクロール。

## 2-7. エラーハンドリング（iOS）

| シナリオ | 表示内容 |
| :---- | :---- |
| ファイルが空 | 「ファイルが空です」 |
| 文字コードが UTF-8 でない | 「文字コードを読み取れませんでした（UTF-8 のみ対応）」 |
| Security-Scoped リソースアクセス失敗 | 「ファイルへのアクセス権がありません」 |
| 予期しないエラー | 「ファイルを開けませんでした」＋詳細（デバッグ用） |

## 2-8. 制約事項（iOS）

- Drive アプリが渡す URL は `file://` の一時コピーである可能性が高い。Security-Scoped Resource の扱いに注意。
- 無料 Apple ID の実機インストールは証明書が短期間（約7日）で失効する。App Store 配布は任意（未着手）。

---

# 第3部　Web 版仕様

## 3-1. 概要

PC ブラウザなど iOS アプリを使えない環境でも、Drive 上の `.md` を読めるようにする Web アプリ。
Google でログインし、自分の Drive のフォルダ／Markdown を辿って開く。

- 公開先: https://minimal-markdown-viewer-seven.vercel.app
- ソース: リポジトリ直下の `web/`

## 3-2. 技術スタック

| 項目 | 選択 |
| :---- | :---- |
| 言語 | TypeScript |
| フレームワーク | Next.js 16（App Router / Turbopack） |
| 認証 | Auth.js v5（next-auth）サーバーサイド Google OAuth |
| スコープ | `drive.readonly`（読み取り専用） |
| Markdown | `react-markdown` + `remark-gfm`（GFM 対応。構文ハイライトは意図的に未導入） |
| スタイル | CSS Modules（Tailwind 不使用） |
| テスト | Vitest |
| ホスティング | Vercel（GitHub 連携で `main` push → 自動デプロイ） |

> Next.js 16 は破壊的変更が多い（Turbopack 標準・`middleware`→`proxy` 改名・`params` 非同期化など）。
> 実装前に `web/node_modules/next/dist/docs/` の該当ガイドを参照する運用。

## 3-3. 機能スコープ（Web）

### IN
- Google ログイン（Auth.js v5、`drive.readonly`）
- Drive のフォルダ / Markdown ブラウズ（パンくず・上部バーはスクロール追従で固定）
- パーマリンク `?folder=<id>&file=<id>` による直接オープン
- Markdown レンダリング（GFM: テーブル・チェックリスト等）
- 並び順: フォルダは名前順、Markdown ファイルは更新の新しい順
- アプリアイコン / ファビコン / OGP 画像（SNS 共有カード）
- レスポンシブなヘッダー（モバイルはロゴ＋ログアウトアイコンのみ）

### OUT（Web 固有）
- 書き込みスコープ（`drive.readonly` に限定）
- 全文検索・タグ・同期などブラウズ以外の高度機能

## 3-4. アーキテクチャ

```
web/
├── auth.ts                         # Auth.js 設定（Google Provider / JWT / トークン更新）
├── app/
│   ├── layout.tsx                  # メタデータ（title/OGP/twitter, metadataBase=AUTH_URL）
│   ├── page.tsx                    # サーバーコンポーネント。未ログイン→ログイン、ログイン→ブラウザ
│   ├── icon.png / apple-icon.png / opengraph-image.png  # ファイル規約アイコン・OGP
│   └── api/
│       ├── auth/[...nextauth]/     # Auth.js のエンドポイント
│       └── drive/{list,file}/      # Drive 一覧取得 / ファイル本文取得（サーバー側で叩く）
├── components/                     # FileBrowser などブラウズ/表示 UI
├── lib/drive.ts                    # 判定・変換・並べ替え・デコードの純粋関数 + Drive API ラッパ（テスト対象）
└── public/logo.png                 # ヘッダー用ロゴ
```

## 3-5. データフロー（Web）

1. **ログイン**: `signIn("google")` → Auth.js が OAuth → セッション（アクセストークンは**サーバー側 JWT のみ**に保持、
   クライアントには渡さない）。期限切れ時はリフレッシュ、失敗時は再ログインを促す。
2. **ブラウズ**: `page.tsx`（サーバー）で `auth()` 判定 → `FileBrowser` → `/api/drive/list` が
   サーバー側で Drive API（`drive.readonly`）を呼ぶ → `toEntries` で対象を絞り `sortEntries` で並べ替え → 表示。
3. **表示**: ファイル選択 → `/api/drive/file` が本文を取得 → `decodeUtf8`（UTF-8 のみ）→ `react-markdown` で描画。
   URL は `?folder=<id>&file=<id>` に反映され、共有・リロードで復元可能。

## 3-6. 並び順（sortEntries）

Drive API の `orderBy` はフォルダとファイルへ**同一キーしか適用できない**ため、
「フォルダは名前順・ファイルは更新順」を分けられない。そこで取得後に純粋関数 `sortEntries` で並べ替える:

- フォルダを先頭にまとめ、フォルダ同士は**名前順**（日本語対応 `localeCompare("ja")`）
- Markdown ファイルはその後ろに**更新の新しい順**（`modifiedTime` 降順、未設定は末尾）

## 3-7. エラーハンドリング（Web）

| シナリオ | 扱い |
| :---- | :---- |
| Drive API がエラー応答 | `DriveApiError`（ステータス保持）。一覧/取得の失敗として表示 |
| 本文が UTF-8 でない | `DecodeError`（iOS 版と同じく UTF-8 のみ対応） |
| セッション期限切れ / リフレッシュ失敗 | 再ログインを促すメッセージ |

## 3-8. デプロイ（Vercel）

- **GitHub 連携**でデプロイ。**Root Directory = `web`**（リポジトリ直下に Xcode プロジェクトが同居するため）。
  `main` への push で自動再デプロイ。
- **環境変数**（Vercel の Environment Variables に設定。`AUTH_URL` のみ Production 固定）:
  `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` / `AUTH_SECRET` / `AUTH_URL`（本番ドメイン・末尾スラッシュなし）。
- `AUTH_URL` は認証の基準 URL 兼 **OGP の `metadataBase`**。本番ドメインにすると OGP 画像 URL も本番に追従する。
- Google Cloud 側の OAuth リダイレクト URI に本番ドメインの `/api/auth/callback/google` を登録する。
- 注意: `*.vercel.app` は世界で一意。希望名が使用済みだとサフィックスが付く（本番は `-seven` が付与された）。
  **実際に割り当てられたドメイン**を `AUTH_URL` とリダイレクト URI に使うこと。
- 詳細手順: [docs/web/step-w08-vercel-deploy.md](./docs/web/step-w08-vercel-deploy.md)

## 3-9. テスト方針（Web）

- テスト対象は**ロジック層**（`lib/drive.ts` の純粋関数）。View のテストは行わない。iOS 版の XCTest / ⌘+U に相当。
- Vitest で `isFolder` / `isMarkdown` / `toEntry` / `toEntries` / `sortEntries` / `decodeUtf8` を検証。
- ネットワークを叩く関数は判定部分を純粋関数に切り出し、そこをテストする（fetch はモックしない）。
- `npm test` が全件緑になってからコミットする。判定条件や並べ替えを変えたら対応テストを追加する。

---

## 参考: 開発手順ドキュメント

- iOS 版: [docs/ios/](./docs/ios/)
- Web 版: [docs/web/](./docs/web/) ／ ロードマップ・残タスク: [docs/web/ROADMAP.md](./docs/web/ROADMAP.md)
