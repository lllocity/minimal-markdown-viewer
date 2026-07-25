# Step 04: swift-markdown-ui パッケージ追加

## 目的

Markdown をきれいにレンダリングするためのライブラリ `swift-markdown-ui` を追加する。

---

## 背景知識

### SPM（Swift Package Manager）とは

Swift の公式パッケージ管理ツール。他の人が作ったライブラリを自分のプロジェクトに追加できる。  
Node.js の npm、Python の pip に相当するもの。

Xcode に統合されており、URL を指定するだけでライブラリのダウンロード・管理が自動化される。

### swift-markdown-ui を選ぶ理由

| 方法 | メリット | デメリット |
|------|---------|-----------|
| **swift-markdown-ui** | SwiftUI ネイティブ、コードブロック・テーブルにも対応、活発にメンテナンス | 外部依存が生まれる |
| iOS 標準 AttributedString | 依存ゼロ | コードブロック・引用など高度な記法が非対応 |

SPEC.md の方針：まず swift-markdown-ui を試み、問題があれば AttributedString にフォールバック。

---

## 手順（Xcode GUI で操作）

### 1. パッケージ追加ダイアログを開く

Xcode メニューバー → **「File」→「Add Package Dependencies...」**

### 2. パッケージを検索

右上の検索バーに以下の URL を貼り付けて Enter：

```
https://github.com/gonzalezreal/swift-markdown-ui
```

パッケージが見つかったら以下を確認・設定：

| 項目 | 値 |
|------|---|
| Dependency Rule | `Up to Next Major Version`（推奨） |
| バージョン | `2.0.0` 以上（自動で最新が選ばれる） |

### 3. 追加先を選択

「Add to Target」で `Minimal Markdown Viewer` が選択されていることを確認 → **「Add Package」** をクリック

### 4. ダウンロード完了を待つ

Xcode が自動でパッケージをダウンロードする（数十秒〜数分）。  
左サイドバーに `Package Dependencies` が追加されれば完了。

---

## 確認ポイント

- [ ] 左サイドバーの「Package Dependencies」に `swift-markdown-ui` が表示されている
- [ ] ▶ ボタンでビルドが通る

---

## よくあるエラーと対処法

### 「No such module 'MarkdownUI'」

- パッケージが正しく追加されていない
- File → Packages → Resolve Package Versions を試みる
- それでも解決しない場合、プロジェクトを閉じて再度開く

### ネットワークエラーでダウンロードが失敗する

- Wi-Fi 接続を確認してから再試行
- Xcode メニュー → File → Packages → Reset Package Caches

---

## 学んだこと・メモ

- SPM は `Package.resolved` ファイルに依存関係のバージョンを記録する（git 管理対象）
- `Up to Next Major Version` を選ぶと、メジャーバージョンが上がらない範囲でセキュリティ修正などを自動取得できる
- ライブラリの実際のコードは `~/Library/Developer/Xcode/DerivedData/` にキャッシュされるため git リポジトリには含まれない

---

## 次のステップ

Step 04 完了後 → [Step 05: DocumentViewModel 実装](./step-05-viewmodel.md) へ
