# Step W11: 目次（TOC）機能（PC 右カラム・アンカー移動）

## 目的

Markdown 表示時に**見出しの一覧（目次）**を出し、クリックでその見出しへジャンプできるようにする。
長文でも現在地が分かるよう、スクロールに応じて**現在の見出しをハイライト**する。

- **PC（ワイド画面）**: 本文の右カラムに sticky で常時表示。
- **モバイル**: 目次なし（本文のみ）。狭い画面では CSS で非表示。

## 前提条件
- W05（ビューア）完了。W10 までの構成（`FileView` → `MarkdownViewer`）。

## 設計（DOM 由来・単一の真実）

アンカーのズレ（目次リンクと本文 id の不一致）を根本から避けるため、
**「rehype-slug が付けた id を唯一の出所」**にする:

1. `MarkdownViewer` に **`rehype-slug`** を追加 → 各見出しに GitHub 風 id が付く（id 生成はライブラリに委譲）。
2. `FileView` が**描画後の DOM から見出し（`h1..h6`）を読み**、`{ id, text, level }` の配列にして目次を作る。
   - 目次リンク＝本文の実 id なので、**構造上必ず一致**（setext・引用内・重複見出しも rehype が出した通りに拾える）。
   - 見出し抽出は View に紐づくため純粋関数の単体テストは無し（CLAUDE.md「View のテストは不要」）。
3. `Toc` コンポーネントが一覧を描画。`IntersectionObserver` で画面内の見出しを検知しハイライト。
   クリックで `scrollIntoView({ behavior:"smooth" })`。
4. 見出しが sticky バーに隠れないよう、本文見出しに `scroll-margin-top: 72px`。

### lint 対策（set-state-in-effect）
- 見出し抽出の `setHeadings` は `requestAnimationFrame` のコールバック内で呼ぶ
  （effect 本体で同期的に `setState` すると `react-hooks/set-state-in-effect` に触れるため）。
- ハイライトの `setActiveId` は `IntersectionObserver` のコールバック内なので同様に問題なし。

## レイアウト
- `FileView` を `.layout`(flex, center) に。`.main`(max 760) と `.tocCol`(240, sticky) を中央寄せグループで横並び。
- `.tocCol` は `@media (max-width: 1099px)` で `display:none`（本文760+gap32+目次240=1032 に余裕を持たせる閾値）。
- **読み込み中から右カラムの幅を確保**する（`reserveTocColumn = loading || showToc`）。目次が出た瞬間に
  中央寄せグループが広がって本文が左へカクッとずれるのを防ぐため、ロード中は空の `.tocCol` を出しておく。
  （エラー / 見出しなしのときはカラムを畳む）

## 確認ポイント（どうなれば成功か）
- ワイド画面で本文の右に目次が出て、スクロール追従（sticky）する。
- 目次クリックでその見出しへスムーズに移動し、sticky バーに隠れない。
- スクロールすると現在地の見出しがハイライトされる。
- 見出しのないファイルでは目次カラムが出ない。狭い画面では目次が消え本文のみ。
- `npm run lint` / `npm run build` / `npm test`（28件）が通る。

## よくあるエラーと対処法
| 症状 | 原因 / 対処 |
|------|------|
| 目次リンクで飛ぶと見出しがバーに隠れる | `scroll-margin-top` 不足。`MarkdownViewer.module.css` の見出しで調整 |
| 目次が出ない | 見出しに id が無い（`rehype-slug` 未適用）／`headings` が空。`rehypePlugins` を確認 |
| lint: set-state-in-effect | `setHeadings` を effect 本体で直接呼んでいる。`requestAnimationFrame` のコールバック内に置く |
| ファイル切替で前の目次が残る | 抽出 effect の依存が `[content]` になっているか確認 |

## 学んだこと・メモ
- 「目次の slug を自前計算」すると本文 id とのズレ（setext・引用内・記号・重複の連番）でアンカーが外れうる。
  **id 生成をライブラリ（rehype-slug）に一本化し、目次は描画結果から読む**と、その手書き・ズレの両方を消せる。
- モバイルは「目次なし」を選択（本文の可読領域を優先）。将来入れるならフローティングボタン→シートが候補。
