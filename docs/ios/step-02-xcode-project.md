# Step 02: Xcode プロジェクト作成

## 目的

Xcode で iOS アプリのプロジェクトを新規作成し、既存の git リポジトリ（`minimal-markdown-viewer/`）の中に配置する。

---

## 前提条件

- [Step 00](./step-00-xcode-install.md) 完了（Xcode 26.5 インストール済み）
- [Step 01](./step-01-apple-id-setup.md) 完了（Apple ID を Xcode に登録済み）

---

## 手順

### 1. Xcode を起動して「Create New Project...」を選択

Welcome 画面（No Recent Projects と表示されている画面）で **「Create New Project...」** をクリック。

> **「Open Existing Project」ではない理由**  
> `minimal-markdown-viewer/` フォルダには `.xcodeproj` がまだ存在しないため、Open Existing Project は使えない。プロジェクト作成後は `.xcodeproj` をダブルクリックして開く。

### 2. テンプレート選択

- タブ：上部の **「iOS」** を選択（Multiplatform ではない）
- テンプレート：**「App」** を選択
- 「Next」をクリック

| テンプレート | 選ばない理由 |
|------------|------------|
| **App** ← これ | シンプルな SwiftUI アプリの出発点 |
| Document App | ファイルの作成・編集向けの複雑なアーキテクチャ。今回は読むだけなので不要 |
| Multiplatform | iOS + macOS 両対応になり複雑化する。今回は iOS 専用でよい |

### 3. プロジェクト設定

各フィールドに以下を入力する：

| フィールド | 入力値 | 説明 |
|-----------|--------|------|
| **Product Name** | `Minimal Markdown Viewer` | アプリ名。スペースあり・単語区切りで OK |
| **Team** | 自分の Apple ID | 「Add account...」から Apple ID でサインイン |
| **Organization Identifier** | `io.github.lllocity` | 逆ドメイン形式の個人識別子 |
| **Bundle Identifier** | 自動生成される | `io.github.lllocity.Minimal-Markdown-Viewer` になる（変更不要） |
| **Interface** | SwiftUI（デフォルト） | UI の作り方。変更しない |
| **Language** | Swift（デフォルト） | 変更しない |
| **Testing System** | None（デフォルト） | 今回は自動テスト不要 |
| **Storage** | None（デフォルト） | 読むだけのアプリなのでデータ保存機能は不要 |

入力完了後「Next」をクリック。

### 4. 保存先の選択

保存先ダイアログが開く。

1. `minimal-markdown-viewer` フォルダを **ダブルクリック** して中に入る
2. **「Create Git repository on my Mac」のチェックを外す**  
   （すでに git リポジトリが存在するため、Xcode に新たに作らせない）
3. 「Create」をクリック

---

## 作成後のフォルダ構成

```
minimal-markdown-viewer/                    ← git リポジトリのルート
├── Minimal Markdown Viewer/                ← Xcode が作ったラッパーフォルダ
│   ├── Minimal Markdown Viewer/            ← Swift ソースファイル置き場
│   │   ├── MinimalMarkdownViewerApp.swift
│   │   ├── ContentView.swift
│   │   └── Assets.xcassets/
│   └── Minimal Markdown Viewer.xcodeproj  ← Xcode プロジェクトファイル
├── CLAUDE.md
├── docs/
├── SPEC.md
└── README.md
```

Xcode は保存先に指定したフォルダの**中に、プロジェクト名のラッパーフォルダをもう一つ作ってから配置する**。そのためネストが一段深くなる。これは Xcode の標準的な動作。

**プロジェクトを開くときは：**  
`minimal-markdown-viewer/Minimal Markdown Viewer/Minimal Markdown Viewer.xcodeproj` をダブルクリック

---

## 確認ポイント

- [ ] `minimal-markdown-viewer/` 内に `Minimal Markdown Viewer/` フォルダが作られた
- [ ] `minimal-markdown-viewer/` 内に `Minimal Markdown Viewer.xcodeproj` が存在する
- [ ] Xcode でプロジェクトが開かれ、左側のファイルツリーに Swift ファイルが見える
- [ ] ビルドターゲットが iOS になっている

---

## 学んだこと・メモ

- **Product Name にスペースを含めてよい**。Bundle ID ではスペースがハイフンに自動変換される
- `.xcodeproj` は Xcode のプロジェクト設定をまとめたファイル（パッケージ）。これをダブルクリックすると Xcode でプロジェクトが開く
- `Source Control: Create Git repository` は **既存の git リポジトリ内に作成する場合は必ずオフにする**
- Xcode はコード編集も可能だが、VSCode + Claude Code でコード編集 → Xcode でビルド・テスト というハイブリッドワークフローが効率的

---

## 動作確認（シミュレーター）

プロジェクト作成直後に Xcode の ▶ ボタンを押してシミュレーターで実行したところ、デフォルトの「Hello, world!」画面が表示された。Xcode のセットアップが正常であることを確認済み。

---

## 次のステップ

Step 02 完了後 → [Step 03: Info.plist の Document Types / UTI 設定](./step-03-info-plist.md) へ
