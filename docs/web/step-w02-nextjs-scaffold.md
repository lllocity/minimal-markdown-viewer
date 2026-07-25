# Step W02: web/ に Next.js 雛形を作成

## 目的

Web 版の土台となる **Next.js（App Router + TypeScript）プロジェクト**を `web/` に作成し、
「白紙のアプリがローカルで起動する」状態にする。認証や Drive 機能は W03 以降で足す。

> 用語メモ
> - **App Router**: Next.js の新しいルーティング方式。`app/` フォルダの構成がそのまま URL とページ・API になる。
> - **雛形（scaffold）**: 動くだけの最小の骨組み。ここに機能を積み上げていく。
> - **Turbopack**: Next.js 16 で標準になった高速ビルドエンジン（旧 webpack の後継）。

## 前提条件

- W01（Google Cloud OAuth 設定）が完了している。
- Node.js 20.9 以上（Next.js 16 の最低要件）。本環境は Node v25 で条件を満たす。

## 手順

### 1. Node バージョン確認
```bash
node --version   # v20.9 以上であること
```

### 2. Next.js 雛形を生成
リポジトリ直下で実行（プロンプトで止まらないようフラグを全指定）:
```bash
npx --yes create-next-app@latest web \
  --ts --app --no-src-dir --eslint --no-tailwind \
  --import-alias "@/*" --use-npm --yes
```
- `--no-tailwind`: 依存を最小化し、iOS 版の「シンプル」思想に合わせて素の CSS で書くため。
- `--no-src-dir`: `app/` をルート直下に置くシンプル構成。

生成される主なもの: `app/`（layout・page・globals.css）、`package.json`、`next.config.ts`、
`tsconfig.json`、`eslint.config.mjs`、`public/`、`AGENTS.md` / `CLAUDE.md`（後述）。

### 3. 環境変数の雛形を追加
- `web/.env.local.example` を作成（`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` / `AUTH_SECRET` / `AUTH_URL`）。
- `web/.gitignore` は `.env*` を全無視するので、雛形だけコミットできるよう例外を追加:
  ```gitignore
  .env*
  !.env.local.example
  ```
- 実際の秘密値を入れる `web/.env.local` は W03 で作成（Git 管理外）。

### 4. 起動確認
```bash
cd web && npm run dev
# → http://localhost:3000 が HTTP 200 を返せば成功
```

### 5. 雛形の不要物を削除（クリーンアップ）
create-next-app はデモ用の宣伝ページ・アセットを残すので、居残らないうちに削る。
- 削除: `app/page.module.css`、`public/*.svg`（next/vercel/file/globe/window）、`web/README.md`
- 書き換え:
  - `app/layout.tsx`: `title` を本アプリ名に、`lang="ja"` に、Google Fonts（Geist）を除去（外部フォント依存を断ち **システムフォント**に）
  - `app/page.tsx`: Vercel ロゴのデモ画面 → 最小プレースホルダ
  - `app/globals.css`: デモ用フレックス指定を削り、白背景/ダーク自動追従 + 日本語対応システムフォントの最小リセットに
- 検証: `npm run lint` と `npm run build` が通ること（削除物への参照が残っていないか確認）。

## 確認ポイント（どうなれば成功か）

- `npm run dev` で `▲ Next.js 16.x (Turbopack) … ✓ Ready` と表示される。
- ブラウザ／curl で `http://localhost:3000` が **200** を返す（Next のデフォルト画面）。
- `git status` で `web/node_modules` と `web/.next` が追跡対象に入っていない（`.gitignore` 済み）。

## 生成された特記ファイル

| ファイル | 役割 | 扱い |
|----------|------|------|
| `web/AGENTS.md` | 「Next 16 は破壊的変更あり。`node_modules/next/dist/docs/` を読んでから書け」という **AI 向け注意書き**（Next 公式が雛形に同梱） | 残す（古い知識での実装ミス防止の保険） |
| `web/CLAUDE.md` | `@AGENTS.md` を読み込むだけの道標 | 残す |
| `web/next.config.ts` | Next 設定（現状は空） | 以降のステップで必要時に編集 |

## Next.js 16 の主な破壊的変更（把握しておく点）

| 変更 | 影響 |
|------|------|
| Turbopack がデフォルト | 独自 webpack 設定なしなら問題なし・高速化 |
| `middleware.ts` → `proxy.ts` に改名 | 認証ガードで注意（W03）。ミドルウェアを使わず回避も可 |
| `params`/`searchParams` が Promise（要 await） | クエリ文字列で受ける本アプリでは影響小 |
| Node 20.9+ / TS 5.1+ が最低要件 | 本環境は充足 |
| `next lint` 廃止 → ESLint CLI | 雛形が `"lint": "eslint"` に設定済み |

## よくあるエラーと対処法

| 症状 | 原因 / 対処 |
|------|------|
| `create-next-app` が Node バージョンで失敗 | Node 20.9+ に更新 |
| `npm audit` で high 脆弱性（postcss/sharp） | Next 同梱のトランジティブ依存への警告。修正案は next@9 への破壊的ダウングレードなので**適用しない**。Next のパッチ版で追随 |
| `.env.local.example` が Git に出てこない | `.gitignore` の `.env*` に阻まれている。`!.env.local.example` の例外を追加 |

## 学んだこと・メモ

- Next.js 16 系は App Router・Turbopack 標準・React 19。学習データの古い Next とは差異があるため、実装前に同梱 docs を参照する運用にする。
- 秘密情報（`AUTH_GOOGLE_SECRET` 等）は `.env.local`（Git 管理外）に入れ、雛形の `.env.local.example` だけをコミットする。
