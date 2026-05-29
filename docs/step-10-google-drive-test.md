# Step 10: Google Drive との動作確認

## 目的

実機（iPhone）上で Google Drive の `.md` ファイルを「アプリで開く」で開き、  
本番ワークフロー（AI で編集 → Drive 保存 → このアプリで読む）が動くことを確認する。

---

## 前提条件

- [Step 09](./step-09-device-install.md) 完了（iPhone にアプリインストール済み）
- iPhone に Google Drive アプリがインストールされている
- Google Drive に `.md` ファイルが存在する（なければ作成する）

---

## テスト用ファイルの準備

Drive 上にテスト用 `.md` ファイルがない場合、以下の方法で用意する：

**方法 A: Mac から Drive にアップロード**
1. Google Drive（ブラウザ）を開く
2. プロジェクトルートの `test.md` をドラッグしてアップロード

**方法 B: Drive 上で直接作成**
- Google ドキュメントでは `.md` は作れないため、Mac からアップロードが確実

---

## 手順

### 1. iPhone の Google Drive アプリで .md ファイルを開く

1. iPhone で **Google Drive** アプリを開く
2. テスト用 `.md` ファイルを探してタップ
3. Drive のプレビュー画面が開く（テキストが生で表示される）

### 2. 「アプリで開く」を選択する

1. 画面右上または右下の **「…（三点リーダー）」** をタップ
2. **「アプリで開く」** または **「共有」** を選択
3. 共有シートに **「Minimal Markdown Viewer」** が表示されたらタップ

> **表示されない場合：**  
> 共有シートを下にスクロールするか、「その他」をタップして一覧から探す。

### 3. 表示を確認する

- ナビゲーションバーにファイル名が表示される
- Markdown がレンダリングされて表示される

---

## 確認ポイント

- [x] Google Drive の `.md` ファイルを「アプリで開く」で起動できる
- [x] Markdown がレンダリングされて表示される
- [x] ナビゲーションバーにファイル名が表示される
- [ ] 別の `.md` ファイルを開き直すと内容が更新される

---

## よくあるエラーと対処法

### 共有シートに「Minimal Markdown Viewer」が出てこない

- Step 03 の Document Types 設定を確認
- アプリを一度削除して再インストール（Xcode から ▶ で再ビルド）

### 開こうとするとクラッシュする

- Xcode を接続した状態でビルドし直し、デバッグコンソールのエラーを確認
- `DocumentViewModel.load()` の Security-Scoped Resource 処理を確認

### ファイル名が文字化けする / 表示されない

- Google Drive が渡す URL のファイル名部分をデバッグコンソールで確認

---

## 学んだこと・メモ

- Google Drive が渡す URL は `file://` の**一時コピー**のパス。Security-Scoped Resource の処理が必要な理由
- Drive の「アプリで開く」はシステムの共有シートを経由する。Step 03 の Document Types 宣言でこのアプリが候補に出る
- シミュレーターでは Google Drive が使えないため、このステップは実機必須

---

## 次のステップ

Step 10 完了 → アプリの基本機能はすべて動作確認済み 🎉  
必要に応じて → [Step 11: App Store 申請](./step-11-appstore.md)（Apple Developer Program 加入が必要）
