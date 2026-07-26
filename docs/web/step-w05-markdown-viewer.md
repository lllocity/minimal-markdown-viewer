# Step W05: Markdown ファイルを開いて表示

## 目的

Web 版の本題。一覧から `.md` を選ぶと、サーバー経由で本文を取得し、
**GFM（GitHub Flavored Markdown）としてレンダリング表示**する。iOS 版の
`swift-markdown-ui` と機能パリティ（見出し・表・リスト・タスクリスト・引用・コード・リンク）。
ファイル単位のパーマリンク（`?folder=X&file=Y`）にも対応。

> 用語メモ
> - **GFM**: 表・打消し線・タスクリストなどを含む Markdown 方言。`remark-gfm` で対応。
> - **alt=media**: Drive API で「メタ情報ではなくファイルの中身（バイト列）」を取得するための指定。

## 前提条件

- W04（Drive ブラウズ）完了。

## 手順

### 1. ライブラリ追加
```bash
cd web && npm install react-markdown remark-gfm
```
- 構文カラーハイライト（rehype-highlight）は入れない方針。iOS 版 SPEC の「コードは等幅＋薄グレー背景」に合わせ、
  ダークモードでのテーマ CSS 出し分けの複雑さも避ける（カラー強調は将来追加可能）。

### 2. 実装ファイル
| ファイル | 役割 |
|----------|------|
| `web/lib/drive.ts` | `getFileContent`（名前＋本文取得、`alt=media`）と `decodeUtf8`（UTF-8 厳密デコード）、`DecodeError` を追加。テスト対象（W06） |
| `web/app/api/drive/file/route.ts` | `?id=` のファイル本文を返す。空/非UTF-8/権限エラーを HTTP ステータスで表現 |
| `web/components/MarkdownViewer.tsx` | 本文文字列を react-markdown + remark-gfm でレンダリング。リンクは新規タブ |
| `web/components/MarkdownViewer.module.css` | 見出し・表・コード・引用等のミニマルなスタイル（白/ダーク自動・等幅コード） |
| `web/components/FileView.tsx` | ファイル取得＋状態（読み込み/エラー/空）＋タイトル＋戻るボタン |
| `web/components/FileBrowser.tsx` | 📄 クリックで `?file=` を付与、`fileId` があれば `FileView` を表示 |

### 3. エラーハンドリング（iOS 版と同方針）
| 状況 | HTTP | 画面表示 |
|------|------|----------|
| 本文が空 | 200（content=""） | 「ファイルが空です。」 |
| UTF-8 でない | 415 | 「文字コードを読み取れませんでした（UTF-8 のみ対応）。」 |
| 未ログイン/期限切れ | 401 | 「セッションの有効期限が切れました。…」 |
| その他 Drive エラー | 4xx/5xx | 「ファイルを開けませんでした。」 |

### 4. 検証
```bash
npm run lint && npm run build
npm run dev   # 一覧の 📄 を開く → 整形表示 → 「← 一覧に戻る」
```

## パーマリンク（ファイル単位）

- URL は `?folder=<フォルダID>&file=<ファイルID>`。フォルダは保ったままファイルを開く。
- `FileBrowser` は `fileId = searchParams.get("file")` があれば一覧の代わりに `FileView` を描画。
- この URL を直接開くとファイルが直接表示される（自分用の共有リンク。ログイン必須なのは W04 と同じ）。

## レンダリング方針（iOS 版とのパリティ）

- `remark-gfm`: 表・打消し線・タスクリスト・自動リンク。
- リンクは `target="_blank" rel="noopener noreferrer"`（iOS の「リンクタップで Safari」に相当）。
- スタイル: 白背景/ダーク自動、システムフォント、コードは等幅＋薄グレー背景、最大幅 760px・水平16pt 相当。
- 画像はレンダリングするが、Drive 上の相対パス画像は解決不可（iOS 版と同じ制約。SPEC のスコープ外）。

## 確認ポイント（どうなれば成功か）
- 📄 を開くと Markdown が整形表示される（見出し・表・タスクリスト・引用・コード・リンク）。
- リンクが新規タブで開く。「← 一覧に戻る」で一覧へ戻る。
- `?folder=…&file=…` の URL を直接開くとそのファイルが表示される。
- ダークモードで白/黒が反転して読める。
- 空ファイル・非 UTF-8 ファイルで専用メッセージが出る。

## よくあるエラーと対処法
| 症状 | 原因 / 対処 |
|------|------|
| 「文字コードを読み取れませんでした」 | ファイルが UTF-8 でない。iOS 版同様 UTF-8 のみ対応 |
| 表やタスクリストが素の記号のまま | `remark-gfm` が渡っているか（`MarkdownViewer` の `remarkPlugins`）確認 |
| コードブロックが読みにくい | 構文カラーは未導入（意図的）。等幅＋グレー背景で表示される |

## 学んだこと・メモ
- 本文取得もサーバーのルートハンドラ経由にし、トークンをクライアントに出さない一貫性を維持。
- `TextDecoder("utf-8", { fatal: true })` で「壊れた UTF-8」を検出し、iOS 版と同じエラー体験にできる。
- URL に `folder` と `file` を両方載せると、フォルダ位置を保ったままファイル単位で共有・ブックマークできる。
