# Step 03: Info.plist — Document Types / UTI 設定

## 目的

iOS に「このアプリは .md ファイルを開ける」と宣言する。  
この設定がないと、Google Drive の「アプリで開く」メニューにこのアプリが表示されない。

---

## 背景知識

### UTI（Uniform Type Identifier）とは

ファイルの種類を識別するための文字列。拡張子より精密にファイルタイプを表す。

| 例 | UTI |
|----|-----|
| Markdown ファイル | `net.daringfireball.markdown` |
| プレーンテキスト | `public.plain-text` |
| PDF | `com.adobe.pdf` |
| JPEG 画像 | `public.jpeg` |

### 設定する 2 つのこと

| 設定 | 役割 |
|------|------|
| **Document Types** | 「このアプリは net.daringfireball.markdown を開ける」と iOS に登録する |
| **Exported UTIs** | 「.md という拡張子は net.daringfireball.markdown という型だ」と端末に教える |

Document Types だけだと、端末が `.md` の UTI を知らない場合に認識されないことがある。  
両方設定することで確実に動作する。

### Handler Rank とは

「このアプリはこのファイルタイプをどの優先度で扱いますか？」の宣言。

| Rank | 意味 |
|------|------|
| Owner | このタイプのデフォルトアプリとして振る舞う |
| **Alternate** | 選択肢のひとつとして登録する（今回はこれ） |
| None | 開けるが積極的には表示しない |

Alternate を選ぶ理由：既存の .md アプリ（メモ帳、テキストエディタ等）のデフォルトを奪わず、「他のアプリで開く」の選択肢に並ぶだけにする。

---

## 手順（Xcode GUI で操作）

### 1. Target の Info タブを開く

1. Xcode 左サイドバー最上部の **「Minimal Markdown Viewer」（青いアイコン）** をクリック
2. 中央の設定画面が開く
3. 上部の **TARGETS** 欄にある `Minimal Markdown Viewer` を選択
4. タブ行の **「Info」** をクリック

### 2. Document Types を追加

5. **「Document Types」** セクションを見つける
6. 左下の **「+」ボタン** をクリックして新規エントリを追加
7. 以下の値を入力する：

| フィールド | 入力値 |
|-----------|--------|
| Name | `Markdown Document` |
| Types | `net.daringfireball.markdown` |

8. 同じ行の右側にある **「Additional document type properties」** の `+` をクリックして追加プロパティを設定：
   - Key: `LSHandlerRank` / Value: `Alternate`

> **補足：** Types フィールドには `public.plain-text` も追加しておくと、.md が plain-text として渡されるケースにも対応できる。

### 3. Exported Type Identifiers（Exported UTIs）を追加

9. **「Exported Type Identifiers」** セクションを見つける（Document Types の下にある）
10. **「+」ボタン** で新規エントリを追加
11. 以下の値を入力する：

| フィールド | 入力値 |
|-----------|--------|
| Description | `Markdown Document` |
| Identifier | `net.daringfireball.markdown` |
| Conforms To | `public.plain-text` |
| Extensions | `md` |

12. Extensions に `markdown` も追加する（`md` の行に追加 or 別エントリ）

---

## 確認ポイント

- [x] Document Types に `Markdown Document` のエントリが追加された
- [x] Exported Type Identifiers に `net.daringfireball.markdown` のエントリが追加された
- [x] ▶ ボタンでビルドが通る（Hello World 表示確認済み）

---

## Info.plist 自動生成について（学んだこと）

Xcode 13 以降、`Info.plist` ファイルを手動で作成する必要がなくなった。  
プロジェクト設定（`GENERATE_INFOPLIST_FILE = YES`）に基づいてビルド時に自動生成される。

旧来の方法（XML を手書きで編集）より GUI 操作の方が推奨されており、入力ミスも少ない。  
SPEC.md に記載されている XML はあくまで「この内容を設定する」という仕様であり、  
実際の設定は Xcode の Info タブの GUI から行う。

---

## よくあるエラーと対処法

### Document Types セクションが見当たらない

- Info タブが選択されているか確認（General / Signing & Capabilities と並んでいる）
- スクロールダウンすると下の方にある場合がある

### ビルドエラー「Multiple commands produce...」

- 同じ UTI 識別子を重複して登録した場合に発生
- Exported Type Identifiers のエントリが重複していないか確認して削除

### Document Types の「−」ボタンで Target ごと消えてしまった

- Xcode の Info タブには「Document Types のエントリを削除する −」と「Target を削除する −」が近くにある
- 誤って Target を削除した場合は **⌘+Z で Undo** を試みる
- Undo が効かない場合は **Xcode を閉じて** ターミナルから以下を実行：
  ```
  git checkout HEAD -- "Minimal Markdown Viewer/Minimal Markdown Viewer.xcodeproj/project.pbxproj"
  ```
  → 直前のコミット状態に戻せる（**git コミットを習慣化しておく価値がここにある**）

---

## 次のステップ

Step 03 完了後 → [Step 04: swift-markdown-ui パッケージ追加](./step-04-spm-swift-markdown.md) へ
