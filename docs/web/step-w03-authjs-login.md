# Step W03: Auth.js（Google ログイン）実装

## 目的

Web 版に **Google アカウントでのログイン**を実装する。ログインすると Google Drive を
「閲覧のみ（`drive.readonly`）」できる権限（アクセストークン）をサーバー側で取得・保持し、
期限切れ時は自動でリフレッシュする。この段階のゴールは **ログイン→メール表示→ログアウト**が動くこと。

> 用語メモ
> - **Auth.js（旧 NextAuth）**: Next.js 向けの認証ライブラリ。OAuth の面倒な流れを肩代わりしてくれる。
> - **アクセストークン**: 「Drive を読む権限」の入場券。約1時間で失効する。
> - **リフレッシュトークン**: アクセストークンが切れたとき、再ログインなしで新しい入場券をもらうための引換券。
> - **JWT**: 署名付きの小さなトークン。ここではセッション情報を暗号化 Cookie に入れる用途。

## 前提条件

- W01（Google Cloud OAuth 設定・テストユーザー登録）完了。
- W02（Next.js 雛形）完了。

## 手順

### 1. Auth.js を導入
```bash
cd web && npm install next-auth@beta   # Auth.js v5（5.0.0-beta.x）
```

### 2. 環境変数を用意（web/.env.local）
`.env.local.example` をコピーして値を入れる（このファイルは Git 管理外）:
```
AUTH_GOOGLE_ID=（W01 のクライアント ID）
AUTH_GOOGLE_SECRET=（W01 のクライアントシークレット）
AUTH_SECRET=（openssl rand -base64 32 で生成）
AUTH_URL=http://localhost:3000
```
- Auth.js v5 は `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` を**自動で**プロバイダに渡す（コードに書かない）。

### 3. 実装ファイル
| ファイル | 役割 |
|----------|------|
| `web/auth.ts` | Auth.js 本体。Google プロバイダ（`drive.readonly` + `access_type=offline` + `prompt=consent`）、JWT にトークン保持＆リフレッシュ、セッションにはトークンを載せない |
| `web/app/api/auth/[...nextauth]/route.ts` | ログイン/コールバック等のエンドポイント（`export const { GET, POST } = handlers`） |
| `web/types/next-auth.d.ts` | JWT/Session の型拡張（access_token 等をサーバー側 JWT にのみ持たせる） |
| `web/app/page.tsx` | 認証ゲート。未ログイン→ログインボタン、ログイン済み→メール＋ログアウト |
| `web/app/page.module.css` | ログイン画面の最小スタイル |

### 4. 検証
```bash
npm run lint && npm run build   # 型チェック・ビルドが通ること
npm run dev                     # http://localhost:3000 を開く
```
ブラウザで「Google でログイン」→ 同意 →「ログイン中: <自分のメール>」が出れば成功。

## 設計上のポイント（セキュリティ）

- **アクセストークン／リフレッシュトークンはサーバー側の JWT（暗号化 httpOnly Cookie）にのみ保持**し、
  クライアントに返す `session` には載せない（`session()` コールバックで `error` だけ渡す）。
- 期限切れは `jwt()` コールバック内で Google のトークンエンドポイントに `refresh_token` を投げて自動更新。
  リフレッシュ不能なら `session.error` を立て、ページ側で再ログインを促す。
- スコープは `drive.readonly` のみ（読むだけ・書き込み権限は要求しない＝SPEC の「読む」思想を踏襲）。

## 確認ポイント（どうなれば成功か）

- `npm run build` が通り、ルートに `/` と `/api/auth/[...nextauth]` が生成される。
- ログイン後に自分のメールアドレスが表示される。
- ログアウトすると未ログイン画面に戻る。

## よくあるエラーと対処法

| 症状 | 原因 / 対処 |
|------|------|
| **403: access_denied**「審査プロセスを完了していません／テスターのみ」 | ログインに使う Google アカウントが OAuth 同意画面の**テストユーザーに未登録**。Console → OAuth 同意画面 → 対象（Audience）→ テストユーザー に、その Gmail アドレスを追加する。※実際に W03 で発生。使用アカウントは `...@gmail.com` で、これを登録して解決 |
| `redirect_uri_mismatch` | 承認済みリダイレクト URI が不一致。`http://localhost:3000/api/auth/callback/google` を正確に登録（W01） |
| ログイン後に毎回 refresh されない／`RefreshTokenError` | `prompt=consent` + `access_type=offline` が無いと refresh_token が来ない。`web/auth.ts` の authorization params を確認 |
| `MissingSecret` 等 | `.env.local` の `AUTH_SECRET` が未設定。生成して設定 |

## 学んだこと・メモ

- Google の OAuth は「テスト中」状態だと**テストユーザーに登録した人しかログインできない**。個人利用ではこれで十分（審査不要）。
- 使う Google アカウント（`...@gmail.com`）とテストユーザー登録は**完全一致**が必要。別アドレスだと 403。
- トークンはブラウザに出さずサーバー側で扱うのが安全。Drive API 呼び出し（W04）もサーバーのルートハンドラ経由にする。
