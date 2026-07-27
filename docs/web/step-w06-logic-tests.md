# Step W06: ロジック層のテスト（Vitest）

## 目的

CLAUDE.md の方針「実装を追加・変更したら必ずテストも追加する。テスト対象はロジック層」を
Web 版でも守る。Web 版の“頭脳”である `lib/drive.ts` の純粋関数（判定・変換・デコード）を
**ネットワークなしで高速に検証**する。iOS 版の `DocumentViewModelTests` に相当する位置づけ。

> 用語メモ
> - **Vitest**: Vite ベースの軽量テストランナー。TS をそのまま実行でき、起動が速い。
> - **純粋関数**: 同じ入力に必ず同じ出力を返し、外部（ネットワーク等）に依存しない関数。テストしやすい。

## 前提条件
- W05 まで完了（`lib/drive.ts` に判定・変換・デコードのロジックがある）。

## 手順

### 1. Vitest 導入
```bash
cd web && npm install -D vitest
```
`package.json` にスクリプト追加:
```json
"test": "vitest run",
"test:watch": "vitest"
```

### 2. テスト作成: `web/lib/drive.test.ts`
テスト対象（すべて `lib/drive.ts` の純粋関数）:

| 関数 | 検証内容 |
|------|----------|
| `isFolder` | フォルダ mimeType のみ true |
| `isMarkdown` | `.md`/`.markdown`（大文字含む）は true、`text/markdown`系 mimeType も true、`.mdx`・`my.md.txt`・画像等は false |
| `toEntry` | フォルダ→folder、Markdown→markdown、対象外→null |
| `toEntries` | フォルダと Markdown だけ残し順序保持、空は空 |
| `sortEntries` | フォルダを先頭に名前順、Markdown は更新降順。日本語名の自然順、`modifiedTime` 未設定は末尾、空は空 |
| `decodeUtf8` | 正常 UTF-8（日本語・絵文字）を復元、空は空、壊れたバイト列は `DecodeError` |

> ネットワークを叩く `listFolder` / `getFolderPath` / `getFileContent` は、判定部分を
> `toEntry` 等の純粋関数に切り出してあるので、その純粋関数をテストする（fetch のモックは不要）。

### 3. 実行
```bash
npm test        # 一度だけ実行（CI 相当）
npm run test:watch  # 変更を監視して再実行
```
全部緑になってからコミットする（CLAUDE.md の「テスト緑を確認してからコミット」に相当。iOS の ⌘+U に対応）。

## 確認ポイント（どうなれば成功か）
- `npm test` が全件 pass（15 件）。
- `npm run lint` / `npm run build` もテストファイル追加後に通る。

## よくあるエラーと対処法
| 症状 | 原因 / 対処 |
|------|------|
| `Cannot find module './drive'` | テストは `lib/drive.test.ts` に置き、相対 import（`./drive`）で参照。`@/` エイリアスは使わない（設定不要にするため） |
| `TextDecoder is not defined` | Node 環境なら標準で使える。古い Node なら要更新（本プロジェクトは Node 20.9+ 前提） |
| build で test ファイルの型エラー | vitest は devDependencies。`import { describe, it, expect } from "vitest"` で型解決される |

## 学んだこと・メモ
- 「判定ロジックを純粋関数に切り出す → そこをテストする」の型が効く。fetch を含む関数はモックせず、
  中の純粋部分だけ検証すれば十分カバーできる。
- iOS（XCTest / ⌘+U）と Web（Vitest / `npm test`）で道具は違うが、「ロジック層は必ずテスト」という原則は共通。
- 新しいエラーケースや判定条件を足したら、この `drive.test.ts` に対応ケースを追加すること。
