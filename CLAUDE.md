# MinimalMarkdownViewer — CLAUDE.md

## プロジェクト概要

Google Drive の「アプリで開く」から `.md` ファイルを受け取り、Markdown としてレンダリングして表示するだけのシンプルな iOS ビューアーアプリ。

詳細な仕様は [SPEC.md](./SPEC.md) を参照。

---

## アシスタント（Claude Code）への指示

### 開発スタイル

- **一度に一ステップだけ進める。** 次のステップに移る前に必ず人間の確認を求めること
- **行動する前に説明する。** コマンドやコードを出す前に「これから何をするか・なぜするか」を一言で伝える
- **専門用語は初出時に日本語で補足する**（例: UTI（ファイルタイプの識別子）など）
- **エラーが出たら原因と対処法を丁寧に説明する**。エラー内容を貼ってもらって一緒に解決すること

### Git コミット

- **各ステップ完了時に必ず `git commit & git push` する**
- コミットメッセージは日本語で「Step XX: 内容」の形式

### docs フォルダ管理

- **各ステップ完了後、必ず対応する `docs/step-XX-*.md` を作成または更新する**
- そのステップで学んだこと・実施したこと・確認ポイントを残す（将来の自分や他の人が読んで再現できる粒度で）

### 機能スコープの厳守

以下は**実装しない**（SPEC.md「OUT」より）:
- ファイルの編集・保存
- ファイル一覧・ブラウザ
- Google Drive API 直接呼び出し
- シェア・コピー機能
- 画像レンダリング

機能追加の要望が出た場合、SPEC.md の設計思想（シンプルさへのコミットメント）に照らして判断する。

---

## 技術スタック

| 項目 | 内容 |
|------|------|
| 言語 | Swift 5.9+ |
| UI フレームワーク | SwiftUI |
| Markdown レンダリング | `swift-markdown-ui`（失敗時は `AttributedString` にフォールバック） |
| 最低サポート iOS | iOS 16 |
| 外部ライブラリ | `swift-markdown-ui` のみ |
| プロジェクト名 | `MinimalMarkdownViewer` |
| Bundle ID | `io.github.lllocity.minimal-markdown-viewer` |

---

## アーキテクチャ

```
MinimalMarkdownViewer/
├── App/
│   └── MDViewerApp.swift          # @main、onOpenURL ハンドラ
├── Views/
│   └── MarkdownView.swift         # レンダリング表示画面
├── ViewModels/
│   └── DocumentViewModel.swift    # ファイル読み込みロジック
└── Info.plist                     # UTI / Document Types 設定
```

データフロー: Google Drive → URL(file://) → `onOpenURL` → `DocumentViewModel.load()` → `MarkdownView` 表示

---

## 開発ロードマップ

| ステップ | ドキュメント | 内容 | 状態 |
|---------|------------|------|------|
| Step 00 | [docs/step-00-xcode-install.md](./docs/step-00-xcode-install.md) | Xcode インストール（約 15GB） | 完了 ✓ |
| Step 01 | docs/step-01-apple-id-setup.md | Apple ID を Xcode に登録・署名設定 | 完了 ✓ |
| Step 02 | [docs/step-02-xcode-project.md](./docs/step-02-xcode-project.md) | Xcode プロジェクト作成 | 完了 ✓ |
| Step 03 | [docs/step-03-info-plist.md](./docs/step-03-info-plist.md) | Document Types / UTI 設定 | 完了 ✓ |
| Step 04 | [docs/step-04-spm-swift-markdown.md](./docs/step-04-spm-swift-markdown.md) | swift-markdown-ui パッケージ追加 | 完了 ✓ |
| Step 05 | [docs/step-05-viewmodel.md](./docs/step-05-viewmodel.md) | DocumentViewModel 実装 | 完了 ✓ |
| Step 06 | [docs/step-06-markdown-view.md](./docs/step-06-markdown-view.md) | MarkdownView 実装 | 完了 ✓ |
| Step 07 | [docs/step-07-app-entry.md](./docs/step-07-app-entry.md) | MDViewerApp の onOpenURL 実装 | 完了 ✓ |
| Step 07b | [docs/step-07b-unit-tests.md](./docs/step-07b-unit-tests.md) | DocumentViewModel ユニットテスト | テストターゲット追加待ち |
| Step 08 | docs/step-08-simulator-test.md | シミュレータでのテスト | 未着手 |
| Step 09 | docs/step-09-device-install.md | 実機インストール（無料アカウント） | 未着手 |
| Step 10 | docs/step-10-google-drive-test.md | Google Drive との動作確認 | 未着手 |
| Step 11 | docs/step-11-appstore.md | (任意) App Store 申請 | 未着手 |

ステップ完了時にこのテーブルの「状態」を `完了 ✓` に更新すること。

---

## docs フォルダ規約

`docs/step-XX-*.md` の構成テンプレート:

```markdown
# Step XX: タイトル

## 目的
このステップで何を達成するか

## 前提条件
このステップを始める前に完了していること

## 手順
1. ...
2. ...

## 確認ポイント
どうなれば成功か

## よくあるエラーと対処法
（あれば記載）

## 学んだこと・メモ
```

---

## 現在の状態

- Xcode 26.5 インストール済み（iOS 26.5 プラットフォーム選択済み）
- Apple ID 登録済み
- Xcode プロジェクト作成済み（`Minimal Markdown Viewer.xcodeproj`）
- **次のアクション: Step 07b（Xcode にテストターゲットを追加 → ⌘+U でテスト実行）**
