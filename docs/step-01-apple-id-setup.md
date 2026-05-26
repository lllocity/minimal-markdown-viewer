# Step 01: Apple ID・署名設定

## 目的

Xcode に Apple ID を登録し、アプリに「誰が作ったか」を示す署名（Signing）を設定する。

署名がないと iOS はアプリのインストールを拒否する。無料の Apple ID でも署名は可能（ただし有効期限 7 日）。

---

## 前提条件

- [Step 00](./step-00-xcode-install.md) 完了（Xcode インストール済み）
- Apple ID（無料）を持っている

---

## 手順

### Xcode プロジェクト作成時に Team を登録する方法（今回はこの方法で実施）

プロジェクト設定画面の **Team** フィールドで「Add account...」をクリックし、Apple ID でサインインすると自動的に署名設定が完了する。

### 後から Team を変更・確認する方法

1. Xcode 左サイドバーの一番上にある **プロジェクト名**（Minimal Markdown Viewer）をクリック
2. 中央に設定画面が開く → **Targets** の `Minimal Markdown Viewer` を選択
3. **Signing & Capabilities** タブを開く
4. **Team** に自分の Apple ID が設定されていれば OK
5. 「Automatically manage signing」にチェックが入っていることを確認

---

## 無料アカウントの制約

| 項目 | 無料 Apple ID | Apple Developer Program（$99/年） |
|------|-------------|----------------------------------|
| シミュレーター実行 | 無制限 | 無制限 |
| 実機インストール | 可能（7日間有効） | 可能（1年間有効） |
| TestFlight 配布 | 不可 | 可能 |
| App Store 公開 | 不可 | 可能 |

実機に転送したアプリは **7 日後に起動できなくなる**。再び使いたいときは Xcode から再ビルド・再転送が必要。

---

## 確認ポイント

- [ ] Xcode の Signing & Capabilities に自分の Apple ID（Team）が表示されている
- [ ] 「Automatically manage signing」にチェックが入っている

---

## 学んだこと・メモ

- 署名（Signing）は「このアプリは信頼できる開発者が作った」という証明。iOS がセキュリティのために要求する
- 無料アカウントで実機テストは十分できる。App Store 公開を考えるタイミングで $99 を払えばよい
- Team を登録すると、Xcode が自動でプロビジョニングプロファイル（署名証明書）を管理してくれる

---

## 次のステップ

Step 01 完了後 → [Step 02: Xcode プロジェクト作成](./step-02-xcode-project.md) へ（実施済み）
