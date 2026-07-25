# Step W04: Google Drive のフォルダ／Markdown をブラウズ

## 目的

ログイン済みユーザーの Google Drive を歩き回れるようにする。マイドライブを起点に
**サブフォルダと `.md` ファイルの一覧**を表示し、フォルダをクリックして潜り、パンくずで戻る。
さらに（W04b）**フォルダごとのパーマリンク**（`?folder=<ID>`）に対応し、
URL 直リンク・ブックマーク・ブラウザの戻る/進むを効かせる。

この段階ではファイルを開いても**中身は表示しない**（レンダリングは W05）。

> 用語メモ
> - **Route Handler**: `app/api/.../route.ts` に置く、サーバー側の API エンドポイント。
> - **パーマリンク**: その状態を指す固定 URL。ここでは各フォルダを `?folder=<ID>` で表す。

## 前提条件

- W03（Auth.js ログイン）完了。ログインするとサーバー側 JWT にアクセストークンが入る。

## アーキテクチャ

| ファイル | 役割 |
|----------|------|
| `web/lib/drive.ts` | Drive REST API v3 ラッパ + **フォルダ/.md 判定ロジック**（`isFolder` / `isMarkdown` / `toEntry` / `toEntries` / `listFolder` / `getFolderPath`）。テスト対象（W06） |
| `web/lib/google-token.ts` | リクエストの JWT からアクセストークンを取り出す（期限切れは自動リフレッシュ）。トークンはサーバー側のみ |
| `web/lib/google-oauth.ts` | トークンのリフレッシュ共通関数（auth.ts と google-token.ts で共用） |
| `web/app/api/drive/list/route.ts` | `?folderId=` の中身（フォルダ＋Markdown）とパンくず用の祖先パスを返す |
| `web/components/FileBrowser.tsx` | URL（`?folder=`）を真実にした一覧 UI。パンくず・フォルダ移動 |

### データフロー
```
FileBrowser（?folder=ID を読む）
  → GET /api/drive/list?folderId=ID
      → getValidAccessToken(req)  … JWT からトークン取得（必要ならリフレッシュ）
      → listFolder(token, ID)      … Drive の子を取得しフォルダ/.md に絞る
      → getFolderPath(token, ID)   … 親を辿ってパンくずを構築
  ← { entries, path }
```

## Markdown / フォルダ判定（lib/drive.ts）

- フォルダ: `mimeType === "application/vnd.google-apps.folder"`
- Markdown: 拡張子 `.md` / `.markdown` を主判定、`text/markdown` / `text/x-markdown` を補助
  （Drive は `.md` の mimeType を `text/plain` 等まちまちに返すため拡張子優先）
- 上記以外のファイルは一覧に出さない（フォルダと Markdown のみ表示）

## パーマリンク（W04b）

- フォルダ ID を URL クエリに載せる: `/?folder=<フォルダID>`（root は素の `/`）。
- `FileBrowser` は `useSearchParams()` で `folder` を読み、それを唯一の真実として一覧・パンくずを取得。
  移動は `router.push()` で URL を書き換える → 戻る/進むが自然に効く。
- 直リンク時のパンくずは `getFolderPath()` が親を順に辿って再構築する。
- `useSearchParams()` は Suspense 境界が必要なので、`page.tsx` で `<Suspense>` に包む。

### パーマリンクの性質・懸念（把握しておく点）
- URL に載る ID は秘密ではないが、**ログインしていないと 401**。つまり“自分用ブックマーク”であり公開共有リンクではない（他人が開いても中身は見えない＝安全）。
- 直リンクのパンくず再構築で親フォルダを数回 `files.get` する追加呼び出しが発生（浅い階層なら誤差）。

## 設計上のポイント（セキュリティ）
- アクセストークンはサーバー側の JWT にのみ保持。クライアントは自前の `/api/drive/*` を叩き、Google API 直接呼び出しはしない。
- `getToken()` は復号のみでリフレッシュしないため、`google-token.ts` 側で期限切れを判定して `refreshGoogleAccessToken()` を呼ぶ。
- Cookie 名は dev（`authjs.session-token`）と prod（`__Secure-authjs.session-token`）で変わるので `AUTH_URL` から導出。

## 確認ポイント（どうなれば成功か）
- ログイン後、マイドライブのフォルダ／`.md` が一覧表示される。
- フォルダの出入り・パンくずでの移動ができる。
- フォルダに入ると URL が `?folder=` 付きに変わり、その URL を直接開くと同じフォルダが開きパンくずも正しい。
- ブラウザの戻る/進むでフォルダ履歴を行き来できる。
- `npm run lint` / `npm run build` が通る。

## よくあるエラーと対処法
| 症状 | 原因 / 対処 |
|------|------|
| 一覧が「フォルダを読み込めませんでした」/ 401 | JWT からトークンを取れていない。Cookie 名/salt（`google-token.ts`）と `AUTH_URL` を確認 |
| `.md` が一覧に出ない | Drive の mimeType が想定外。`isMarkdown` の拡張子判定で拾えているか確認 |
| `useSearchParams() should be wrapped in a suspense boundary` | `page.tsx` の `<Suspense>` 包みを確認 |
| lint: `set-state-in-effect` | effect 内で同期 setState しない。読み込み状態はナビゲーション操作側で立て、effect は非同期 fetch のみに |

## 学んだこと・メモ
- 認証済みの Drive 参照はすべてサーバーのルートハンドラ経由にし、トークンをブラウザに出さない。
- URL を状態の真実にすると、パーマリンク・ブックマーク・戻る/進むが「ただで」手に入る。
- React 19 / Next 16 は effect 内の同期 setState を lint で弾く。データ取得は「操作側でローディング開始 → effect は非同期取得＋競合キャンセル」で書く。
