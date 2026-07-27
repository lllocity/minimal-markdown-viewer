# Step W08: Vercel デプロイ（Web 版を公開する）

## 目的

`web/`（Next.js 16）を **Vercel** に本番デプロイし、URL で誰でもアクセスできる状態にする。
GitHub 連携方式を採用し、**`git push` するたびに自動で本番反映**されるようにする。

> 用語メモ
> - **Vercel**: Next.js を作っている会社が運営するホスティング。GitHub と連携すると push で自動デプロイされる。
> - **Root Directory**: このリポジトリは直下に Xcode プロジェクトと `web/` が同居する構成なので、
>   Vercel に「アプリの本体は `web/` だよ」と教える設定。これを間違えると build できない。
> - **リダイレクト URI**: OAuth ログイン後に Google が戻ってくる URL。本番ドメインの分を Google 側に
>   登録しないと、本番でログインが失敗する（W01 でローカル分は登録済み）。

## 前提条件
- W07 まで完了（`npm run build` がローカルで通る）。
- GitHub にリポジトリが push 済み（`github.com/lllocity/minimal-markdown-viewer`）。
- Vercel アカウント保有（無ければ GitHub アカウントで無料サインアップ）。
- W01 で取得した Google OAuth の `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`（`web/.env.local` にある）。

## 手順

### 1. Vercel でプロジェクトを Import
1. https://vercel.com/new を開く。
2. GitHub の `minimal-markdown-viewer` リポジトリを選び **Import**。
3. 設定画面で:
   - **Root Directory** … `web` を選ぶ（**最重要**）。
   - **Framework Preset** … Next.js が自動検出される。
   - **Project Name** … 例 `minimal-markdown-viewer`。→ 本番ドメインは `https://<project-name>.vercel.app` になる。
     - ⚠️ **`*.vercel.app` は全 Vercel ユーザー共通で世界に一意**。希望名が既に他人に使われていると、
       Vercel が重複防止のサフィックスを自動付与する（例: 今回は `minimal-markdown-viewer-seven.vercel.app`。
       `seven` はランダムなトークンで意味はない）。
     - **必ず Deploy 後に表示される「実際のドメイン」を控え、それを `AUTH_URL` と Google リダイレクト URI に使う。**
       希望名を推測で使うと、他人のプロジェクトのドメインを指してしまい本番ログインが失敗する。

### 2. 環境変数を設定（Import 画面の Environment Variables、または後から Settings → Environment Variables）
ローカルの `web/.env.local` と同じ 4 つ。ただし `AUTH_URL` は**本番ドメイン**にする。

| キー | 値 | 備考 |
|------|-----|------|
| `AUTH_GOOGLE_ID` | W01 の値（`web/.env.local` からコピー） | |
| `AUTH_GOOGLE_SECRET` | W01 の値（同上） | |
| `AUTH_SECRET` | 本番用に新規生成した値 | `openssl rand -base64 32` or `npx auth secret` |
| `AUTH_URL` | `https://<project-name>.vercel.app` | **末尾スラッシュなし**。OGP 絶対 URL（W07 の `metadataBase`）もこれに追従 |

> `.env.local` はローカル専用（Git 非追跡）。Vercel には別途この画面で入れる。秘密値なので手順書には実値を書かない。

### 3. Google Cloud で本番リダイレクト URI を追加
1. https://console.cloud.google.com/apis/credentials を開く。
2. W01 で作った OAuth 2.0 クライアント ID を開く。
3. **承認済みのリダイレクト URI** に追加:
   ```
   https://<project-name>.vercel.app/api/auth/callback/google
   ```
   （ローカルの `http://localhost:3000/api/auth/callback/google` は残したまま追加する。）
4. 保存。反映に数分かかることがある。

### 4. デプロイ
- Import 時にそのまま Deploy するか、環境変数を入れてから **Deploy**。
- 以後は `main` への push で自動再デプロイ。
  - 環境変数を後から変えたら **Redeploy**（Deployments → 対象 → Redeploy）で反映する。

### 5. 動作確認（本番 URL で）
- `https://<project-name>.vercel.app` を開く → ログイン画面。
- Google ログイン → Drive のフォルダ/Markdown ブラウズ → 表示まで通る。
- ブラウザタブに markdown ファビコンが出る。
- OGP 確認（任意）: ページのソースで `og:image` が `https://<project-name>.vercel.app/opengraph-image.png` に
  なっている（localhost でない）。Slack や X にリンクを貼るとカードが出る。

## 確認ポイント（どうなれば成功か）
- 本番 URL でログイン→ブラウズ→表示が一通り動く。
- `git push` すると Vercel が自動でビルド&デプロイする。
- `og:image` の URL が**本番ドメイン**になっている。

## よくあるエラーと対処法
| 症状 | 原因 / 対処 |
|------|------|
| build 失敗（No Next.js detected 等） | Root Directory が `web` になっていない。Settings → General → Root Directory を `web` に |
| ログインで `redirect_uri_mismatch` | 手順3の本番リダイレクト URI 未登録 or ドメイン違い。Google 側に正しい URL を追加 |
| ログインは通るがセッションがおかしい | `AUTH_SECRET` 未設定 or `AUTH_URL` がドメイン不一致。env を見直して Redeploy |
| OGP 画像が localhost のまま | `AUTH_URL` が本番ドメインになっていない。修正して Redeploy |
| env を変えたのに反映されない | 環境変数変更はビルド時に焼き込まれる。**Redeploy** が必要 |
| `Access blocked`（テストユーザー） | W01 の OAuth 同意画面が「テスト」モードなら、利用する Google アカウントをテストユーザーに追加 |

## 学んだこと・メモ
- GitHub 連携にすると「commit & push」がそのまま「デプロイ」になる。iOS 版の「実機にビルド」に相当する
  “世に出す”ステップを、Web ではワンクリック＋push で回せる。
- モノレポ的構成（`web/` サブディレクトリ）は **Root Directory** 設定で対応する。
- ローカルと本番で違うのは `AUTH_URL` だけ。OGP の絶対 URL も `AUTH_URL` に紐付けてあるので、
  ここを本番ドメインにするだけで W07 の OGP も本番用に切り替わる（W07 で仕込み済み）。
- 秘密値（`AUTH_*`）は Git に載せず、Vercel の Environment Variables に入れる。
- **実地の記録（今回）**: 希望した `minimal-markdown-viewer.vercel.app` は他人が使用中で、実際は
  `minimal-markdown-viewer-seven.vercel.app` が割り当てられた。最初に希望名の URL で `AUTH_URL` と
  Google リダイレクト URI を設定してしまい、他人のドメインを指していた（本番の中身が別アプリだった）。
  Deploy 後に本物のドメインへ両方を直したらログインできた。→ **「実際に割り当てられたドメイン」を必ず使うこと。**
- 本番ドメイン: `https://minimal-markdown-viewer-seven.vercel.app`
