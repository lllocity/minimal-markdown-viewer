# Minimal Markdown Viewer

Google Drive 上の `.md` ファイルを、Markdown としてレンダリングして**読む**ためのビューア。
**iOS アプリ**と**Web アプリ**の2つの実装がある。

- Web 版（公開中）: https://minimal-markdown-viewer-seven.vercel.app
- iOS 版: Google Drive / Files アプリの「アプリで開く」から `.md` を受け取って表示

## 設計思想

テキスト編集は AI が担う時代になった。**編集は AI（Claude 等）→ Drive 保存 → このアプリで読む**という
サイクルの「読む」部分だけを担う。

シンプルさを維持することへのコミットメント：
- コードベースが小さく、把握しやすい状態を保つ
- 編集・保存・共有機能は持たない（未完成ではなく、役割を意図的に絞った結果）

> どちらの実装も「読む専用ビューア」という思想は共通。ただしファイルへの**到達手段**が異なるため、
> 必要な仕組み（認証・ブラウズの有無）はプラットフォームごとに変わる（下表）。

## 2つの実装

| 観点 | iOS 版 | Web 版 |
|------|--------|--------|
| ファイルの開き方 | Drive/Files アプリの「アプリで開く」で**単一の .md** を受け取る | ブラウザで**ログイン**し、Drive を辿って開く |
| 認証 | なし（OS がファイルを渡す） | Google ログイン（Auth.js / `drive.readonly`） |
| ブラウズ | なし（1ファイル表示に専念） | フォルダ / Markdown をブラウズ ＋ パーマリンク |
| レンダリング | swift-markdown-ui | react-markdown + remark-gfm（GFM） |
| 言語 / 基盤 | Swift + SwiftUI | TypeScript + Next.js 16 |
| 配布 / 公開 | 実機 / TestFlight（App Store 申請は任意） | Vercel で公開中 |

> 📌 **今後の方針**: この機能差異は暫定的なもの。**将来的に iOS 版を Web 版に寄せる**
> （iOS 版にも Google ログイン・Drive ブラウズ等を取り込む）ことで解消していく想定。

## 機能

### iOS 版
- Google Drive / Files アプリの「アプリで開く」で `.md` ファイルを受け取り表示
- 見出し・太字・斜体・コードブロック・リスト・引用・リンクのレンダリング
- ナビゲーションバーにファイル名を表示
- ライト / ダークモード自動対応

### Web 版
- Google アカウントでログイン（読み取り専用スコープ）
- Drive のフォルダ / Markdown をブラウズ（パンくず・上部バーはスクロール追従で固定）
- パーマリンク（`?folder=<id>&file=<id>`）で特定ファイルを直接開ける
- GFM 対応レンダリング（テーブル・チェックリスト等）
- 並び順: フォルダは名前順、Markdown ファイルは更新の新しい順
- アプリアイコン / ファビコン / OGP 画像（SNS 共有カード）対応

## 技術スタック

| 項目 | iOS 版 | Web 版 |
|------|--------|--------|
| 言語 | Swift 5.9+ | TypeScript |
| UI / 基盤 | SwiftUI（iOS 16+） | Next.js 16（App Router） |
| 認証 | — | Auth.js v5（Google OAuth） |
| Markdown | [swift-markdown-ui](https://github.com/gonzalezreal/swift-markdown-ui) 2.4.1 | react-markdown + remark-gfm |
| テスト | XCTest | Vitest |
| ホスティング | 実機 / TestFlight | Vercel |

## ドキュメント

- 仕様書: [SPEC.md](./SPEC.md)（共通 + iOS 版 + Web 版）
- iOS 版の開発手順: [docs/ios/](./docs/ios/)
- Web 版の開発手順: [docs/web/](./docs/web/)
- Web 版のロードマップ / 残タスク: [docs/web/ROADMAP.md](./docs/web/ROADMAP.md)
