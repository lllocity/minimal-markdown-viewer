# Web 版 開発ロードマップ / 残タスク

Web 版（`web/` 配下・Next.js 16）の開発ステップ一覧と残タスク。
**別セッションで再開するときは、まずこのファイルを見て「未着手」の先頭から進める。**

各ステップの詳細手順は `docs/web/step-wXX-*.md` を参照。
開発スタイルは CLAUDE.md の方針（一度に一ステップ・事前説明・各ステップで commit & push・docs 更新・テスト緑）を厳守する。

## ステップ一覧

| ステップ | 内容 | ドキュメント | 状態 |
|---------|------|------------|------|
| W01 | Google Cloud OAuth 設定 | [step-w01-google-oauth.md](./step-w01-google-oauth.md) | 完了 ✓ |
| W02 | Next.js 16 雛形作成 | [step-w02-nextjs-scaffold.md](./step-w02-nextjs-scaffold.md) | 完了 ✓ |
| W03 | Auth.js による Google ログイン | [step-w03-authjs-login.md](./step-w03-authjs-login.md) | 完了 ✓ |
| W04 | Drive フォルダ/Markdown ブラウズ + パーマリンク | [step-w04-drive-browser.md](./step-w04-drive-browser.md) | 完了 ✓ |
| W05 | Markdown ファイル表示（ビューア完成） | [step-w05-markdown-viewer.md](./step-w05-markdown-viewer.md) | 完了 ✓ |
| W06 | ロジック層テスト（Vitest） | [step-w06-logic-tests.md](./step-w06-logic-tests.md) | 完了 ✓ |
| W07 | アイコン / OGP / メタデータ整備 | [step-w07-icons-ogp.md](./step-w07-icons-ogp.md) | 完了 ✓ |
| W08 | Vercel デプロイ | （未作成） | 未着手 |
| W09 | ドキュメント統合（README/SPEC を iOS版・Web版で統合） | （未作成） | 未着手 |
| W10 | フォルダのブックマーク機能 | （未作成） | 未着手 |

## 残タスクの詳細

### W08: Vercel デプロイ
- `web/` を Vercel にデプロイする。
- 環境変数を Vercel に設定: `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` / `AUTH_SECRET` / `AUTH_URL`（本番ドメイン）。
- **`AUTH_URL` を本番ドメインにすると、OGP 画像の絶対 URL（W07 で `metadataBase = AUTH_URL` 基準に実装済み）も自動で本番ドメインに切り替わる。**
- Google Cloud 側の OAuth リダイレクト URI に本番ドメインの `/api/auth/callback/google` を追加する。
- 完了後 `docs/web/step-w08-*.md` を作成。

### W09: ドキュメント統合
- 現状 `README.md` / `SPEC.md` は iOS 版のみを記述。Web 版も含めた内容に統合する。
- iOS 版・Web 版の設計思想（「AI が書く→Drive→読む」）は共通なので、共通部分＋各プラットフォーム固有部分の構成に整理する。
- 完了後 `docs/web/step-w09-*.md` を作成。

### W10: フォルダのブックマーク機能
- Drive のフォルダをブックマーク（お気に入り）登録し、素早くアクセスできるようにする。
- **バックエンド（DB）にデータを蓄積する仕組みは無いので、ブラウザの localStorage に保存する。**
- 想定要素:
  - フォルダ表示中に「ブックマークに追加/解除」できる UI（ヘッダーor一覧）。
  - 保存キーはフォルダ ID（＋表示名）。パーマリンクは `?folder=<id>&file=<id>`（W04）なのでフォルダ ID を保存すれば復元可能。
  - ブックマーク一覧を表示し、クリックでそのフォルダへ遷移。
  - localStorage 読み書きは純粋関数に切り出し、Vitest でテスト（CLAUDE.md「ロジック層は必ずテスト」に従う。localStorage はモック or jsdom 環境）。
- スコープ注意: SPEC.md の「シンプルさへのコミットメント」に照らし、ブックマークの範囲は「フォルダの記憶とショートカット」に留める（同期・共有・タグ付け等には広げない）。
- 完了後 `docs/web/step-w10-*.md` を作成。

## 完了の記録方法
- ステップ完了時にこの表の「状態」を `完了 ✓` に更新し、対応する `step-wXX-*.md` を作成/更新する。
- コミットは日本語で `Step WXX: 内容` 形式（CLAUDE.md 準拠）。
