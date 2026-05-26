# Minimal Markdown Viewer — 仕様書

Google Drive の「アプリで開く」から `.md` ファイルを受け取り、Markdown としてレンダリングして表示するだけのシンプルなビューアーアプリ。

---

## 1\. 目的と背景

iOS の Google Drive アプリは `.md` ファイルをネイティブ表示できない。  
三点リーダー → **「アプリで開く」** でこのアプリを選択すると、Markdown としてレンダリングされた状態でファイルを閲覧できる。

---

## 2\. 設計思想

### 人間の役割はAIが書いたものを「読む」こと

テキスト編集はAIが担う時代になった。人間がアプリ上でMarkdownを直接編集する必要はなく、**編集はAI（Claude等）→ Drive保存 → このアプリで読む**というサイクルが自然なワークフローになる。

このアプリはそのサイクルの「読む」部分だけを担う。編集・保存・共有といった機能を持たないのは未完成ではなく、**役割を意図的に絞った結果**である。

### シンプルさを維持することへのコミットメント

機能を追加するほど、Drive API認証・状態管理・エラーハンドリングの複雑さが指数的に増す。ビューアーに徹することで：

- コードベースが小さく、把握しやすい状態を保てる  
- AIによるメンテナンス・改修がしやすい  
- 壊れにくい

将来機能追加したくなった場合も、この思想に立ち返って取捨選択する。

---

## 3\. 技術スタック

| 項目 | 選択 |
| :---- | :---- |
| 言語 | Swift 5.9+ |
| UI フレームワーク | SwiftUI |
| Markdown レンダリング | `AttributedString` \+ `Text` (iOS 15+) または `WKWebView` |
| 最低サポート iOS | iOS 16 |
| 外部ライブラリ | 原則なし（必要なら `swift-markdown-ui` を検討） |

---

## 4\. 機能スコープ

### IN（実装する）

- Google Drive / Files アプリの「アプリで開く」で `.md` ファイルを受け取る  
- Markdown をレンダリングして表示する  
  - 見出し（H1〜H6）  
  - 太字・斜体  
  - コードブロック・インラインコード  
  - 箇条書き・番号リスト  
  - リンク（タップで Safari 起動）  
  - 水平線  
  - 引用ブロック  
- シンプル・ミニマルな白背景 UI  
- ナビゲーションバーにファイル名を表示

### OUT（実装しない）

- ファイルの編集・保存（編集はAIが担う時代であり、人間がアプリ上で編集する必要はないため）  
- ファイル一覧・ファイルブラウザ  
- Google Drive API の直接呼び出し・認証  
- シェア・コピー機能  
- フォントサイズ変更  
- ダークモード切り替え（システム設定には追従させてもよい）  
- 画像レンダリング（Drive 上の画像パスは解決不可のため対象外）

---

## 5\. アーキテクチャ

MDViewerApp

├── App

│   └── MDViewerApp.swift          \# @main, onOpenURL ハンドラ

├── Views

│   └── MarkdownView.swift         \# レンダリング表示画面

├── ViewModels

│   └── DocumentViewModel.swift    \# ファイル読み込みロジック

└── Info.plist                     \# UTI / Document Types 設定

### データフロー

Google Drive

  └─(Share Extension / Document Open)─▶ URL (file://)

      └─▶ MDViewerApp.onOpenURL

          └─▶ DocumentViewModel.load(url:)

              ├─ startAccessingSecurityScopedResource()

              ├─ Data(contentsOf:) → String (UTF-8)

              └─ stopAccessingSecurityScopedResource()

                  └─▶ MarkdownView（AttributedString でレンダリング）

---

## 6\. Info.plist 設定（Document Types / UTI）

\<\!-- ファイルタイプの宣言 \--\>

\<key\>CFBundleDocumentTypes\</key\>

\<array\>

  \<dict\>

    \<key\>CFBundleTypeName\</key\>

    \<string\>Markdown Document\</string\>

    \<key\>LSHandlerRank\</key\>

    \<string\>Alternate\</string\>

    \<key\>LSItemContentTypes\</key\>

    \<array\>

      \<string\>net.daringfireball.markdown\</string\>

      \<string\>public.plain-text\</string\>

    \</array\>

  \</dict\>

\</array\>

\<\!-- UTI のエクスポート宣言（.md が未登録の端末向け） \--\>

\<key\>UTExportedTypeDeclarations\</key\>

\<array\>

  \<dict\>

    \<key\>UTTypeIdentifier\</key\>

    \<string\>net.daringfireball.markdown\</string\>

    \<key\>UTTypeConformsTo\</key\>

    \<array\>

      \<string\>public.plain-text\</string\>

    \</array\>

    \<key\>UTTypeTagSpecification\</key\>

    \<dict\>

      \<key\>public.filename-extension\</key\>

      \<array\>

        \<string\>md\</string\>

        \<string\>markdown\</string\>

      \</array\>

    \</dict\>

  \</dict\>

\</array\>

---

## 7\. 主要コンポーネント仕様

### 7-1. MDViewerApp.swift

// 責務: アプリエントリポイント、ファイル URL の受け取り

// onOpenURL で受け取った URL を DocumentViewModel に渡す

// Scene の body は MarkdownView を表示する ContentView

- `Scene` に `handlesExternalEvents(matching:)` を設定して外部ファイルオープンを受け付ける

### 7-2. DocumentViewModel.swift

// 責務: URL からファイルを読み込み、文字列として公開する

class DocumentViewModel: ObservableObject {

    @Published var markdownText: String \= ""

    @Published var fileName: String \= ""

    @Published var errorMessage: String? \= nil

    func load(url: URL) { ... }

}

- `startAccessingSecurityScopedResource()` / `stopAccessingSecurityScopedResource()` で Security-Scoped Resource を適切に処理する  
- 読み込み失敗時は `errorMessage` にセットしてビューに表示する

### 7-3. MarkdownView.swift

// 責務: markdownText を受け取りレンダリング表示する

// iOS 15+ の AttributedString(markdown:) を使用

// フォールバック: WKWebView に生 HTML を流し込む方式も検討

**表示仕様:**

- 背景: `Color(.systemBackground)`（ライト白 / ダークは自動追従）  
- フォント: システムデフォルト（`body`, `title`, `headline` など Semantic フォント）  
- コードブロック: 等幅フォント (`monospaced`)、薄いグレー背景  
- スクロール: `ScrollView` でフル縦スクロール  
- パディング: 水平 16pt、垂直 12pt

**エラー状態:**

- ファイル読み込み失敗時: 中央にエラーメッセージを表示

---

## 8\. Markdown レンダリング方針

### 第一候補: `swift-markdown-ui`（推奨）

// Package.swift に追加

.package(url: "https://github.com/gonzalezreal/swift-markdown-ui", from: "2.0.0")

理由:

- SwiftUI ネイティブ  
- コードハイライト・テーブルにも対応  
- メンテナンスが活発

### 第二候補: iOS 15 標準 `AttributedString`

let attributed \= try AttributedString(markdown: text)

Text(attributed)

理由: 依存ゼロだが、コードブロックや高度な記法は非対応

### 選択指針

Claude Code への指示: **まず `swift-markdown-ui` で実装し、SPM 解決に問題があれば `AttributedString` にフォールバックする**

---

## 9\. エラーハンドリング

| シナリオ | 表示内容 |
| :---- | :---- |
| ファイルが空 | 「ファイルが空です」 |
| 文字コードが UTF-8 でない | 「文字コードを読み取れませんでした（UTF-8 のみ対応）」 |
| Security-Scoped リソースアクセス失敗 | 「ファイルへのアクセス権がありません」 |
| 予期しないエラー | 「ファイルを開けませんでした」 \+ エラー詳細（デバッグ用） |

---

## 10\. Claude Code への実装指示

以下の順序で実装すること。

1. **Xcode プロジェクト作成**  
     
   - プロジェクト名: `MinimalMarkdownViewer`  
   - Bundle ID: `io.github.lllocity.minimal-markdown-viewer`  
   - Target: iOS 16+、SwiftUI ライフサイクル

   

2. **Info.plist に Document Types / UTI を追記**（セクション 5 の XML を反映）  
     
3. **SPM で `swift-markdown-ui` を追加**  
     
4. **DocumentViewModel を実装**  
     
5. **MarkdownView を実装**  
     
6. **MDViewerApp.swift に `onOpenURL` ハンドラを実装**  
     
7. **実機またはシミュレータで動作確認**  
     
   - Files アプリに `.md` ファイルを配置 → 共有 → MDViewer で開く

---

## 11\. 確認すべき制約事項

- Google Drive アプリが渡す URL は `file://` の一時コピーである可能性が高い。Security-Scoped Resource の扱いを必ず確認すること。  
- App Store 配布を想定する場合、Privacy の説明（ファイルアクセス理由）を `Info.plist` に追記する。  
- TestFlight / ローカル実行のみであれば署名は開発用証明書で問題ない。

