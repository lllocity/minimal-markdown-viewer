# Step W10: フォルダのブックマーク機能（localStorage）

## 目的

よく使う Drive フォルダをブックマークし、素早く移動できるようにする。
バックエンド（DB）を持たない方針のため、**ブラウザの localStorage** に保存する（端末ローカル）。

> スコープ: **フォルダのみ**対象（ファイルは対象外）。SPEC の「シンプルさへのコミット」に沿い、
> 「フォルダの記憶とショートカット」に機能を限定する（同期・タグ・共有には広げない）。

## 前提条件
- W05 まで完了（パーマリンク `?folder=<id>&file=<id>` でフォルダを復元できる）。
- フォルダの「ID＋表示名」はパンくず（`FileBrowser` の `path`）の末尾から取得できる。

## 設計

### 保存方式
- localStorage（キー `mmv.bookmarks.v1`）に `{ id, name }[]` を JSON で保存。
- `id` は Drive フォルダ ID。パーマリンクが `?folder=<id>` なので、ID があれば移動で復元できる。
- 端末間同期は無し（別案として Drive appDataFolder があるが、書込スコープ追加が必要なため今回は不採用）。

### UI（PC / モバイル共通の★ドロップダウン）
- **ヘッダー右側（ログアウトの左）に★アイコン**。クリックでパネルを開閉（PC・モバイルとも同じ挙動）。
- パネル: 「＋ このフォルダを追加 / − このフォルダを解除」（現在フォルダのトグル）＋ ブックマーク一覧。
- 一覧の各行: 📁 名前（タップで移動）＋ ×（削除）。
- 外側クリック / Esc で閉じる。一覧は開いたときだけ表示し、狭いモバイルでも画面を占有しない。
- ヘッダーは常時表示なので、**ファイル閲覧中でも★は使える**（現在フォルダは閲覧中も保持される）。

### 現在フォルダの共有（BrowseProvider）
- ★はヘッダー（`page.tsx`）に置くが、「＋現フォルダを追加」には現在フォルダの**表示名**が要る。
  表示名はパンくず（`FileBrowser` の `path` 末尾）にあるので、`BrowseProvider`（React Context）で共有する。
- `FileBrowser` が一覧取得時に `setCurrentFolder(path 末尾)` を呼び、ヘッダーの `BookmarkMenu` が読む。
- URL 生成 `hrefFor` は `lib/nav.ts` に切り出し、`FileBrowser` と `BookmarkMenu` で共有。

### ロジック層（テスト対象・純粋関数）
`lib/bookmarks.ts`:
| 関数 | 役割 |
|------|------|
| `isBookmarked(list, id)` | 登録済み判定 |
| `addBookmark(list, bm)` | 追加（同 id は重複させず表示名を更新・元配列不変） |
| `removeBookmark(list, id)` | 削除 |
| `toggleBookmark(list, bm)` | 登録済みなら解除・未登録なら追加 |
| `parseBookmarks(raw)` | localStorage 文字列→配列（null/不正/壊れた要素を除去） |
| `serializeBookmarks(list)` | 配列→保存用文字列 |
| `loadBookmarks` / `saveBookmarks` | localStorage 読み書き（SSR ガード。純粋部分は上記に分離） |

## 実装メモ

- `BookmarkMenu.tsx`（client）は `useState(loadBookmarks)` の**遅延初期化**で読み込む。
  `useEffect` 内で `setState` すると `react-hooks/set-state-in-effect` に触れるため避けた。
  パネルは閉じた状態から始まり list 依存の DOM を出さないので、SSR([])とクライアント(実データ)の
  初期描画が食い違わずハイドレーションも安全。
- 現在フォルダは `FileBrowser` が `BrowseProvider` に流し込み、ヘッダーの `BookmarkMenu` が受け取る
  （`setCurrentFolder` は fetch の非同期コールバック内で呼ぶので `set-state-in-effect` に触れない）。
- ★はヘッダー右側（メール／ログアウトの並び）に配置。モバイルではロゴ＋★＋ログアウトのアイコン列になる。

## 確認ポイント（どうなれば成功か）
- 上部バー右端に★。クリックでパネル開閉、外側クリック/Esc で閉じる。
- 「＋ このフォルダを追加」で現在フォルダが一覧に入り、リロードしても残る（localStorage 永続）。
- 一覧の行タップでそのフォルダへ移動、×で削除。登録済みフォルダでは「− このフォルダを解除」に変わる。
- `npm test`（28件）/ `npm run lint` / `npm run build` が通る。

## よくあるエラーと対処法
| 症状 | 原因 / 対処 |
|------|------|
| lint: `set-state-in-effect` | `useEffect`＋`setState` で初期化していた。`useState(loadBookmarks)` の遅延初期化に変更 |
| ハイドレーション不一致 | 初期描画で localStorage 依存の DOM を出すと発生。パネルは閉じた状態から始め list 非依存にする |
| リロードで消える | `saveBookmarks` の呼び忘れ。追加/削除は必ず `persist`（setState＋save）経由にする |

## 学んだこと・メモ
- 「判定・変換を純粋関数に切り出し→そこをテスト、副作用（localStorage）は薄いラッパ」の型は
  W06 の `drive.ts` と同じ。localStorage も fetch と同様、境界を薄く保てばロジックはテストできる。
- 端末間同期が欲しくなったら Drive appDataFolder（`drive.appdata` スコープ追加）へ拡張できる。
  その場合 `loadBookmarks`/`saveBookmarks` を差し替えれば純粋関数側は再利用できる。
